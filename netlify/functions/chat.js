import "../../public/actions.js";
import { buildSystem } from "../lib/prompt.js";
import { callModel, ProviderError } from "../lib/provider.js";
import { allow } from "../lib/limits.js";

// Endpoint POST /chat  (GET /chat : indique seulement si l’IA est configurée, sans rien révéler d’autre)
// La clé du fournisseur est lue ici, côté serveur, dans process.env.ANTHROPIC_API_KEY. Elle n’est jamais renvoyée.
const MAX_BODY = 60_000;

const headers = () => {
  const o = process.env.ALLOWED_ORIGIN;
  return { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    ...(o ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", Vary: "Origin" } : {}) };
};
const reply = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers(), ...extra } });
const fail = (status, code, message, retryAfter) =>
  reply(status, { ok: false, code, message, ...(retryAfter ? { retryAfter } : {}) }, retryAfter ? { "Retry-After": String(retryAfter) } : {});

function cleanMessages(m) {
  if (!Array.isArray(m)) return null;
  const out = m.slice(-12).filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
    .map(x => ({ role: x.role, content: x.content.slice(0, 1500) }));
  while (out.length && out[0].role !== "user") out.shift();
  return out.length && out[out.length - 1].role === "user" ? out : null;
}

// Ne transmet au modèle que des champs connus, tronqués : le client n’est jamais cru sur parole.
function cleanCtx(c) {
  c = c && typeof c === "object" ? c : {};
  const A = (a, n, f) => (Array.isArray(a) ? a.slice(0, n) : []).map(x => f(x && typeof x === "object" ? x : {}));
  const s = (v, n = 120) => (typeof v === "string" ? v.slice(0, n) : "");
  const n = v => (Number.isFinite(v) ? v : 0);
  const p = c.profile && typeof c.profile === "object" ? c.profile : {};
  return {
    today: /^\d{4}-\d{2}-\d{2}$/.test(c.today) ? c.today : new Date().toISOString().slice(0, 10),
    weekday: s(c.weekday, 12), weekStart: s(c.weekStart, 10),
    profile: { name: s(p.name, 40), level: s(p.level, 40) },
    tasks: A(c.tasks, 40, t => ({ id: n(t.id), subj: s(t.subj, 30), title: s(t.title), due: s(t.due, 10), prio: s(t.prio, 10), dur: n(t.dur), done: !!t.done })),
    reminders: A(c.reminders, 30, r => ({ id: n(r.id), title: s(r.title), time: s(r.time, 5), kind: s(r.kind, 4), date: s(r.date, 10), days: Array.isArray(r.days) ? r.days.filter(Number.isInteger).slice(0, 7) : [], on: !!r.on })),
    sessions: A(c.sessions, 40, x => ({ id: n(x.id), date: s(x.date, 10), start: s(x.start, 5), end: s(x.end, 5), title: s(x.title, 100), subj: s(x.subj, 30) })),
    timetable: A(c.timetable, 40, e => ({ day: n(e.day), start: s(e.start, 5), end: s(e.end, 5), title: s(e.title, 60), type: s(e.type, 1) })),
    exams: A(c.exams, 10, e => ({ title: s(e.title, 60), subj: s(e.subj, 30), date: s(e.date, 10) })),
  };
}

const PROVIDER = { timeout: [504, "timeout"], network: [502, "upstream_error"], rate_limited: [503, "upstream_busy"], auth: [503, "ai_unavailable"], upstream: [502, "upstream_error"] };

export default async (req, context) => {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin && origin !== process.env.ALLOWED_ORIGIN) return fail(403, "forbidden", "Origine non autorisée.");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers() });
  if (req.method === "GET") return reply(200, { ok: true, configured: Boolean(process.env.ANTHROPIC_API_KEY) });
  if (req.method !== "POST") return fail(405, "bad_request", "Méthode non autorisée.");
  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "not_configured", "NOVA AI n’est pas encore connectée.");

  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "inconnue";
  const rl = allow(ip);
  if (!rl.ok) return fail(429, rl.daily ? "daily_limit" : "rate_limited", "Limite d’utilisation atteinte.", rl.retryAfter);

  let raw;
  try { raw = await req.text(); } catch { return fail(400, "bad_request", "Requête illisible."); }
  if (raw.length > MAX_BODY) return fail(413, "too_large", "Requête trop volumineuse.");
  let body;
  try { body = JSON.parse(raw); } catch { return fail(400, "bad_request", "JSON invalide."); }
  const messages = cleanMessages(body?.messages);
  if (!messages) return fail(400, "bad_request", "Messages invalides.");
  const ctx = cleanCtx(body.context);

  try {
    const out = await callModel({ system: buildSystem(ctx), messages });
    const actions = globalThis.NovaActions.cleanMany(out.actions, ctx.today);
    const text = out.text || (actions.length ? "Voici ce que je te propose. Tu peux confirmer ou ignorer chaque action." : "");
    if (!text) return fail(502, "empty_response", "Réponse vide.");
    return reply(200, { ok: true, text, actions });
  } catch (e) {
    if (e instanceof ProviderError) {
      console.error("chat: erreur fournisseur", e.kind, e.status || ""); // « auth » = clé invalide ou sans droits : vérifier la variable d’environnement
      const [status, code] = PROVIDER[e.kind] || [502, "upstream_error"];
      return fail(status, code, "Service d’IA indisponible.", e.retryAfter);
    }
    console.error("chat: erreur inattendue", e?.name);
    return fail(500, "upstream_error", "Erreur inattendue.");
  }
};

export const config = { path: "/chat" };
