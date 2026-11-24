/* NOVA 2.0 : récompenses personnalisées et suivi des notes */
(function (g) {
"use strict";
const N = g.N, E = N.esc, ic = N.ic;

/* ---------- récompenses ---------- */
const ICONS = ["☕", "🎬", "📖", "🎧", "🎮", "🍫", "🚶", "🛁", "✨"];
N.views.rewards = () => {
  const tab = N.S.rtab, rs = N.db.rewards, st = { lock: "locked", unlk: "unlocked", used: "used" }[tab], l = rs.filter(r => r.status === st), nr = N.nextReward();
  const card = r => { const p = N.rwProgress(r), link = r.link || { type: "none" };
    return `<div class="card rw ${r.status}"><div class="row"><div class="rwi">${r.icon ? E(r.icon) : ic("gift")}</div><div class="f"><div class="t">${E(r.name)}</div>${r.desc ? `<div class="s">${E(r.desc)}</div>` : ""}</div>
<button class="ib" aria-label="Modifier" data-a="rwEdit" data-id="${E(r.id)}">${ic("edit")}</button><button class="ib" aria-label="Supprimer" data-a="rwDel" data-id="${E(r.id)}">${ic("trash")}</button></div>
${r.status === "locked" ? `<div class="s" style="margin-top:8px">${E(p.label)} (${p.cur} sur ${p.need})</div>${N.pb(p.cur / p.need * 100)}` : ""}
${r.status === "unlocked" ? `<div class="row" style="margin-top:10px"><div class="f s">Débloquée${r.unlockedAt ? " le " + E(N.fmtD(r.unlockedAt, { day: "numeric", month: "long" })) : ""}. Elle t’attend.</div><button class="btn sm" data-a="rwUse" data-id="${E(r.id)}">Je m’offre ça</button></div>` : ""}
${r.status === "used" ? `<div class="row" style="margin-top:10px"><div class="f s">Savourée${r.usedAt ? " le " + E(N.fmtD(r.usedAt, { day: "numeric", month: "long" })) : ""}.</div><button class="btn o sm" data-a="rwAgain" data-id="${E(r.id)}">Réactiver</button></div>` : ""}
${link.type === "task" && r.status === "locked" ? "" : ""}</div>`; };
  return N.head("Récompenses", `<button class="btn" data-a="rwNew">${ic("plus")}Nouvelle</button>`) +
  (nr ? `<div class="card note"><div class="s">Prochaine récompense : <b>${E(nr.r.name)}</b>. ${E(nr.p.label)}.</div></div>` : "") +
  `<div class="tabs" style="margin-top:10px">${[["lock", "À débloquer", "locked"], ["unlk", "Débloquées", "unlocked"], ["used", "Savourées", "used"]].map(x => `<button class="tab ${tab === x[0] ? "on" : ""}" data-a="rwTab" data-k="${x[0]}">${x[1]} (${rs.filter(r => r.status === x[2]).length})</button>`).join("")}</div>
<div class="g" style="margin-top:10px">${l.map(card).join("") || `<div class="emp">${tab === "lock" ? "Aucune récompense à débloquer. Crée-en une pour te motiver." : tab === "unlk" ? "Aucune récompense débloquée pour l’instant. Chaque petite étape compte." : "Rien ici pour l’instant."}</div>`}</div>`;
};
N.act.rwTab = d => { N.S.rtab = d.k; N.render(); };
N.act.rwUse = d => { N.useReward(d.id); N.toast("Profites-en, tu l’as mérité."); N.render(); };
N.act.rwAgain = d => { N.rearmReward(d.id); N.checkRewards(); N.save(); N.toast("Récompense réactivée"); N.render(); };
N.act.rwDel = d => { const r = N.by(N.db.rewards, d.id); if (r) N.confirm("Supprimer la récompense « " + r.name + " » ?", () => { N.db.rewards = N.db.rewards.filter(x => String(x.id) !== String(d.id)); N.save(); N.toast("Récompense supprimée"); N.render(); }, "Supprimer"); };
N.act.rwNew = () => N.rewardForm(null);
N.act.rwEdit = d => N.rewardForm(d.id);
N.rewardForm = id => {
  const r = id ? N.by(N.db.rewards, id) : { name: "", desc: "", icon: "", link: { type: "none" } }, l = r.link || { type: "none" };
  const tasks = N.db.tasks.filter(t => !t.done || (l.type === "task" && String(l.taskId) === String(t.id)));
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier la récompense" : "Nouvelle récompense"}</h2><form data-f="reward"><input type="hidden" name="id" value="${E(id || "")}">
<label>Nom</label><input name="name" required maxlength="60" value="${E(r.name)}" placeholder="Ex. : un épisode de série">
<label>Description (facultatif)</label><input name="desc" maxlength="120" value="${E(r.desc || "")}">
<label>Icône (facultatif)</label><div class="seg"><label><input type="radio" name="icon" value="" ${!r.icon ? "checked" : ""}><span>Aucune</span></label>${ICONS.map(i => `<label><input type="radio" name="icon" value="${i}" ${r.icon === i ? "checked" : ""}><span>${i}</span></label>`).join("")}</div>
<label>Comment la débloquer ?</label><select name="lt" data-c="rwlink"><option value="none" ${l.type === "none" ? "selected" : ""}>Disponible tout de suite</option><option value="task" ${l.type === "task" ? "selected" : ""}>En terminant une tâche</option><option value="milestone" ${l.type === "milestone" ? "selected" : ""}>En atteignant un palier du jour</option></select>
<div data-show="task" ${l.type === "task" ? "" : "hidden"}><label>Tâche associée</label><select name="task">${tasks.map(t => `<option value="${E(t.id)}" ${String(t.id) === String(l.taskId) ? "selected" : ""}>${E(t.title)}</option>`).join("") || "<option value=''>Aucune tâche disponible</option>"}</select></div>
<div data-show="milestone" ${l.type === "milestone" ? "" : "hidden"} class="fg"><div><label>Palier</label><select name="mk"><option value="tasks_today" ${l.kind === "tasks_today" ? "selected" : ""}>Tâches terminées aujourd’hui</option><option value="focus_today" ${l.kind === "focus_today" ? "selected" : ""}>Minutes de focus aujourd’hui</option></select></div><div><label>Objectif</label><input type="number" name="mn" min="1" max="600" value="${l.n || 2}"></div></div>
<div id="ferr" class="err" role="alert"></div><div class="row" style="margin-top:18px;justify-content:flex-end"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Enregistrer</button></div></form>`); };
N.chg.rwlink = (d, el) => { document.querySelectorAll("form[data-f=reward] [data-show]").forEach(x => { x.hidden = x.dataset.show !== el.value; }); };
N.form.reward = fd => {
  const id = fd.get("id"), name = String(fd.get("name") || "").trim(); if (!name) return N.formErr("Donne un nom à ta récompense.");
  const lt = fd.get("lt"); let link = { type: "none" };
  if (lt === "task") { if (!fd.get("task")) return N.formErr("Choisis une tâche à associer."); link = { type: "task", taskId: fd.get("task") }; }
  if (lt === "milestone") { const n = Math.round(+fd.get("mn")); if (!(n >= 1 && n <= 600)) return N.formErr("Le palier doit être compris entre 1 et 600."); link = { type: "milestone", kind: fd.get("mk"), n }; }
  const o = { name, desc: String(fd.get("desc") || "").trim(), icon: fd.get("icon") || "", link };
  let r; if (id) { r = N.by(N.db.rewards, id); const same = JSON.stringify(r.link) === JSON.stringify(link); Object.assign(r, o); if (!same) { r.status = "locked"; r.baseDate = null; r.base = 0; } }
  else { r = { id: N.uid(), status: "locked", ...o }; N.db.rewards.push(r); }
  if (link.type === "none") r.status = r.status === "used" ? "used" : "unlocked";
  N.checkRewards(); N.save(); N.close(); N.toast(id ? "Récompense modifiée" : "Récompense créée"); N.render(); };

/* ---------- notes ---------- */
const sc = () => N.db.settings.base;
N.views.grades = () => {
  const db = N.db, ov = N.overall(), tg = db.settings.targetAvg, base = sc(), sel = N.S.gsel, series = N.avgSeries(sel === "all" ? "" : sel);
  const gap = ov == null ? null : tg - ov;
  const subj = s => { const a = N.subjAvg(s.id), gr = db.grades.filter(x => x.subjId === s.id).sort((x, y) => y.date.localeCompare(x.date));
    return `<div class="card"><div class="row"><span class="dot" style="background:${s.c || "#C98B86"}"></span><div class="f"><div class="t">${E(s.name)}</div><div class="s">Coefficient ${s.coef}${s.target != null ? ", objectif " + N.f1(s.target) : ""}</div></div><div class="avg">${N.f1(a)}<span class="s">/${base}</span></div></div>
${s.target != null && a != null ? N.pb(a / s.target * 100) : ""}${s.target != null && a != null ? `<div class="s" style="margin-top:4px">${a >= s.target ? "Objectif atteint, bravo." : "Encore " + N.f1(s.target - a) + " point" + (s.target - a >= 2 ? "s" : "") + " pour l’objectif."}</div>` : ""}
<div class="gl">${gr.map(x => `<div class="row gr"><div class="f"><span class="t">${E(x.title)}</span><div class="s">${E(N.fmtD(x.date, { day: "numeric", month: "short" }))}, coef ${x.coef}</div></div><b>${N.f1(x.value)}/${x.scale}</b><button class="ib" aria-label="Modifier la note" data-a="grEdit" data-id="${E(x.id)}">${ic("edit")}</button><button class="ib" aria-label="Supprimer la note" data-a="grDel" data-id="${E(x.id)}">${ic("trash")}</button></div>`).join("") || '<div class="s">Aucune note pour le moment.</div>'}</div>
<div class="row" style="margin-top:8px;gap:8px"><button class="btn o sm" data-a="grNew" data-subj="${E(s.id)}">${ic("plus")}Note</button><button class="btn o sm" data-a="sjEdit" data-id="${E(s.id)}">Modifier la matière</button></div></div>`; };
  const bars = db.subjects.map(s => ({ l: s.name.slice(0, 4), v: N.subjAvg(s.id) || 0, t: N.f1(N.subjAvg(s.id)), c: s.c })).filter(b => b.v > 0);
  return N.head("Notes", `<button class="btn" data-a="grNew">${ic("plus")}Note</button>`) +
  `<div class="card"><div class="row"><div class="f"><div class="s">Moyenne générale (pondérée)</div><div class="big">${N.f1(ov)}<span class="s">/${base}</span></div></div><div class="f" style="text-align:right"><div class="s">Objectif</div><div class="t">${N.f1(tg)}</div></div></div>${ov != null ? N.pb(ov / tg * 100) : ""}
<div class="s" style="margin-top:6px">${ov == null ? "Ajoute ta première note pour calculer ta moyenne." : gap > 0 ? "À " + N.f1(gap) + " point" + (gap >= 2 ? "s" : "") + " de ton objectif." : "Objectif atteint, bravo."}</div>
<details style="margin-top:8px"><summary>Échelle et objectif</summary><form data-f="gradeSet" class="fg"><div><label>Moyennes affichées sur</label><input type="number" name="base" min="5" max="1000" value="${base}"></div><div><label>Objectif général</label><input type="number" name="target" min="0" max="1000" step="0.5" value="${tg}"></div><div style="grid-column:1/-1"><button class="btn sm">Enregistrer</button></div></form></details></div>
<h2>Progression <select data-c="set" data-k="gsel" aria-label="Matière du graphique" class="mini"><option value="all">Toutes les matières</option>${db.subjects.map(s => `<option value="${E(s.id)}" ${sel === s.id ? "selected" : ""}>${E(s.name)}</option>`).join("")}</select></h2>
<div class="card">${N.line(series, { max: base, target: sel === "all" ? tg : (N.by(db.subjects, sel) || {}).target, label: "Évolution de la moyenne" })}</div>
${bars.length ? `<h2>Moyennes par matière</h2><div class="card">${N.bars(bars, { max: base, goal: tg, label: "Moyennes par matière" })}<div class="s">Ligne pointillée : objectif général.</div></div>` : ""}
<h2>Matières <button class="chip" data-a="sjNew">${ic("plus")} Ajouter</button></h2><div class="g">${db.subjects.map(subj).join("") || '<div class="emp">Ajoute une matière pour commencer.</div>'}</div>`;
};
N.form.gradeSet = fd => { const b = +fd.get("base"), t = +fd.get("target"); if (!(b >= 5 && b <= 1000) || !(t >= 0 && t <= b)) { N.toast("Vérifie l’échelle et l’objectif."); return; }
  N.db.settings.base = b; N.db.settings.targetAvg = t; N.save(); N.toast("Enregistré"); N.render(); };
N.act.grNew = d => N.gradeForm(null, d && d.subj);
N.act.grEdit = d => N.gradeForm(d.id);
N.act.grDel = d => N.confirm("Supprimer cette note ?", () => { N.db.grades = N.db.grades.filter(x => String(x.id) !== String(d.id)); N.save(); N.toast("Note supprimée"); N.render(); }, "Supprimer");
N.gradeForm = (id, sid) => {
  if (!N.db.subjects.length) return N.toast("Ajoute d’abord une matière.");
  const x = id ? N.by(N.db.grades, id) : { subjId: sid || N.db.subjects[0].id, title: "", value: "", scale: 20, coef: 1, date: N.todayS() };
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier la note" : "Nouvelle note"}</h2><form data-f="grade"><input type="hidden" name="id" value="${E(id || "")}">
<label>Matière</label><select name="subj">${N.db.subjects.map(s => `<option value="${E(s.id)}" ${s.id === x.subjId ? "selected" : ""}>${E(s.name)}</option>`).join("")}</select>
<label>Intitulé</label><input name="title" required maxlength="80" value="${E(x.title)}" placeholder="Ex. : DS de mathématiques">
<div class="fg"><div><label>Note</label><input type="number" name="value" required min="0" step="0.25" value="${x.value}"></div><div><label>Sur</label><input type="number" name="scale" required min="1" max="1000" value="${x.scale}"></div></div>
<div class="fg"><div><label>Coefficient</label><input type="number" name="coef" required min="0.25" max="20" step="0.25" value="${x.coef}"></div><div><label>Date</label><input type="date" name="date" required value="${E(x.date)}"></div></div>
<div id="ferr" class="err" role="alert"></div><div class="row" style="margin-top:18px;justify-content:flex-end"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Enregistrer</button></div></form>`); };
N.form.grade = fd => {
  const id = fd.get("id"), title = String(fd.get("title") || "").trim(), value = +fd.get("value"), scale = +fd.get("scale"), coef = +fd.get("coef"), date = fd.get("date");
  if (!title || !date || fd.get("value") === "" || isNaN(value)) return N.formErr("Complète l’intitulé, la note et la date.");
  if (!(scale > 0) || value < 0 || value > scale) return N.formErr("La note doit être comprise entre 0 et l’échelle choisie.");
  if (!(coef > 0)) return N.formErr("Le coefficient doit être supérieur à 0.");
  const o = { subjId: fd.get("subj"), title, value, scale, coef, date };
  if (id) Object.assign(N.by(N.db.grades, id), o); else N.db.grades.push({ id: N.uid(), ...o });
  N.save(); N.close(); N.toast("Note enregistrée"); N.render(); };
N.act.sjNew = () => N.subjectForm(null);
N.act.sjEdit = d => N.subjectForm(d.id);
N.subjectForm = id => {
  const s = id ? N.by(N.db.subjects, id) : { name: "", coef: 1, target: "" };
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier la matière" : "Nouvelle matière"}</h2><form data-f="subject"><input type="hidden" name="id" value="${E(id || "")}">
<label>Nom</label><input name="name" required maxlength="40" value="${E(s.name)}"><div class="fg"><div><label>Coefficient</label><input type="number" name="coef" min="0.25" max="20" step="0.25" required value="${s.coef}"></div><div><label>Objectif (facultatif)</label><input type="number" name="target" min="0" step="0.5" value="${s.target == null ? "" : s.target}"></div></div>
<div id="ferr" class="err" role="alert"></div><div class="row" style="margin-top:18px;justify-content:space-between">${id ? `<button type="button" class="btn o" data-a="sjDel" data-id="${E(id)}">${ic("trash")}Supprimer</button>` : "<span></span>"}<div class="row"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Enregistrer</button></div></div></form>`); };
N.form.subject = fd => {
  const id = fd.get("id"), name = String(fd.get("name") || "").trim(), coef = +fd.get("coef"), tr = fd.get("target"), target = tr === "" || tr == null ? null : +tr;
  if (!name || !(coef > 0)) return N.formErr("Indique un nom et un coefficient supérieur à 0.");
  if (N.db.subjects.some(s => s.name.toLowerCase() === name.toLowerCase() && String(s.id) !== String(id))) return N.formErr("Cette matière existe déjà.");
  if (id) { const s = N.by(N.db.subjects, id); if (s.name !== name) N.renameSubject(id, name); s.coef = coef; s.target = target; }
  else N.db.subjects.push({ id: "s" + N.uid(), name, coef, target, c: N.COLORS[N.db.subjects.length % N.COLORS.length] });
  N.save(); N.close(); N.toast("Matière enregistrée"); N.render(); };
N.act.sjDel = d => { const s = N.by(N.db.subjects, d.id); if (s) N.confirm("Supprimer « " + s.name + " » et ses notes ?", () => { N.removeSubject(d.id); N.toast("Matière supprimée"); N.render(); }, "Supprimer"); };
})(globalThis);
