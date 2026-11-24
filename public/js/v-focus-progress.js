/* NOVA 2.0 : mode concentration (minuteur, historique) et suivi de régularité (sans série punitive) */
(function (g) {
"use strict";
const N = g.N, E = N.esc, ic = N.ic;
const mmss = ms => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const RC = 2 * Math.PI * 52;

/* ---------- focus ---------- */
N.views.focus = () => {
  const f = N.db.settings.focus, r = N.run, today = N.focusMin(N.todayS()), idle = r.status === "idle";
  const label = { work: "Concentration", break: "Pause courte", long: "Pause longue" }[r.phase];
  const log = N.db.focusLog.slice().sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)).slice(0, 20);
  const byDay = {}; log.forEach(x => { (byDay[x.date] = byDay[x.date] || []).push(x); });
  const fld = (k, lab, mn, mx) => `<div><label>${lab}</label><input type="number" min="${mn}" max="${mx}" value="${f[k]}" data-c="fset" data-k="${k}"></div>`;
  const tasks = N.openTasks();
  return N.head("Focus") +
  `<div class="card tm"><div class="s" id="tm-phase">${label}</div>
<div class="tmr"><svg viewBox="0 0 120 120" role="img" aria-label="Minuteur"><circle cx="60" cy="60" r="52" class="tr"/><circle cx="60" cy="60" r="52" class="tp" id="tm-ring" stroke-dasharray="${RC.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 60 60)"/></svg><div class="tt" id="tm-time">${mmss(N.remaining())}</div></div>
${idle ? `<div class="seg" style="justify-content:center">${[["work", "Concentration"], ["break", "Pause"], ["long", "Pause longue"]].map(x => `<button class="tab ${r.phase === x[0] ? "on" : ""}" data-a="fPhase" data-p="${x[0]}">${x[1]}</button>`).join("")}</div>` : ""}
${r.phase === "work" ? `<label style="text-align:left">Tâche en cours (facultatif)</label><select data-c="ftask"><option value="">Aucune</option>${tasks.map(t => `<option value="${E(t.id)}" ${String(t.id) === String(r.taskId) ? "selected" : ""}>${E(t.title)}</option>`).join("")}</select>` : ""}
<div class="row" style="justify-content:center;margin-top:14px;gap:10px">${r.status === "running" ? `<button class="btn" data-a="fPause">${ic("pause")}Pause</button>` : `<button class="btn" data-a="fStart">${ic("play")}${r.status === "paused" ? "Reprendre" : "Démarrer"}</button>`}
${!idle ? `<button class="btn o" data-a="fFinish">${r.phase === "work" ? "Terminer" : "Passer"}</button><button class="btn o" data-a="fReset">Réinitialiser</button>` : ""}</div></div>
<h2>Objectif du jour</h2><div class="card"><div class="row"><div class="f t">${today} min sur ${f.goal}</div><div class="s">${today >= f.goal ? "Objectif atteint, bravo." : "Encore " + (f.goal - today) + " min"}</div></div>${N.pb(today / f.goal * 100)}</div>
<h2>Réglages du minuteur</h2><div class="card fg3">${fld("work", "Concentration (min)", 1, 180)}${fld("brk", "Pause (min)", 1, 60)}${fld("long", "Pause longue (min)", 1, 90)}${fld("every", "Pause longue toutes les", 2, 8)}${fld("goal", "Objectif du jour (min)", 10, 600)}</div>
<h2>Historique</h2>${Object.keys(byDay).map(d => `<div class="card" style="margin-bottom:8px"><div class="t">${E(N.fmtD(d, { weekday: "long", day: "numeric", month: "long" }))}, ${byDay[d].reduce((a, x) => a + x.min, 0)} min</div>${byDay[d].map(x => `<div class="s">${x.start}, ${x.min} min${x.taskId && N.by(N.db.tasks, x.taskId) ? ", " + E(N.by(N.db.tasks, x.taskId).title) : ""}</div>`).join("")}</div>`).join("") || '<div class="emp">Ta première session apparaîtra ici.</div>'}`;
};
N.focusUpdate = () => { const r = N.run; if (!r) return; const ms = N.remaining(), t = N.$("tm-time");
  if (t) { t.textContent = mmss(ms); const ring = N.$("tm-ring"); if (ring) ring.setAttribute("stroke-dashoffset", (RC * (r.total ? (1 - ms / r.total) : 0)).toFixed(1)); }
  if (g.document) document.title = r.status === "running" ? mmss(ms) + " · NOVA" : "NOVA"; };
