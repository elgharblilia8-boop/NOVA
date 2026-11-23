// Limiteur d’usage « au mieux » : en mémoire, par adresse IP, propre à chaque instance de la fonction.
// Il protège des abus simples. Pour une limite stricte, ajouter une limitation au niveau de la plateforme (voir README).
const hits = new Map();
export function allow(key, { perMin = Number(process.env.NOVA_RATE_PER_MIN) || 8, perDay = Number(process.env.NOVA_RATE_PER_DAY) || 80 } = {}) {
  const now = Date.now();
  const h = (hits.get(key) || []).filter(t => now - t < 864e5);
  const min = h.filter(t => now - t < 6e4);
  if (min.length >= perMin) return { ok: false, retryAfter: Math.ceil((6e4 - (now - min[0])) / 1e3) };
  if (h.length >= perDay) return { ok: false, daily: true, retryAfter: Math.ceil((864e5 - (now - h[0])) / 1e3) };
  h.push(now); hits.set(key, h);
  if (hits.size > 5000) hits.clear();
  return { ok: true };
}
