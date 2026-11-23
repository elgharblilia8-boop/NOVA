import test from "node:test";
import assert from "node:assert/strict";

process.env.ANTHROPIC_API_KEY = "cle-factice-pour-test";
const { default: handler } = await import("../netlify/functions/chat.js");

const today = new Date().toISOString().slice(0, 10);
const post = (ip) => handler(new Request("http://localhost/chat", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "Aide-moi" }], context: { today, tasks: [] } }) }), { ip });
const mock = (status, body, headers = {}) => { globalThis.fetch = async () => new Response(JSON.stringify(body), { status, headers }); };
const ok = { content: [{ type: "text", text: "Ok" }] };

test("GET indique que l’IA est configurée", async () => {
  const r = await handler(new Request("http://localhost/chat"), { ip: "t0" });
  assert.deepEqual(await r.json(), { ok: true, configured: true });
});
test("sans clé : 503 not_configured", async () => {
  const k = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  const r = await post("t1"); process.env.ANTHROPIC_API_KEY = k;
  assert.equal(r.status, 503); assert.equal((await r.json()).code, "not_configured");
});
test("garde les actions valides, retire les invalides", async () => {
  mock(200, { content: [{ type: "text", text: "Voici." },
    { type: "tool_use", name: "create_reminder", input: { title: "Réviser", time: "18:00", kind: "rec", days: [0, 2] } },
    { type: "tool_use", name: "create_task", input: { subj: "Piano", title: "x", due: "2026-13-40", prio: "haute", dur: 30 } },
    { type: "tool_use", name: "supprimer_tout", input: {} }] });
  const j = await (await post("t2")).json();
  assert.equal(j.ok, true); assert.equal(j.actions.length, 1); assert.equal(j.actions[0].type, "create_reminder");
});
test("la clé n’est jamais renvoyée au client", async () => {
  mock(200, ok);
  assert.ok(!(await (await post("t3")).text()).includes("cle-factice-pour-test"));
});
test("erreurs du fournisseur", async () => {
  mock(429, {}, { "retry-after": "12" });
  let j = await (await post("t4")).json();
  assert.equal(j.code, "upstream_busy"); assert.equal(j.retryAfter, 12);
  mock(401, {}); j = await (await post("t5")).json(); assert.equal(j.code, "ai_unavailable");
  mock(500, {}); j = await (await post("t6")).json(); assert.equal(j.code, "upstream_error");
});
test("limite d’utilisation", async () => {
  process.env.NOVA_RATE_PER_MIN = "2"; mock(200, ok);
  await post("t7"); await post("t7"); const r = await post("t7");
  delete process.env.NOVA_RATE_PER_MIN;
  assert.equal(r.status, 429); assert.equal((await r.json()).code, "rate_limited");
});
test("requête invalide et origine étrangère", async () => {
  let r = await handler(new Request("http://localhost/chat", { method: "POST", body: "pas du json" }), { ip: "t8" });
  assert.equal(r.status, 400);
  r = await handler(new Request("http://localhost/chat", { method: "POST", headers: { origin: "https://autre.site" }, body: "{}" }), { ip: "t9" });
  assert.equal(r.status, 403);
});
