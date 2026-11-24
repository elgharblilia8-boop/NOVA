/* NOVA 2.0 : planner intelligent (semaine, créneaux libres, séances, planification automatique) */
(function (g) {
"use strict";
const N = g.N, E = N.esc, ic = N.ic;
const cls = k => k === "exam" ? "exam" : k === "etude" ? "etude" : k === "pause" ? "pause" : k === "activite" ? "perso" : "";
const itemH = (i, d) => `<button class="ev ${cls(i.kind)}" style="--c:${N.subjColor(i.subj)}" data-a="editItem" data-src="${i.src}" data-id="${E(i.id)}"><div class="t">${E(i.title)}</div><div class="s">${i.s} – ${i.e}${i.place ? ", " + E(i.place) : ""}</div></button>`;
const slotH = (d, f) => `<button class="slot" data-a="slotAdd" data-date="${d}" data-s="${N.hm(f.s)}" data-e="${N.hm(f.e)}"><span>Créneau libre ${N.hm(f.s)} – ${N.hm(f.e)}</span><span class="s">${N.dur(f.e - f.s)}</span></button>`;
const selDate = () => N.addDays(N.addDays(N.monday(N.todayS()), N.S.wo * 7), N.S.day == null ? 0 : N.S.day);

N.views.plan = () => {
  const S = N.S, t0 = N.todayS(), ws = N.addDays(N.monday(t0), S.wo * 7), days = [0, 1, 2, 3, 4, 5, 6].map(i => N.addDays(ws, i));
  if (S.day == null) S.day = S.wo === 0 ? N.dow(t0) : 0;
  const now = N.nowFn(), nowM = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
  const col = (d, i) => { const items = N.items(d), fr = N.free(d, { from: d === t0 ? nowM : 0 }), w = N.window(d), st = N.studyMin(d);
    const rows = items.map(x => ({ s: N.mins(x.s), h: itemH(x, d) })).concat(fr.map(f => ({ s: f.s, h: slotH(d, f) }))).sort((a, b) => a.s - b.s).map(r => r.h).join("");
    return `<div class="col ${S.day === i ? "on" : ""}"><h3 class="${d === t0 ? "today" : ""}">${N.DAYS_L[i]} ${N.parse(d).getDate()}</h3>${rows || '<div class="s">Journée libre</div>'}<div class="s foot">${st ? "Étude prévue : " + N.dur(st) + ". " : ""}Temps libre à partir de ${N.hm(w[1])}.</div></div>`; };
  const ex = N.db.exams.filter(x => x.date >= t0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  return N.head("Planner", `<div class="row" style="gap:8px"><button class="btn o sm" data-a="autoPlan">${ic("spark")}Planifier mes tâches</button><button class="btn sm" data-a="addMenu">${ic("plus")}Ajouter</button></div>`) +
  `<div class="row wkn"><button class="ib" data-a="wk" data-n="-1" aria-label="Semaine précédente">${ic("left")}</button><div class="f t">${E(N.fmtD(days[0], { day: "numeric", month: "long" }))} au ${E(N.fmtD(days[6], { day: "numeric", month: "long" }))}</div><button class="ib" data-a="wk" data-n="1" aria-label="Semaine suivante">${ic("right")}</button><button class="chip" data-a="wk" data-n="0">Aujourd’hui</button></div>
<div class="tabs mob">${days.map((d, i) => `<button class="tab ${S.day === i ? "on" : ""}" data-a="pday2" data-i="${i}">${N.DAYS[i]} ${N.parse(d).getDate()}</button>`).join("")}</div>
<div class="wk" style="margin-top:12px">${days.map(col).join("")}</div>
<p class="s" style="margin-top:10px">Cours et activités (fixes), séances de travail (rose), examens (bordeaux) et créneaux libres (pointillés). Touche un élément pour le modifier, un créneau libre pour y planifier une séance.</p>
<h2>Examens à venir</h2><div class="g">${ex.map(x => `<button class="card row tl" data-a="editItem" data-src="exam" data-id="${E(x.id)}"><span class="dot" style="background:${N.subjColor(x.subj)}"></span><div class="f"><div class="t">${E(x.title)}</div><div class="s">${E(N.fmtD(x.date, { weekday: "long", day: "numeric", month: "long" }))}, ${x.start} – ${x.end}</div></div><span class="chip">${N.rel(x.date)}</span></button>`).join("") || '<div class="emp">Aucun examen à venir.</div>'}</div>`;
};
N.act.wk = d => { N.S.wo = +d.n === 0 ? 0 : N.S.wo + +d.n; N.S.day = null; N.render(); };
N.act.pday2 = d => { N.S.day = +d.i; N.render(); };
N.act.addMenu = () => N.modal(`<h2 style="margin-top:0">Ajouter au planner</h2><div class="g"><button class="card tl" data-a="sessNew"><div class="t">Séance de travail</div><div class="s">Un moment d’étude, sans chevauchement</div></button><button class="card tl" data-a="evNew"><div class="t">Cours ou activité</div><div class="s">Se répète chaque semaine</div></button><button class="card tl" data-a="exNew"><div class="t">Examen</div><div class="s">Date et horaires précis</div></button></div>`);
N.act.sessNew = () => N.sessionForm(null, { date: selDate() });
N.act.slotAdd = d => N.sessionForm(null, { date: d.date, s: d.s, e: d.e });
N.act.evNew = () => N.eventForm(null);
N.act.exNew = () => N.examForm(null);
N.act.editItem = d => { if (d.src === "session") N.sessionForm(d.id); else if (d.src === "event") N.eventForm(d.id); else N.examForm(d.id); };
const errRow = () => '<div id="ferr" class="err" role="alert"></div>';
const btns = (src, id) => `<div class="row" style="margin-top:18px;justify-content:space-between">${id ? `<button type="button" class="btn o" data-a="delItem" data-src="${src}" data-id="${E(id)}">${ic("trash")}Supprimer</button>` : "<span></span>"}<div class="row"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Enregistrer</button></div></div>`;

N.sessionForm = (id, pre) => {
  const x = id ? N.by(N.db.sessions, id) : Object.assign({ date: N.todayS(), s: "17:00", e: "17:45", title: "", subj: "", taskId: "", kind: "etude" }, pre || {});
  const tasks = N.openTasks().concat(x.taskId ? N.db.tasks.filter(t => String(t.id) === String(x.taskId) && t.done) : []);
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier la séance" : "Nouvelle séance"}</h2><form data-f="session"><input type="hidden" name="id" value="${E(id || "")}">
<label>Titre</label><input name="title" required maxlength="100" value="${E(x.title)}">
<label>Tâche liée (facultatif)</label><select name="task"><option value="">Aucune</option>${tasks.map(t => `<option value="${E(t.id)}" ${String(t.id) === String(x.taskId) ? "selected" : ""}>${E(t.title)}</option>`).join("")}</select>
<label>Matière (facultatif)</label><select name="subj"><option value="">Aucune</option>${N.db.subjects.map(s => `<option ${s.name === x.subj ? "selected" : ""}>${E(s.name)}</option>`).join("")}</select>
<label>Date</label><input type="date" name="date" required value="${E(x.date)}"><div class="fg"><div><label>Début</label><input type="time" name="start" required value="${x.s}"></div><div><label>Fin</label><input type="time" name="end" required value="${x.e}"></div></div>
${errRow()}${btns("session", id)}</form>`); };
N.form.session = fd => {
  const id = fd.get("id"), date = fd.get("date"), s = fd.get("start"), e = fd.get("end"), title = String(fd.get("title") || "").trim();
  if (!date || !s || !e || !title) return N.formErr("Complète le titre, la date et les horaires.");
  if (N.mins(s) >= N.mins(e)) return N.formErr("L’heure de fin doit suivre l’heure de début.");
  const c = N.conflict(date, s, e, id); if (c) return N.formErr(`Ce créneau chevauche « ${c.title} » (${c.s} – ${c.e}). Choisis un autre horaire.`);
  const o = { date, s, e, title, subj: fd.get("subj") || "", taskId: fd.get("task") || "" };
  if (id) Object.assign(N.by(N.db.sessions, id), o); else N.db.sessions.push({ id: N.uid(), kind: "etude", ...o });
  N.save(); N.close(); N.toast("Séance enregistrée"); N.render(); };
N.eventForm = id => {
  const x = id ? N.by(N.db.events, id) : { day: N.S.day == null ? 0 : N.S.day, start: "08:00", end: "09:00", title: "", kind: "cours", place: "" };
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier le cours ou l’activité" : "Nouveau cours ou activité"}</h2><form data-f="event"><input type="hidden" name="id" value="${E(id || "")}">
<label>Titre</label><input name="title" required maxlength="80" value="${E(x.title)}"><div class="fg"><div><label>Type</label><select name="kind"><option value="cours" ${x.kind === "cours" ? "selected" : ""}>Cours</option><option value="activite" ${x.kind === "activite" ? "selected" : ""}>Activité</option></select></div>
<div><label>Jour (chaque semaine)</label><select name="day">${N.DAYS_L.map((d, i) => `<option value="${i}" ${+x.day === i ? "selected" : ""}>${d}</option>`).join("")}</select></div></div>
<div class="fg"><div><label>Début</label><input type="time" name="start" required value="${x.start}"></div><div><label>Fin</label><input type="time" name="end" required value="${x.end}"></div></div>
<label>Lieu (facultatif)</label><input name="place" maxlength="60" value="${E(x.place || "")}">${errRow()}${btns("event", id)}</form>`); };
N.form.event = fd => { const id = fd.get("id"), title = String(fd.get("title") || "").trim(), s = fd.get("start"), e = fd.get("end");
  if (!title || !s || !e) return N.formErr("Complète le titre et les horaires.");
  if (N.mins(s) >= N.mins(e)) return N.formErr("L’heure de fin doit suivre l’heure de début.");
  const o = { title, kind: fd.get("kind"), day: +fd.get("day"), start: s, end: e, place: String(fd.get("place") || "").trim() };
  if (id) Object.assign(N.by(N.db.events, id), o); else N.db.events.push({ id: N.uid(), ...o });
  N.save(); N.close(); N.toast("Enregistré"); N.render(); };
N.examForm = id => {
  const x = id ? N.by(N.db.exams, id) : { date: N.addDays(N.todayS(), 7), start: "09:00", end: "11:00", title: "", subj: "" };
  N.modal(`<h2 style="margin-top:0">${id ? "Modifier l’examen" : "Nouvel examen"}</h2><form data-f="exam"><input type="hidden" name="id" value="${E(id || "")}">
<label>Titre</label><input name="title" required maxlength="80" value="${E(x.title)}"><label>Matière</label><select name="subj"><option value="">Aucune</option>${N.db.subjects.map(s => `<option ${s.name === x.subj ? "selected" : ""}>${E(s.name)}</option>`).join("")}</select>
<label>Date</label><input type="date" name="date" required value="${E(x.date)}"><div class="fg"><div><label>Début</label><input type="time" name="start" required value="${x.start}"></div><div><label>Fin</label><input type="time" name="end" required value="${x.end}"></div></div>${errRow()}${btns("exam", id)}</form>`); };
N.form.exam = fd => { const id = fd.get("id"), title = String(fd.get("title") || "").trim(), s = fd.get("start"), e = fd.get("end"), date = fd.get("date");
  if (!title || !date || !s || !e) return N.formErr("Complète le titre, la date et les horaires.");
  if (N.mins(s) >= N.mins(e)) return N.formErr("L’heure de fin doit suivre l’heure de début.");
  const o = { title, subj: fd.get("subj") || "", date, start: s, end: e };
  if (id) Object.assign(N.by(N.db.exams, id), o); else N.db.exams.push({ id: N.uid(), ...o });
  N.save(); N.close(); N.toast("Examen enregistré"); N.render(); };
N.act.delItem = d => { const key = { session: "sessions", event: "events", exam: "exams" }[d.src];
  N.confirm("Supprimer cet élément du planner ?", () => { N.db[key] = N.db[key].filter(x => String(x.id) !== String(d.id)); N.save(); N.toast("Supprimé"); N.render(); }, "Supprimer"); };

/* ---------- planification automatique ---------- */
N.act.autoPlan = () => {
  const r = N.autoPlan(); N._plan = r; const st = r.blocks.filter(b => b.kind === "etude");
  const lines = st.map(b => `<label class="pk"><input type="checkbox" name="b" value="${E(b.id)}" checked><span><b>${E(b.title)}</b><br><span class="s">${E(N.fmtD(b.date, { weekday: "long", day: "numeric", month: "long" }))}, ${b.s} – ${b.e}</span></span></label>`).join("");
  N.modal(`<h2 style="margin-top:0">Séances proposées</h2>${st.length ? `<p class="s">Selon tes tâches, leurs échéances et tes créneaux libres. Aucune séance ne chevauche un cours ou un examen, et des pauses sont prévues. Décoche ce que tu ne veux pas.</p><form data-f="applyPlan"><div class="pkl">${lines}</div>${r.left.map(l => `<p class="s">« ${E(l.task.title)} » : ${N.dur(l.min)} sans créneau avant l’échéance. Tu peux élargir tes horaires d’étude dans Réglages.</p>`).join("")}<div class="row" style="margin-top:14px;justify-content:flex-end"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Ajouter au planning</button></div></form>`
    : `<p class="s">Rien à ajouter pour l’instant : tes tâches ouvertes ont déjà leurs séances, ou aucun créneau libre n’est disponible avant leurs échéances.</p>${r.left.map(l => `<p class="s">« ${E(l.task.title)} » : ${N.dur(l.min)} sans créneau. Élargis tes horaires d’étude dans Réglages.</p>`).join("")}<div class="row" style="justify-content:flex-end"><button class="btn" data-a="close">Fermer</button></div>`}`);
};
N.form.applyPlan = fd => {
  const ids = new Set(fd.getAll("b").map(String)), bl = (N._plan || { blocks: [] }).blocks; let n = 0;
  bl.filter(b => b.kind === "etude" ? ids.has(String(b.id)) : bl.some(s => s.kind === "etude" && ids.has(String(s.id)) && s.date === b.date && s.e === b.s))
    .forEach(b => { if (!N.conflict(b.date, b.s, b.e)) { N.db.sessions.push(b); if (b.kind === "etude") n++; } });
  N.save(); N.close(); N.toast(n ? n + " séance" + (n > 1 ? "s" : "") + " ajoutée" + (n > 1 ? "s" : "") + " au planner" : "Aucune séance ajoutée"); N.render(); };
})(globalThis);
