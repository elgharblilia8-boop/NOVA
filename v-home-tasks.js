/* NOVA 2.0 : tableau de bord quotidien et tâches à trois niveaux */
(function (g) {
"use strict";
const N = g.N, E = N.esc, ic = N.ic;

N.taskRow = (t, o) => { o = o || {}; const cat = N.effCat(t), auto = t.catMode !== "manual";
  return `<div class="card row ${t.done ? "done" : ""}"><button class="ck" data-a="toggle" data-id="${E(t.id)}" aria-label="${t.done ? "Rouvrir" : "Terminer"} : ${E(t.title)}">${ic("check")}</button>
<div class="f"><div class="t">${E(t.title)}</div><div class="s row" style="gap:6px;flex-wrap:wrap"><span class="dot" style="background:${N.subjColor(t.subj)}"></span>${E(t.subj)}, ${N.dur(t.dur)}</div></div>
<div class="rt"><span class="chip ${N.diff(t.due) < 0 && !t.done ? "late" : ""}">${N.rel(t.due)}</span><span class="chip cat ${cat}" title="${auto ? "Classement automatique : " + E(N.why(t)) : "Classement manuel"}">${auto ? "✦ " : ""}${N.CATS[cat]}</span></div></div>`; };

N.views.home = () => {
  const db = N.db, t0 = N.todayS(), s = N.focusSets(), p = N.dayProgress(), nm = db.profile.name, h = N.nowFn().getHours();
  const msg = p.total && p.pct === 100 ? "Tout est fait pour aujourd’hui. Profite de ton temps libre." : p.done > 0 ? `Déjà ${p.done} tâche${p.done > 1 ? "s" : ""} terminée${p.done > 1 ? "s" : ""}. Continue à ton rythme.` : s.pri.length ? "Commence par ta première priorité : une petite étape suffit." : "Journée tranquille : choisis ce qui te fait envie.";
  const c = 2 * Math.PI * 40, nr = N.nextReward(), fm = N.focusMin(t0), goal = db.settings.focus.goal, items = N.items(t0), rt = N.remsToday();
  const slots = [0, 1, 2].map(i => s.pri[i] ? N.taskRow(s.pri[i]) : `<button class="card slot-e" data-a="taskNew" data-cat="priorite">${ic("plus")}<span>Place libre pour une priorité</span></button>`).join("");
  const up = N.sortTasks(N.openTasks(), "due").slice(0, 4);
  return `${N.instH ? N.instH() : ""}${db.settings.demo ? `<div class="card note row"><div class="f s">Tu vois des données d’exemple. Tu peux les remplacer par les tiennes à tout moment.</div><button class="btn o sm" data-a="removeDemo">Les supprimer</button></div>` : ""}
<div class="hero"><div style="z-index:1"><div class="d">${E(N.fmtD(t0, { weekday: "long", day: "numeric", month: "long" }))}</div><h1>${h < 18 ? "Bonjour" : "Bonsoir"}${nm ? ", " + E(nm) : ""}</h1><p>${msg}</p></div>
<div class="ring" role="img" aria-label="Progression du jour : ${p.pct} %"><svg viewBox="0 0 100 100" width="96" height="96"><circle cx="50" cy="50" r="40" fill="none" stroke="#FBF6EE22" stroke-width="8"/><circle cx="50" cy="50" r="40" fill="none" stroke="#D8A7A4" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p.pct / 100)}" transform="rotate(-90 50 50)"/></svg><span>${p.pct}%</span></div></div>
<div class="hg"><div><h2>Tes 3 priorités</h2><div class="g">${slots}</div>
<h2>Secondaires</h2><div class="g">${s.sec.slice(0, 4).map(t => N.taskRow(t)).join("") || '<div class="emp">Aucune tâche secondaire.</div>'}</div>
<details class="bonus"><summary>Bonus facultatifs (${s.bonus.length})</summary><div class="g" style="margin-top:8px">${s.bonus.slice(0, 3).map(t => N.taskRow(t)).join("") || '<div class="emp">Rien en bonus pour le moment.</div>'}</div></details></div>
<div><h2>Prochaine récompense</h2>${nr ? `<div class="card"><div class="row"><div class="rwi">${nr.r.icon ? E(nr.r.icon) : ic("gift")}</div><div class="f"><div class="t">${E(nr.r.name)}</div><div class="s">${E(nr.p.label)}</div></div></div>${N.pb(nr.q * 100)}<div class="s" style="margin-top:6px">${nr.p.cur} sur ${nr.p.need}</div></div>` : `<div class="card"><div class="s">Aucune récompense en attente. Crée-en une dans Récompenses.</div><button class="btn o sm" style="margin-top:8px" data-a="go" data-v="rewards">Voir les récompenses</button></div>`}
<h2>Prochaines échéances</h2><div class="g">${up.map(t => `<div class="card row"><span class="dot" style="background:${N.subjColor(t.subj)}"></span><div class="f"><div class="t">${E(t.title)}</div><div class="s">${E(t.subj)}</div></div><span class="chip ${N.diff(t.due) < 0 ? "late" : ""}">${N.rel(t.due)}</span></div>`).join("") || '<div class="emp">Aucune échéance à venir.</div>'}</div>
<h2>Focus du jour</h2><div class="card"><div class="row"><div class="f t">${fm} min sur ${goal}</div><button class="btn o sm" data-a="go" data-v="focus">Lancer une session</button></div>${N.pb(fm / goal * 100)}</div>
<h2>Aujourd’hui</h2>${items.map(i => `<div class="ev ${i.kind === "exam" ? "exam" : i.kind === "etude" ? "etude" : i.kind === "pause" ? "pause" : i.kind === "activite" ? "perso" : ""}" style="--c:${N.subjColor(i.subj)}"><div class="t">${E(i.title)}</div><div class="s">${i.s} – ${i.e}${i.place ? ", " + E(i.place) : ""}</div></div>`).join("") || '<div class="emp">Rien de planifié aujourd’hui.</div>'}
${rt.length ? `<h2>Rappels du jour</h2><div class="g">${rt.map(r => `<div class="card row">${ic("bell")}<div class="f"><div class="t">${E(r.title)}</div><div class="s">${r.time}</div></div></div>`).join("")}</div>` : ""}</div></div>`;
};
N.act.toggle = d => { const r = N.toggleTask(d.id); if (!r) return;
  N.toast(r.unlocked.length ? "Récompense débloquée : " + r.unlocked[0].name : r.task.done ? "Tâche terminée, bien joué." : "Tâche rouverte."); N.render(); };
N.act.removeDemo = () => N.confirm("Supprimer les données d’exemple ? Ton profil est conservé.", () => { N.Store.ad.set(N.Store.key + ".before-demo-removal", JSON.stringify(N.db)); N.db = N.emptyDb(N.db.profile); N.runReset(); N.save(); N.render(); }, "Supprimer");

/* ---------- tâches ---------- */
N.views.tasks = () => { const S = N.S, all = N.db.tasks;
  let l = all.filter(t => S.tstat === "all" || (S.tstat === "todo") !== t.done);
  const cnt = c => all.filter(t => !t.done && N.effCat(t) === c).length;
  if (S.tf !== "all") l = l.filter(t => N.effCat(t) === S.tf);
  if (S.tsubj) l = l.filter(t => t.subj === S.tsubj);
  l = N.sortTasks(l, S.tsort);
  const opt = (v, cur, lab) => `<option value="${E(v)}" ${v === cur ? "selected" : ""}>${E(lab)}</option>`;
  return N.head("Tâches", `<button class="btn" data-a="taskNew">${ic("plus")}Nouvelle tâche</button>`) +
  `<div class="tabs">${[["all", "Toutes"], ["priorite", "Priorité (" + cnt("priorite") + ")"], ["secondaire", "Secondaire (" + cnt("secondaire") + ")"], ["bonus", "Bonus (" + cnt("bonus") + ")"]].map(x => `<button class="tab ${S.tf === x[0] ? "on" : ""}" data-a="tfilter" data-k="${x[0]}">${x[1]}</button>`).join("")}</div>
<div class="flt"><select data-c="set" data-k="tstat" aria-label="Statut">${opt("todo", S.tstat, "À faire")}${opt("done", S.tstat, "Terminées")}${opt("all", S.tstat, "Toutes")}</select>
<select data-c="set" data-k="tsubj" aria-label="Matière">${opt("", S.tsubj, "Toutes les matières")}${N.db.subjects.map(s => opt(s.name, S.tsubj, s.name)).join("")}</select>
<select data-c="set" data-k="tsort" aria-label="Tri">${opt("due", S.tsort, "Tri : échéance")}${opt("cat", S.tsort, "Tri : catégorie")}${opt("imp", S.tsort, "Tri : importance")}${opt("subj", S.tsort, "Tri : matière")}${opt("dur", S.tsort, "Tri : durée")}</select></div>
<div class="g" style="margin-top:10px">${l.map(t => { const sg = N.suggest(t);
  return `<div>${N.taskRow(t)}<div class="tact">${t.catMode === "manual" && sg !== t.cat && !t.done ? `<button class="chip" data-a="applySugg" data-id="${E(t.id)}">Suggestion : ${N.CATS[sg]}, appliquer</button>` : ""}<button class="ib" aria-label="Modifier" data-a="taskEdit" data-id="${E(t.id)}">${ic("edit")}</button><button class="ib" aria-label="Supprimer" data-a="taskDel" data-id="${E(t.id)}">${ic("trash")}</button></div></div>`; }).join("") || '<div class="emp">Aucune tâche ici. Ajoute-en une pour commencer.</div>'}</div>`; };
N.act.tfilter = d => { N.S.tf = d.k; N.render(); };
N.act.applySugg = d => { const t = N.by(N.db.tasks, d.id); if (t) { t.cat = N.suggest(t); N.save(); N.render(); } };
N.act.taskDel = d => { const t = N.by(N.db.tasks, d.id); if (t) N.confirm("Supprimer « " + t.title + " » ?", () => { N.removeTask(d.id); N.toast("Tâche supprimée"); N.render(); }, "Supprimer"); };
N.act.taskNew = d => N.taskForm(null, d && d.cat);
N.act.taskEdit = d => N.taskForm(d.id);
N.taskForm = (id, cat) => {
  const t = id ? N.by(N.db.tasks, id) : { id: "", subj: (N.db.subjects[0] || {}).name || "Autre", title: "", due: N.addDays(N.todayS(), 2), imp: 2, dur: 30, catMode: cat ? "manual" : "auto", cat: cat || null };
  const cur = t.catMode === "manual" ? t.cat : "auto", rw = N.db.rewards.find(r => r.link && r.link.type === "task" && String(r.link.taskId) === String(t.id) && id);
  const subs = N.db.subjects.map(s => s.name); if (!subs.includes(t.subj)) subs.push(t.subj); if (!subs.includes("Autre")) subs.push("Autre");
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier la tâche" : "Nouvelle tâche"}</h2><form data-f="task"><input type="hidden" name="id" value="${E(id || "")}">
<label>Matière</label><select name="subj">${subs.map(s => `<option ${s === t.subj ? "selected" : ""}>${E(s)}</option>`).join("")}</select>
<label>Titre</label><input name="title" required maxlength="120" value="${E(t.title)}">
<div class="fg"><div><label>Échéance</label><input type="date" name="due" required value="${E(t.due)}" data-i="tsugg"></div><div><label>Durée estimée (min)</label><input type="number" name="dur" min="5" max="600" step="5" required value="${t.dur}"></div></div>
<label>Importance</label><div class="seg">${[[3, "Haute"], [2, "Normale"], [1, "Faible"]].map(x => `<label><input type="radio" name="imp" value="${x[0]}" ${(t.imp || 2) === x[0] ? "checked" : ""} data-c="tsugg"><span>${x[1]}</span></label>`).join("")}</div>
<label>Catégorie</label><select name="cat" data-c="tsugg"><option value="auto" ${cur === "auto" ? "selected" : ""}>Automatique (selon l’échéance et l’importance)</option>${Object.keys(N.CATS).map(k => `<option value="${k}" ${cur === k ? "selected" : ""}>${N.CATS[k]}</option>`).join("")}</select><div class="s" id="sg"></div>
<label>Récompense à débloquer (facultatif)</label><select name="reward"><option value="">Aucune</option>${N.db.rewards.map(r => `<option value="${E(r.id)}" ${rw && String(rw.id) === String(r.id) ? "selected" : ""}>${r.icon ? E(r.icon) + " " : ""}${E(r.name)}</option>`).join("")}</select>
<div id="ferr" class="err" role="alert"></div><div class="row" style="margin-top:18px;justify-content:flex-end"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Enregistrer</button></div></form>`);
  N.chg.tsugg(); };
N.chg.tsugg = () => { const f = document.querySelector("form[data-f=task]"); if (!f || !N.$("sg")) return; const due = f.elements.due.value, ck = f.querySelector("[name=imp]:checked"); if (!due) return;
  const t = { due, imp: ck ? +ck.value : 2 }; N.$("sg").textContent = "Suggestion : " + N.CATS[N.suggest(t)] + ". " + N.why(t) + "."; };
N.form.task = fd => {
  const id = fd.get("id"), title = String(fd.get("title") || "").trim(), due = fd.get("due"), dur = +fd.get("dur");
  if (!title || !due || !(dur >= 5 && dur <= 600)) return N.formErr("Vérifie le titre, l’échéance et la durée (5 à 600 min).");
  const cat = fd.get("cat"), o = { subj: fd.get("subj") || "Autre", title, due, dur, imp: +fd.get("imp") || 2, catMode: cat === "auto" ? "auto" : "manual", cat: cat === "auto" ? null : cat };
  let t; if (id) { t = N.by(N.db.tasks, id); Object.assign(t, o); } else { t = { id: N.uid(), done: false, doneAt: null, ...o }; N.db.tasks.push(t); }
  N.linkReward(fd.get("reward"), t); N.checkRewards(); N.save(); N.close(); N.toast(id ? "Tâche modifiée" : "Tâche ajoutée"); N.render(); };
})(globalThis);
