// Validation partagée des actions proposées par l’IA.
// Chargé par le navigateur (script classique) ET par la fonction Netlify (import) : source unique de vérité.
(function (g) {
  const SUBJ = ["Mathématiques", "Physique-chimie", "Français", "Histoire-géo", "Anglais", "SVT", "Philosophie"];
  const PRIO = ["haute", "moyenne", "basse"];
  const RD = /^\d{4}-\d{2}-\d{2}$/, RT = /^([01]\d|2[0-3]):[0-5]\d$/;
  const day = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const okD = (d, today) => {
    if (typeof d !== "string" || !RD.test(d)) return false;
    const t = new Date(d + "T00:00:00Z");
    return !isNaN(t) && t.toISOString().slice(0, 10) === d && Math.abs(day(d) - day(today)) <= 400;
  };
  const str = (s, n) => (typeof s === "string" && s.trim() && s.trim().length <= n) ? s.trim() : null;
  const tm = t => typeof t === "string" && RT.test(t);
  const has = v => v !== undefined && v !== null;
  function sess(s, today) {
    if (!s || typeof s !== "object") return null;
    const title = str(s.title, 100);
    if (!title || !okD(s.date, today) || !tm(s.start) || !tm(s.end) || s.start >= s.end) return null;
    return { date: s.date, start: s.start, end: s.end, title, subj: SUBJ.includes(s.subj) ? s.subj : "" };
  }
  function chg(c, today) {
    if (!c || typeof c !== "object" || !Number.isInteger(c.id)) return null;
    if (c.remove === true) return { id: c.id, remove: true };
    const o = { id: c.id };
    if (has(c.date)) { if (!okD(c.date, today)) return null; o.date = c.date; }
    if (has(c.start)) { if (!tm(c.start)) return null; o.start = c.start; }
    if (has(c.end)) { if (!tm(c.end)) return null; o.end = c.end; }
    if (has(c.title)) { const t = str(c.title, 100); if (!t) return null; o.title = t; }
    return Object.keys(o).length > 1 ? o : null;
  }
  function cleanAction(a, today) {
    if (!a || typeof a !== "object") return null;
    if (a.type === "create_task") {
      const t = str(a.title, 120);
      if (!t || !SUBJ.includes(a.subj) || !okD(a.due, today) || !PRIO.includes(a.prio) || !Number.isInteger(a.dur) || a.dur < 5 || a.dur > 600) return null;
      return { type: a.type, subj: a.subj, title: t, due: a.due, prio: a.prio, dur: a.dur };
    }
    if (a.type === "create_reminder") {
      const t = str(a.title, 120);
      if (!t || !tm(a.time)) return null;
      if (a.kind === "once" && okD(a.date, today)) return { type: a.type, title: t, time: a.time, kind: "once", date: a.date, days: [] };
      if (a.kind === "rec" && Array.isArray(a.days)) {
        const d = [...new Set(a.days.filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
        if (d.length) return { type: a.type, title: t, time: a.time, kind: "rec", date: "", days: d };
      }
      return null;
    }
    if (a.type === "plan_week") {
      const s = (Array.isArray(a.sessions) ? a.sessions : []).slice(0, 12).map(x => sess(x, today)).filter(Boolean);
      return s.length ? { type: a.type, summary: str(a.summary, 200) || "", sessions: s } : null;
    }
    if (a.type === "update_plan") {
      const c = (Array.isArray(a.changes) ? a.changes : []).slice(0, 12).map(x => chg(x, today)).filter(Boolean);
      return c.length ? { type: a.type, changes: c } : null;
    }
    return null;
  }
  const cleanMany = (list, today, max = 4) => (Array.isArray(list) ? list : []).slice(0, max).map(a => cleanAction(a, today)).filter(Boolean);
  g.NovaActions = { SUBJ, PRIO, cleanAction, cleanMany };
})(globalThis);