N.act.fStart = () => { N.runStart(); N.close(); N.render(); };
N.act.fPause = () => { N.runPause(); N.render(); };
N.act.fReset = () => { N.runReset(); N.render(); };
N.act.fPhase = d => { if (N.run.status === "idle") { N.runSetPhase(d.p); N.render(); } };
N.act.fFinish = () => { if (N.run.phase === "work" && N.elapsedMin() < 1) { N.runReset(); N.toast("Session réinitialisée (moins d’une minute)."); N.render(); return; } N.focusDone(N.runFinish(true)); };
N.chg.ftask = (d, el) => { N.run.taskId = el.value; N.saveRun(); };
N.chg.fset = (d, el) => { const f = N.db.settings.focus, lim = { work: [1, 180], brk: [1, 60], long: [1, 90], every: [2, 8], goal: [10, 600] }[d.k]; let v = Math.round(+el.value); if (isNaN(v)) v = f[d.k];
  f[d.k] = Math.min(lim[1], Math.max(lim[0], v)); N.save(); if (N.run.status === "idle") N.runSetPhase(N.run.phase); N.render(); };
N.focusDone = res => {
  if (!res) return; const t = res.taskId && N.by(N.db.tasks, res.taskId);
  if (res.was !== "work") { N.toast("Pause terminée. Prêt pour la suite ?"); N.render(); return; }
  N.modal(`<h2 style="margin-top:0">Session terminée</h2><p>${res.min} min de concentration. Bien joué.</p>${res.unlocked.length ? `<p class="t">Récompense débloquée : ${E(res.unlocked.map(r => r.name).join(", "))}</p>` : ""}
${t && !t.done ? `<button class="btn" style="margin-bottom:8px" data-a="fDoneTask" data-id="${E(t.id)}">Marquer « ${E(t.title)} » comme terminée</button>` : ""}
<div class="row" style="justify-content:flex-end;gap:8px"><button class="btn o" data-a="close">Plus tard</button><button class="btn" data-a="fStart">${res.next === "long" ? "Démarrer la pause longue" : "Démarrer la pause"}</button></div>`);
  N.render(); };
N.act.fDoneTask = d => { const r = N.toggleTask(d.id); N.close(); N.toast(r && r.unlocked.length ? "Récompense débloquée : " + r.unlocked[0].name : "Tâche terminée, bien joué."); N.render(); };

