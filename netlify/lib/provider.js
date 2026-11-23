import "../../public/actions.js";

// Adaptateur fournisseur d’IA (ici : API Messages d’Anthropic). Pour changer de fournisseur,
// il suffit de réécrire callModel() en gardant la même sortie : { text, actions }.
const API = "https://api.anthropic.com/v1/messages";
const SUBJ = globalThis.NovaActions.SUBJ;
const D = { type: "string", description: "Date AAAA-MM-JJ" };
const H = { type: "string", description: "Heure HH:MM (24 h)" };
const T = { type: "string", maxLength: 100 };

export const TOOLS = [
  { name: "create_task", description: "Propose de créer une tâche. L’élève devra confirmer.",
    input_schema: { type: "object", required: ["subj", "title", "due", "prio", "dur"], properties: {
      subj: { type: "string", enum: SUBJ }, title: { type: "string", maxLength: 120 }, due: D,
      prio: { type: "string", enum: ["haute", "moyenne", "basse"] }, dur: { type: "integer", description: "Durée estimée en minutes (5 à 600)" } } } },
  { name: "create_reminder", description: "Propose de créer un rappel unique (kind once + date) ou récurrent (kind rec + days).",
    input_schema: { type: "object", required: ["title", "time", "kind"], properties: {
      title: { type: "string", maxLength: 120 }, time: H, kind: { type: "string", enum: ["once", "rec"] }, date: D,
      days: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 }, description: "0 = lundi … 6 = dimanche" } } } },
  { name: "plan_week", description: "Propose un ensemble de séances de travail pour organiser des jours ou une semaine. À appeler une seule fois.",
    input_schema: { type: "object", required: ["sessions"], properties: {
      summary: { type: "string", maxLength: 200 },
      sessions: { type: "array", maxItems: 12, items: { type: "object", required: ["date", "start", "end", "title"],
        properties: { date: D, start: H, end: H, title: T, subj: { type: "string", enum: SUBJ } } } } } } },
  { name: "update_plan", description: "Propose de déplacer, renommer ou supprimer des séances de travail existantes (liste sessions, par id). Les cours fixes ne sont pas modifiables.",
    input_schema: { type: "object", required: ["changes"], properties: {
      changes: { type: "array", maxItems: 12, items: { type: "object", required: ["id"],
        properties: { id: { type: "integer" }, date: D, start: H, end: H, title: T, remove: { type: "boolean" } } } } } } },
];

export class ProviderError extends Error {
  constructor(kind, status, retryAfter) { super(kind); this.kind = kind; this.status = status; this.retryAfter = retryAfter; }
}

export async function callModel({ system, messages }) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Number(process.env.NOVA_TIMEOUT_MS) || 22000);
  let res;
  try {
    res = await fetch(API, {
      method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.NOVA_MODEL || "claude-sonnet-5-5", max_tokens: 1200, system, messages, tools: TOOLS }),
    });
  } catch (e) {
    throw new ProviderError(e.name === "AbortError" ? "timeout" : "network");
  } finally { clearTimeout(timer); }
  if (!res.ok) {
    const ra = Number(res.headers.get("retry-after")) || undefined;
    throw new ProviderError(res.status === 429 ? "rate_limited" : (res.status === 401 || res.status === 403) ? "auth" : "upstream", res.status, ra);
  }
  const j = await res.json();
  let text = ""; const actions = [];
  for (const b of j.content || []) {
    if (b.type === "text") text += b.text;
    else if (b.type === "tool_use") actions.push({ ...b.input, type: b.name });
  }
  return { text: text.trim(), actions };
}
