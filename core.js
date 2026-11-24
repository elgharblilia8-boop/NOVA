/* NOVA 2.0 : logique métier, sans accès au DOM (testable avec Node). Tout est stocké localement. */
(function (g) {
"use strict";
const N = g.N = { version: "2.0.0" };
const pad = n => String(n).padStart(2, "0");

/* ---------- dates et utilitaires ---------- */
N.nowFn = () => new Date();
N.clock = () => Date.now();
N.today = () => { const d = N.nowFn(); d.setHours(0, 0, 0, 0); return d; };
N.iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
N.todayS = () => N.iso(N.today());
N.parse = s => new Date(s + "T00:00");
N.addDays = (s, n) => { const d = N.parse(s); d.setDate(d.getDate() + n); return N.iso(d); };
N.diff = (s, from) => Math.round((N.parse(s) - N.parse(from || N.todayS())) / 864e5);
N.dow = s => (N.parse(s).getDay() + 6) % 7;
N.monday = s => N.addDays(s, -N.dow(s));
N.mins = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
N.hm = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
N.dur = m => m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + pad(m % 60) : "");
N.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
N.by = (a, id) => a.find(x => String(x.id) === String(id));
N.fmtD = (s, o) => N.parse(s).toLocaleDateString("fr-FR", o);
N.rel = s => { const n = N.diff(s); return n < 0 ? "À rattraper" : n === 0 ? "Aujourd’hui" : n === 1 ? "Demain" : n < 7 ? N.fmtD(s, { weekday: "long" }) : N.fmtD(s, { day: "numeric", month: "short" }); };
N.f1 = v => v == null || isNaN(v) ? "–" : (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
N.DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
N.DAYS_L = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
N.CATS = { priorite: "Priorité", secondaire: "Secondaire", bonus: "Bonus" };
N.CAT_ORDER = { priorite: 0, secondaire: 1, bonus: 2 };
N.COLORS = ["#5C1A2E", "#A0596B", "#C98B86", "#8A6A4F", "#6E7F6A", "#7B6A8A", "#4F5D75", "#B08968"];

/* ---------- stockage local et migration ---------- */
N.Store = { key: "nova.v1", ad: {
  get(k) { try { return g.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { g.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { g.localStorage.removeItem(k); } catch (e) {} } } };
N.defaults = () => ({ v: 3, profile: { name: "", level: "" },
  settings: { welcomed: false, demo: false, base: 20, targetAvg: 14,
    planner: { wk: ["16:45", "20:30"], we: ["10:00", "17:00"], maxBlock: 60, brk: 10, maxDay: 180 },
    focus: { work: 25, brk: 5, long: 15, every: 4, goal: 90 } },
  tasks: [], rems: [], sessions: [], events: [], exams: [], subjects: [], grades: [], rewards: [], focusLog: [] });
const ARR = ["tasks", "rems", "sessions", "events", "exams", "subjects", "grades", "rewards", "focusLog"];
const isO = v => v && typeof v === "object" && !Array.isArray(v);
const merge = (d, r) => { const o = { ...d }; if (isO(r)) for (const k of Object.keys(r)) o[k] = isO(d[k]) && isO(r[k]) ? merge(d[k], r[k]) : r[k]; return o; };

const SUBJ_SEED = [["Mathématiques", 4, 15], ["Physique-chimie", 3, 14], ["Français", 3, 13], ["Histoire-géo", 2, 13], ["Anglais", 2, 15], ["SVT", 2, 14], ["Philosophie", 3, 12]];
const EV_SEED = [[0, "08:00", "10:00", "Mathématiques", "cours", "Salle 214"], [0, "10:15", "12:15", "Français", "cours", "Salle 108"], [0, "14:00", "16:00", "Physique-chimie", "cours", "Labo 2"],
  [1, "08:00", "09:00", "Anglais", "cours", "Salle 301"], [1, "09:00", "11:00", "SVT", "cours", "Labo 1"], [1, "13:30", "15:30", "Histoire-géo", "cours", "Salle 112"], [1, "18:00", "19:00", "Basket", "activite", "Gymnase"],
  [2, "08:00", "10:00", "Mathématiques", "cours", "Salle 214"], [2, "10:15", "12:15", "Philosophie", "cours", "Salle 205"],
  [3, "08:00", "10:00", "Physique-chimie", "cours", "Labo 2"], [3, "10:15", "12:15", "Philosophie", "cours", "Salle 205"],
  [4, "08:00", "10:00", "Français", "cours", "Salle 108"], [4, "10:15", "12:15", "Anglais", "cours", "Salle 301"], [4, "14:00", "16:00", "SVT", "cours", "Labo 1"], [4, "17:00", "18:00", "Piano", "activite", "Conservatoire"],
  [5, "15:00", "17:00", "Sortie avec Inès", "activite", "Centre-ville"]];

N.seedBase = db => {
  const t = N.todayS();
  db.subjects = SUBJ_SEED.map((s, i) => ({ id: "s" + i, name: s[0], coef: s[1], target: s[2], c: N.COLORS[i] }));
  db.events = EV_SEED.map((e, i) => ({ id: "e" + i, day: e[0], start: e[1], end: e[2], title: e[3], kind: e[4], place: e[5] }));
  db.exams = [[4, "DS de mathématiques", "Mathématiques", "15:00", "17:00"], [9, "Contrôle de physique-chimie", "Physique-chimie", "14:00", "15:00"], [17, "Bac blanc de français", "Français", "09:00", "13:00"]]
    .map((x, i) => ({ id: "x" + i, date: N.addDays(t, x[0]), title: x[1], subj: x[2], start: x[3], end: x[4] }));
  db.rewards = [
    { id: "r1", name: "Pause café", desc: "Dix minutes pour savourer un café.", icon: "☕", link: { type: "milestone", kind: "tasks_today", n: 2 }, status: "locked" },
    { id: "r2", name: "Un épisode de série", desc: "Un épisode, sans culpabilité.", icon: "🎬", link: { type: "milestone", kind: "tasks_today", n: 3 }, status: "locked" },
    { id: "r3", name: "Playlist préférée", desc: "Dix minutes de musique tranquille.", icon: "🎧", link: { type: "milestone", kind: "focus_today", n: 25 }, status: "locked" }];
};
N.seedAll = db => {
  N.seedBase(db);
  const t = N.todayS(), d = n => N.addDays(t, n);
  db.tasks = [["t1", "Mathématiques", "Exercices sur les suites, fiche 7", 1, 3, 45], ["t2", "Français", "Dissertation : plan détaillé", 2, 3, 90], ["t3", "Physique-chimie", "Compte rendu de TP", 2, 2, 60],
    ["t5", "SVT", "Fiches de révision : génétique", 5, 2, 75], ["t6", "Histoire-géo", "Croquis sur la mondialisation", 6, 1, 40], ["t7", "Philosophie", "Lecture : Le Mythe de Sisyphe, chapitre 2", 8, 1, 50],
    ["t8", "Anglais", "Regarder un reportage en anglais", 10, 1, 30], ["t9", "Mathématiques", "Refaire les exercices du dernier DS", 7, 2, 60]]
    .map(a => ({ id: a[0], subj: a[1], title: a[2], due: d(a[3]), imp: a[4], dur: a[5], done: false, doneAt: null, catMode: "auto", cat: null }));
  [["t4", "Anglais", "Vocabulaire de l’unité 5", -1, 1, 20, -1], ["t10", "Français", "Fiche de lecture", -2, 2, 40, -3], ["t11", "Physique-chimie", "Exercices sur les ondes", -3, 2, 45, -4], ["t12", "SVT", "Schéma de la méiose", -5, 1, 30, -6]]
    .forEach(a => db.tasks.push({ id: a[0], subj: a[1], title: a[2], due: d(a[3]), imp: a[4], dur: a[5], done: true, doneAt: d(a[6]), catMode: "auto", cat: null }));
  db.rewards.push({ id: "r4", name: "Lecture plaisir", desc: "Vingt minutes dans ton livre du moment.", icon: "📖", link: { type: "task", taskId: "t2" }, status: "locked" });
  db.grades = [[0, "Contrôle sur les suites", 13, 20, 2, -30], [0, "DS fonctions", 15, 20, 3, -14], [0, "Interro dérivées", 12, 20, 1, -6], [1, "TP noté", 14, 20, 1, -21], [1, "DS ondes", 11, 20, 3, -9],
    [2, "Commentaire composé", 13, 20, 3, -25], [2, "Oral", 15, 20, 2, -8], [3, "Composition", 12, 20, 3, -18], [3, "Croquis", 14, 20, 1, -4], [4, "Quiz de vocabulaire", 8, 10, 1, -12],
    [4, "Expression écrite", 15, 20, 2, -3], [5, "Contrôle génétique", 13, 20, 2, -16], [5, "TP noté", 16, 20, 1, -7], [6, "Dissertation", 11, 20, 4, -20]]
    .map((a, i) => ({ id: "g" + i, subjId: "s" + a[0], title: a[1], value: a[2], scale: a[3], coef: a[4], date: d(a[5]) }));
  [2, 0, 3, 1, 0, 2, 4, 1, 2].forEach((n, i) => { for (let j = 0; j < n; j++) db.focusLog.push({ id: "f" + i + "-" + j, date: d(i - 9), start: N.hm(17 * 60 + j * 35), min: j === 2 ? 45 : 25, taskId: "", subj: "" }); });
  db.rems = [{ id: "m1", title: "Apporter la calculatrice graphique", time: "07:30", kind: "once", date: d(1), days: [], on: true },
    { id: "m2", title: "Réviser les fiches du jour", time: "18:00", kind: "rec", date: "", days: [0, 2, 4], on: true },
    { id: "m3", title: "Préparer le plan de la semaine", time: "16:00", kind: "rec", date: "", days: [6], on: true },
    { id: "m4", title: "Rendre l’autorisation de sortie", time: "08:00", kind: "once", date: d(2), days: [], on: false }];
  db.settings.demo = true;
};
N.emptyDb = (keep) => { const db = N.defaults(); db.subjects = SUBJ_SEED.map((s, i) => ({ id: "s" + i, name: s[0], coef: s[1], target: s[2], c: N.COLORS[i] })); db.settings.welcomed = true; if (keep) db.profile = keep; return db; };

N.upTask = t => ({ ...t, id: t.id ?? N.uid(), subj: t.subj || "Autre", imp: t.imp || ({ haute: 3, moyenne: 2, basse: 1 }[t.prio] || 2),
  catMode: t.catMode || "auto", cat: t.cat || null, doneAt: t.doneAt ?? null, dur: +t.dur || 30, done: !!t.done });
N.ensureSubjects = db => {
  const names = new Set(db.subjects.map(s => s.name));
  db.tasks.forEach(t => { if (t.subj && t.subj !== "Autre" && !names.has(t.subj)) { names.add(t.subj); db.subjects.push({ id: "s" + N.uid(), name: t.subj, coef: 1, target: null, c: N.COLORS[db.subjects.length % N.COLORS.length] }); } });
};
/* Migration : v1/v2 (tâches, rappels, séances) vers v3. Les données existantes sont conservées telles quelles. */
N.migrate = raw => {
  const db = N.defaults();
  if (!raw || typeof raw !== "object") { N.seedAll(db); return { db, from: 0 }; }
  const from = raw.v || 1;
  if (from >= 3) { const m = merge(db, raw); ARR.forEach(k => { if (!Array.isArray(m[k])) m[k] = []; }); return { db: m, from }; }
  db.tasks = (Array.isArray(raw.tasks) ? raw.tasks : []).map(N.upTask);
  db.rems = Array.isArray(raw.rems) ? raw.rems : [];
  db.sessions = (Array.isArray(raw.sessions) ? raw.sessions : []).map(s => ({ kind: "etude", taskId: "", ...s }));
  N.seedBase(db); N.ensureSubjects(db);
  return { db, from };
};
N.init = () => {
  const A = N.Store.ad, raw = A.get(N.Store.key); let parsed = null, corrupt = false;
  if (raw) { try { parsed = JSON.parse(raw); } catch (e) { corrupt = true; } }
  const r = N.migrate(parsed); N.db = r.db; N.migratedFrom = r.from;
  if (corrupt) A.set(N.Store.key + ".corrupt", raw);
  else if (parsed && r.from < 3) A.set(N.Store.key + ".backup-v" + r.from, raw);
  N.save(); N.run = N.loadRun(); const res = N.runTick(); if (res) N.pendingDone = res;
  return N.db;
};
N.save = () => (N.saveOk = N.Store.ad.set(N.Store.key, JSON.stringify(N.db)));
N.subjColor = n => ((N.db.subjects.find(s => s.name === n)) || {}).c || "#C98B86";

/* ---------- tâches : classification, tri, jour ---------- */
N.openTasks = () => N.db.tasks.filter(t => !t.done);
N.urgent = t => N.diff(t.due) <= ((t.imp || 2) >= 3 ? 3 : 2);
N.suggest = t => { const imp = (t.imp || 2) >= 2, u = N.urgent(t); return imp && u ? "priorite" : !imp && !u ? "bonus" : "secondaire"; };
N.why = t => { const imp = (t.imp || 2) >= 2, u = N.urgent(t); return imp && u ? "Important et proche : à faire en premier" : !imp && !u ? "Facultatif et sans urgence : un bonus" : imp ? "Important, mais l’échéance est encore loin" : "Échéance proche, importance modérée"; };
N.effCat = t => t.catMode === "manual" && N.CATS[t.cat] ? t.cat : N.suggest(t);
N.sortTasks = (l, by) => {
  const c = (a, b) => a < b ? -1 : a > b ? 1 : 0, due = (a, b) => c(a.due, b.due) || (b.imp || 2) - (a.imp || 2), cat = a => N.CAT_ORDER[N.effCat(a)];
  const f = { due, cat: (a, b) => cat(a) - cat(b) || due(a, b), subj: (a, b) => c(a.subj, b.subj) || due(a, b), dur: (a, b) => a.dur - b.dur || due(a, b), imp: (a, b) => (b.imp || 2) - (a.imp || 2) || due(a, b) }[by] || due;
  return l.slice().sort(f);
};
N.focusSets = () => { const o = N.sortTasks(N.openTasks(), "cat"), p = o.filter(t => N.effCat(t) === "priorite");
  return { pri: p.slice(0, 3), sec: o.filter(t => N.effCat(t) === "secondaire").concat(p.slice(3)), bonus: o.filter(t => N.effCat(t) === "bonus") }; };
N.doneOn = d => N.db.tasks.filter(t => t.done && t.doneAt === d);
N.focusMin = d => N.db.focusLog.filter(f => f.date === d).reduce((a, f) => a + f.min, 0);
N.dayProgress = () => { const t0 = N.todayS(), s = N.focusSets(), ids = new Set(s.pri.map(t => t.id));
  N.openTasks().forEach(t => { if (t.due === t0) ids.add(t.id); });
  const done = N.doneOn(t0).length, total = done + ids.size; return { done, total, pct: total ? Math.round(done / total * 100) : 0 }; };
N.toggleTask = id => { const t = N.by(N.db.tasks, id); if (!t) return null; t.done = !t.done; t.doneAt = t.done ? N.todayS() : null;
  const unlocked = t.done ? N.checkRewards() : []; N.save(); return { task: t, unlocked }; };
N.removeTask = id => { N.db.tasks = N.db.tasks.filter(t => String(t.id) !== String(id));
  N.db.rewards.forEach(r => { if (r.link && r.link.type === "task" && String(r.link.taskId) === String(id)) r.link = { type: "none" }; });
  N.db.sessions.forEach(s => { if (String(s.taskId) === String(id)) s.taskId = ""; }); N.save(); };
N.linkReward = (rid, t) => {
  N.db.rewards.forEach(r => { if (r.link && r.link.type === "task" && String(r.link.taskId) === String(t.id) && String(r.id) !== String(rid)) { r.link = { type: "none" }; if (r.status !== "used") r.status = "unlocked"; } });
  if (rid) { const r = N.by(N.db.rewards, rid); if (r && !(r.link.type === "task" && String(r.link.taskId) === String(t.id))) { r.link = { type: "task", taskId: t.id }; r.status = "locked"; } }
};

/* ---------- récompenses ---------- */
N.rwProgress = r => {
  const l = r.link || { type: "none" };
  if (l.type === "task") { const t = N.by(N.db.tasks, l.taskId); return t ? { cur: t.done ? 1 : 0, need: 1, label: t.done ? "Tâche terminée" : "Termine « " + t.title + " »" } : { cur: 1, need: 1, label: "Récompense libre" }; }
  if (l.type === "milestone") { const t0 = N.todayS(), base = r.baseDate === t0 ? r.base || 0 : 0;
    const cur = Math.max(0, (l.kind === "tasks_today" ? N.doneOn(t0).length : N.focusMin(t0)) - base);
    return { cur, need: l.n, label: l.kind === "tasks_today" ? "Terminer " + l.n + " tâche" + (l.n > 1 ? "s" : "") + " aujourd’hui" : l.n + " min de focus aujourd’hui" }; }
  return { cur: 1, need: 1, label: "Récompense libre" };
};
N.checkRewards = () => { const out = [];
  for (const r of N.db.rewards) { if (r.status !== "locked") continue; const p = N.rwProgress(r); if (p.cur >= p.need) { r.status = "unlocked"; r.unlockedAt = N.todayS(); out.push(r); } }
  return out; };
N.nextReward = () => { let best = null;
  for (const r of N.db.rewards) { if (r.status !== "locked") continue; const p = N.rwProgress(r), q = p.cur / p.need; if (!best || q > best.q) best = { r, p, q }; }
  return best; };
N.useReward = id => { const r = N.by(N.db.rewards, id); if (r && r.status === "unlocked") { r.status = "used"; r.usedAt = N.todayS(); N.save(); } };
N.rearmReward = id => { const r = N.by(N.db.rewards, id); if (!r || r.status !== "used") return;
  const l = r.link || { type: "none" };
  if (l.type === "none") r.status = "unlocked";
  else if (l.type === "milestone") { r.status = "locked"; r.baseDate = N.todayS(); r.base = l.kind === "tasks_today" ? N.doneOn(N.todayS()).length : N.focusMin(N.todayS()); }
  else { r.status = "locked"; r.link = { type: "none" }; r.status = "unlocked"; }
  N.save(); };

/* ---------- planner ---------- */
N.window = date => { const p = N.db.settings.planner, w = N.dow(date) < 5 ? p.wk : p.we; return [N.mins(w[0]), N.mins(w[1])]; };
N.items = (date, extra) => {
  const d = N.dow(date), o = [], sj = e => e.subj || ((N.db.subjects.find(s => s.name === e.title)) || {}).name || "";
  N.db.events.filter(e => +e.day === d).forEach(e => o.push({ src: "event", id: e.id, kind: e.kind, title: e.title, s: e.start, e: e.end, subj: sj(e), place: e.place || "" }));
  N.db.exams.filter(x => x.date === date).forEach(x => o.push({ src: "exam", id: x.id, kind: "exam", title: x.title, s: x.start, e: x.end, subj: x.subj || "", place: "" }));
  N.db.sessions.concat(extra || []).filter(s => s.date === date).forEach(s => o.push({ src: "session", id: s.id, kind: s.kind || "etude", title: s.title, s: s.s, e: s.e, subj: s.subj || "", taskId: s.taskId }));
  return o.sort((a, b) => a.s.localeCompare(b.s) || a.e.localeCompare(b.e));
};
N.free = (date, o) => {
  o = o || {}; let [ws, we] = N.window(date); ws = Math.max(ws, o.from || 0);
  const busy = N.items(date, o.extra).map(i => [N.mins(i.s), N.mins(i.e)]).sort((a, b) => a[0] - b[0]), out = []; let cur = ws;
  for (const [s, e] of busy) { if (e <= cur) continue; if (s > cur && Math.min(s, we) > cur) out.push([cur, Math.min(s, we)]); cur = Math.max(cur, e); if (cur >= we) break; }
  if (cur < we) out.push([cur, we]);
  return out.filter(x => x[1] - x[0] >= (o.min || 15)).map(x => ({ s: x[0], e: x[1] }));
};
N.conflict = (date, s, e, ignore) => N.items(date).find(i => !(ignore && i.src === "session" && String(i.id) === String(ignore)) && N.mins(i.s) < N.mins(e) && N.mins(s) < N.mins(i.e));
N.studyMin = (date, extra) => N.items(date, extra).filter(i => i.kind === "etude").reduce((a, i) => a + N.mins(i.e) - N.mins(i.s), 0);
/* Propose des séances pour les tâches ouvertes : échéance respectée, pas de chevauchement, pauses, plafond quotidien. */
N.autoPlan = () => {
  const P = N.db.settings.planner, t0 = N.todayS(), now = N.nowFn(), nowMin = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5, out = [], left = [];
  for (const t of N.sortTasks(N.openTasks(), "cat")) {
    let rem = t.dur - N.db.sessions.filter(s => String(s.taskId) === String(t.id) && s.date >= t0 && s.kind === "etude").reduce((a, s) => a + N.mins(s.e) - N.mins(s.s), 0);
    if (rem <= 0) continue;
    const last = N.diff(t.due) < 0 ? 0 : Math.min(N.diff(t.due), 14);
    for (let k = 0; k <= last && rem > 0; k++) {
      const date = N.addDays(t0, k);
      for (;;) {
        if (rem <= 0) break;
        const used = N.studyMin(date, out); if (used >= P.maxDay) break;
        const sl = N.free(date, { extra: out, min: Math.min(rem, 20), from: k === 0 ? nowMin : 0 })[0]; if (!sl) break;
        const len = Math.min(rem, P.maxBlock, sl.e - sl.s, P.maxDay - used); if (len < Math.min(rem, 20)) break;
        out.push({ id: N.uid(), date, s: N.hm(sl.s), e: N.hm(sl.s + len), title: t.title, subj: t.subj, taskId: t.id, kind: "etude" }); rem -= len;
        if (sl.s + len + P.brk <= sl.e) out.push({ id: N.uid(), date, s: N.hm(sl.s + len), e: N.hm(sl.s + len + P.brk), title: "Pause", subj: "", taskId: "", kind: "pause" });
      }
    }
    if (rem > 0) left.push({ task: t, min: rem });
  }
  return { blocks: out.filter(b => b.kind !== "pause" || out.some(n => n.kind === "etude" && n.date === b.date && n.s === b.e)), left };
};

/* ---------- notes ---------- */
N.avg = (gr, base) => { const c = gr.reduce((a, x) => a + (+x.coef || 1), 0); return c ? gr.reduce((a, x) => a + x.value / x.scale * base * (+x.coef || 1), 0) / c : null; };
N.subjAvg = sid => N.avg(N.db.grades.filter(g2 => g2.subjId === sid), N.db.settings.base);
N.overall = () => { let n = 0, c = 0; N.db.subjects.forEach(s => { const a = N.subjAvg(s.id); if (a != null) { n += a * (+s.coef || 1); c += +s.coef || 1; } }); return c ? n / c : null; };
N.avgSeries = (sid) => { const gr = N.db.grades.filter(x => !sid || x.subjId === sid).sort((a, b) => a.date.localeCompare(b.date)), base = N.db.settings.base, out = [];
  if (sid) gr.forEach((x, i) => out.push({ x: N.fmtD(x.date, { day: "numeric", month: "short" }), y: N.avg(gr.slice(0, i + 1), base) }));
  else gr.forEach((x, i) => { const upto = gr.slice(0, i + 1); let n = 0, c = 0;
    N.db.subjects.forEach(s => { const a = N.avg(upto.filter(z => z.subjId === s.id), base); if (a != null) { n += a * (+s.coef || 1); c += +s.coef || 1; } });
    out.push({ x: N.fmtD(x.date, { day: "numeric", month: "short" }), y: c ? n / c : 0 }); });
  return out; };
N.renameSubject = (id, name) => { const s = N.by(N.db.subjects, id), old = s.name; s.name = name;
  N.db.tasks.forEach(t => { if (t.subj === old) t.subj = name; }); N.db.sessions.forEach(t => { if (t.subj === old) t.subj = name; });
  N.db.exams.forEach(t => { if (t.subj === old) t.subj = name; }); N.db.events.forEach(t => { if (t.subj === old) t.subj = name; }); };
N.removeSubject = id => { N.db.subjects = N.db.subjects.filter(s => String(s.id) !== String(id)); N.db.grades = N.db.grades.filter(g2 => String(g2.subjId) !== String(id)); N.save(); };

/* ---------- progression ---------- */
N.activity = d => N.doneOn(d).length + Math.floor(N.focusMin(d) / 25);
N.level = s => s <= 0 ? 0 : s === 1 ? 1 : s <= 3 ? 2 : s <= 5 ? 3 : 4;
N.weekStats = mon => { const days = [0, 1, 2, 3, 4, 5, 6].map(i => N.addDays(mon, i));
  return { days, focus: days.map(N.focusMin), tasks: days.map(d => N.doneOn(d).length), active: days.filter(d => N.activity(d) > 0).length }; };
N.habits = () => { const sl = { "matin": 0, "après-midi": 0, "soir": 0 }, wd = [0, 0, 0, 0, 0, 0, 0];
  N.db.focusLog.forEach(f => { const h = +f.start.slice(0, 2); sl[h < 12 ? "matin" : h < 17 ? "après-midi" : "soir"] += f.min; wd[N.dow(f.date)] += f.min; });
  const tot = N.db.focusLog.reduce((a, f) => a + f.min, 0), n = N.db.focusLog.length; return { slots: sl, wd, tot, n, avg: n ? Math.round(tot / n) : 0 }; };
N.remsToday = () => { const t0 = N.todayS(), d = N.dow(t0); return N.db.rems.filter(r => r.on && (r.kind === "once" ? r.date === t0 : (r.days || []).includes(d))); };
N.remLabel = r => r.kind === "once" ? N.rel(r.date) + " à " + r.time : ((r.days || []).length === 7 ? "Tous les jours" : (r.days || []).map(i => N.DAYS[i]).join(", ")) + " à " + r.time;

/* ---------- minuteur de concentration (état persistant, basé sur l’horloge) ---------- */
N.RUN_KEY = "nova.run";
N.phaseMin = ph => { const f = N.db.settings.focus; return ph === "work" ? f.work : ph === "long" ? f.long : f.brk; };
N.runDefault = () => { const m = N.db.settings.focus.work * 6e4; return { phase: "work", status: "idle", total: m, remain: m, endAt: 0, startedAt: 0, taskId: "", cycle: 0 }; };
N.loadRun = () => { try { const r = JSON.parse(N.Store.ad.get(N.RUN_KEY)); if (r && r.phase && r.status) return r; } catch (e) {} return N.runDefault(); };
N.saveRun = () => N.Store.ad.set(N.RUN_KEY, JSON.stringify(N.run));
N.remaining = () => N.run.status === "running" ? Math.max(0, N.run.endAt - N.clock()) : N.run.remain;
N.elapsedMin = () => Math.floor((N.run.total - N.remaining()) / 6e4);
N.runStart = () => { const r = N.run; if (r.status === "running") return; r.status = "running"; r.endAt = N.clock() + r.remain; if (!r.startedAt) r.startedAt = N.clock(); N.saveRun(); };
N.runPause = () => { const r = N.run; if (r.status !== "running") return; r.remain = Math.max(0, r.endAt - N.clock()); r.status = "paused"; N.saveRun(); };
N.runSetPhase = ph => { const r = N.run; r.phase = ph; r.total = N.phaseMin(ph) * 6e4; r.remain = r.total; r.status = "idle"; r.endAt = 0; r.startedAt = 0; N.saveRun(); };
N.runReset = () => N.runSetPhase(N.run.phase);
N.runFinish = early => {
  const r = N.run, f = N.db.settings.focus, was = r.phase, taskId = r.taskId; let min = 0, logged = null, next = "work";
  if (was === "work") {
    const el = r.total - (early ? N.remaining() : 0); min = Math.round(el / 6e4);
    if (min >= 1) { const st = new Date(r.startedAt || N.clock() - el); logged = { id: N.uid(), date: N.todayS(), start: pad(st.getHours()) + ":" + pad(st.getMinutes()), min, taskId: taskId || "", subj: ((N.by(N.db.tasks, taskId) || {}).subj) || "" }; N.db.focusLog.push(logged); }
    r.cycle++; next = r.cycle % f.every === 0 ? "long" : "break";
  }
  N.runSetPhase(next); const unlocked = N.checkRewards(); N.save();
  return { was, min, logged, next, unlocked, taskId };
};
N.runTick = () => (N.run.status === "running" && N.remaining() <= 0) ? N.runFinish(false) : null;
})(globalThis);