/* ---------- progrès ---------- */
N.views.progress = () => {
  const t0 = N.todayS(), base = N.parse(t0); base.setDate(1); base.setMonth(base.getMonth() + N.S.pm);
  const y = base.getFullYear(), m = base.getMonth(), first = N.iso(base), lead = N.dow(first), nd = new Date(y, m + 1, 0).getDate();
  const sel = N.S.pday || t0, cells = []; for (let i = 0; i < lead; i++) cells.push('<span class="hc"></span>');
  for (let d = 1; d <= nd; d++) { const ds = N.iso(new Date(y, m, d)), sc = N.activity(ds), lv = N.level(sc);
    cells.push(`<button class="hc lv${lv} ${ds === t0 ? "tod" : ""} ${ds === sel ? "sel" : ""}" data-a="pday" data-date="${ds}" aria-label="${E(N.fmtD(ds, { day: "numeric", month: "long" }))} : ${N.doneOn(ds).length} tâche(s), ${N.focusMin(ds)} min de focus">${d}</button>`); }
  const ws = N.weekStats(N.monday(t0)), lw = N.weekStats(N.addDays(N.monday(t0), -7)), hb = N.habits(), sum = a => a.reduce((x, y2) => x + y2, 0);
  const done = N.doneOn(sel), fm = N.focusMin(sel), gr = N.db.grades.filter(x => x.date === sel);
  const best = Object.keys(hb.slots).sort((a, b) => hb.slots[b] - hb.slots[a])[0], bd = hb.wd.indexOf(Math.max(...hb.wd));
  const subjWeek = {}; ws.days.forEach(d => N.doneOn(d).forEach(t => { subjWeek[t.subj] = (subjWeek[t.subj] || 0) + 1; }));
  const kpi = (v, l, p) => `<div class="kpi"><b>${v}</b><span class="s">${l}</span>${p == null ? "" : `<span class="s">Semaine passée : ${p}</span>`}</div>`;
  return N.head("Progrès") +
  `<div class="card"><div class="row"><button class="ib" data-a="pm" data-n="-1" aria-label="Mois précédent">${ic("left")}</button><div class="f t" style="text-align:center;text-transform:capitalize">${E(base.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }))}</div><button class="ib" data-a="pm" data-n="1" aria-label="Mois suivant">${ic("right")}</button></div>
<div class="hmg"><span class="hh">L</span><span class="hh">M</span><span class="hh">M</span><span class="hh">J</span><span class="hh">V</span><span class="hh">S</span><span class="hh">D</span>${cells.join("")}</div>
<div class="s" style="margin-top:8px">Plus la case est foncée, plus la journée a été active (tâches terminées et minutes de focus).</div></div>
<div class="card" style="margin-top:10px"><div class="t">${E(N.fmtD(sel, { weekday: "long", day: "numeric", month: "long" }))}</div>${done.length || fm || gr.length ? `<div class="s">${done.length} tâche(s) terminée(s), ${fm} min de focus${gr.length ? ", " + gr.length + " note(s) ajoutée(s)" : ""}</div>${done.map(t => `<div class="s">✓ ${E(t.title)}</div>`).join("")}` : '<div class="s">Pas d’activité enregistrée ce jour-là. Chaque jour est une nouvelle occasion.</div>'}</div>
<h2>Cette semaine</h2><div class="kpis">${kpi(sum(ws.tasks), "tâches terminées", sum(lw.tasks))}${kpi(sum(ws.focus) + " min", "de focus", sum(lw.focus) + " min")}${kpi(ws.active + "/7", "jours actifs", lw.active + "/7")}</div>
<div class="card" style="margin-top:10px">${N.bars(ws.days.map((d, i) => ({ l: N.DAYS[i], v: ws.focus[i], t: ws.focus[i] + " min", c: d === t0 ? "var(--bd)" : null })), { goal: N.db.settings.focus.goal, label: "Minutes de focus cette semaine" })}<div class="s">Minutes de focus par jour. Ligne pointillée : objectif du jour.</div></div>
<h2>Habitudes d’étude</h2><div class="card">${hb.n ? `<div class="s">Moment le plus concentré : <b>${best}</b>. Jour le plus actif : <b>${N.DAYS_L[bd].toLowerCase()}</b>. Session moyenne : <b>${hb.avg} min</b>, ${hb.tot} min au total.</div>${N.bars(Object.keys(hb.slots).map(k => ({ l: k, v: hb.slots[k], t: hb.slots[k] + " min" })), { label: "Focus selon le moment de la journée" })}` : '<div class="s">Lance une session de focus pour découvrir tes habitudes.</div>'}
${Object.keys(subjWeek).length ? `<div class="s" style="margin-top:8px">Matières travaillées cette semaine : ${Object.keys(subjWeek).map(s => `<span class="chip">${E(s)} (${subjWeek[s]})</span>`).join(" ")}</div>` : ""}</div>
<p class="s" style="margin-top:10px">NOVA ne compte pas de série à ne pas casser : tu vois seulement ce que tu as fait, à ton rythme.</p>`;
};
N.act.pm = d => { N.S.pm += +d.n; N.render(); };
N.act.pday = d => { N.S.pday = d.date; N.render(); };
})(globalThis);
