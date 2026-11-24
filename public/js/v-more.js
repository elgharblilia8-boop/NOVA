/* NOVA 2.0 : rappels (aide-mémoire), réglages, données locales, écran de bienvenue */
(function (g) {
"use strict";
const N = g.N, E = N.esc, ic = N.ic;

/* ---------- rappels ---------- */
N.views.rem = () => N.head("Rappels", `<button class="btn" data-a="remNew">${ic("plus")}Nouveau</button>`) +
  `<div class="card note"><div class="s">Les rappels sont des aide-mémoire affichés dans NOVA (ils apparaissent sur l’accueil le jour concerné). NOVA n’envoie pas de notifications.</div></div>
<div class="g" style="margin-top:10px">${N.db.rems.map(r => `<div class="card row"><div class="av" style="background:var(--rs2);color:var(--acc)">${ic(r.kind === "rec" ? "rep" : "clock")}</div><div class="f"><div class="t">${E(r.title)}</div><div class="s">${E(N.remLabel(r))}</div></div>
<button class="sw ${r.on ? "on" : ""}" role="switch" aria-checked="${r.on}" aria-label="Activer le rappel ${E(r.title)}" data-a="remToggle" data-id="${E(r.id)}"></button><button class="ib" aria-label="Supprimer" data-a="remDel" data-id="${E(r.id)}">${ic("trash")}</button></div>`).join("") || '<div class="emp">Aucun rappel. Crée un rappel unique ou récurrent.</div>'}</div>`;
N.act.remToggle = d => { const r = N.by(N.db.rems, d.id); if (r) { r.on = !r.on; N.save(); N.render(); } };
N.act.remDel = d => { N.db.rems = N.db.rems.filter(x => String(x.id) !== String(d.id)); N.save(); N.toast("Rappel supprimé"); N.render(); };
N.act.remNew = () => N.modal(`<h2 style="margin-top:0">Nouveau rappel</h2><form data-f="rem"><label>Titre</label><input name="title" required maxlength="100" placeholder="Ex. : relire le cours d’histoire">
<label>Fréquence</label><div class="seg"><label><input type="radio" name="k" value="once" checked data-c="remk"><span>Une fois</span></label><label><input type="radio" name="k" value="rec" data-c="remk"><span>Récurrent</span></label></div>
<div id="r1"><label>Date</label><input type="date" name="d" value="${N.addDays(N.todayS(), 1)}"></div><div id="r2" hidden><label>Jours</label><div class="seg">${N.DAYS.map((x, i) => `<label><input type="checkbox" name="w" value="${i}"><span>${x}</span></label>`).join("")}</div></div>
<label>Heure</label><input type="time" name="h" required value="18:00"><div id="ferr" class="err" role="alert"></div><div class="row" style="margin-top:18px;justify-content:flex-end"><button type="button" class="btn o" data-a="close">Annuler</button><button class="btn">Créer</button></div></form>`);
N.chg.remk = (d, el) => { const once = el.value === "once", a = N.$("r1"), b = N.$("r2"); if (a) a.hidden = !once; if (b) b.hidden = once; };
N.form.rem = fd => { const k = fd.get("k"), w = fd.getAll("w").map(Number), title = String(fd.get("title") || "").trim();
  if (!title) return N.formErr("Donne un titre à ton rappel."); if (k === "rec" && !w.length) return N.formErr("Choisis au moins un jour.");
  if (k === "once" && !fd.get("d")) return N.formErr("Choisis une date.");
  N.db.rems.unshift({ id: N.uid(), title, time: fd.get("h"), kind: k, date: k === "once" ? fd.get("d") : "", days: k === "rec" ? w : [], on: true });
  N.save(); N.close(); N.toast("Rappel créé"); N.render(); };

/* ---------- plus et réglages ---------- */
N.views.more = () => { const p = N.db.settings.planner, db = N.db, size = Math.round(JSON.stringify(db).length / 1024);
  const tile = (v, t, s, i) => `<button class="card tl row" data-a="go" data-v="${v}">${ic(i)}<div class="f"><div class="t">${t}</div><div class="s">${s}</div></div>${ic("right")}</button>`;
  return N.head("Plus") + `<div class="g mob-only">${tile("rewards", "Récompenses", "Tes petits plaisirs à débloquer", "gift")}${tile("grades", "Notes", "Moyennes, objectifs et progression", "book")}${tile("progress", "Progrès", "Régularité et statistiques", "chart")}${tile("rem", "Rappels", "Aide-mémoire", "bell")}</div>
<h2>Profil</h2><form class="card fg" data-f="profile"><div><label>Prénom</label><input name="name" maxlength="30" value="${E(db.profile.name)}"></div><div><label>Niveau</label><input name="level" maxlength="30" value="${E(db.profile.level)}" placeholder="Ex. : Terminale"></div><div style="grid-column:1/-1"><button class="btn sm">Enregistrer</button></div></form>
<h2>Horaires d’étude du planner</h2><form class="card fg" data-f="plannerSet"><div><label>Semaine, début</label><input type="time" name="ws" value="${p.wk[0]}" required></div><div><label>Semaine, fin</label><input type="time" name="we" value="${p.wk[1]}" required></div>
<div><label>Week-end, début</label><input type="time" name="ss" value="${p.we[0]}" required></div><div><label>Week-end, fin</label><input type="time" name="se" value="${p.we[1]}" required></div>
<div><label>Séance maximale (min)</label><input type="number" name="mb" min="20" max="180" step="5" value="${p.maxBlock}"></div><div><label>Pause entre séances (min)</label><input type="number" name="br" min="5" max="60" step="5" value="${p.brk}"></div>
<div><label>Étude maximale par jour (min)</label><input type="number" name="md" min="30" max="600" step="10" value="${p.maxDay}"></div><div style="grid-column:1/-1"><div class="s">Après l’heure de fin, le temps est libre : NOVA n’y planifie rien.</div><div id="ferr" class="err" role="alert"></div><button class="btn sm" style="margin-top:6px">Enregistrer</button></div></form>
<h2>Données</h2><div class="card"><div class="s">Tout est enregistré uniquement sur cet appareil (environ ${size} Ko). Fais une sauvegarde pour changer d’appareil ou par précaution.</div>
<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn o sm" data-a="export">Exporter une sauvegarde</button><label class="btn o sm" style="margin:0;cursor:pointer">Importer<input type="file" accept="application/json,.json" hidden data-c="import"></label>${db.settings.demo ? '<button class="btn o sm" data-a="removeDemo">Supprimer les données d’exemple</button>' : ""}<button class="btn o sm" data-a="resetAll">Tout effacer</button></div></div>
<h2>À propos</h2><div class="card"><div class="t">NOVA ${N.version}</div><div class="s">${N.slogan}<br>Fonctionne hors connexion une fois chargée. Aucune notification n’est envoyée par NOVA.</div></div>`; };
N.form.profile = fd => { N.db.profile = { name: String(fd.get("name") || "").trim(), level: String(fd.get("level") || "").trim() }; N.save(); N.toast("Profil enregistré"); N.render(); };
N.form.plannerSet = fd => { const a = [fd.get("ws"), fd.get("we")], b = [fd.get("ss"), fd.get("se")], mb = +fd.get("mb"), br = +fd.get("br"), md = +fd.get("md");
  if (N.mins(a[0]) >= N.mins(a[1]) || N.mins(b[0]) >= N.mins(b[1])) return N.formErr("Le début doit précéder la fin.");
  if (!(mb >= 20 && mb <= 180 && br >= 5 && br <= 60 && md >= 30 && md <= 600)) return N.formErr("Vérifie les durées saisies.");
  N.db.settings.planner = { wk: a, we: b, maxBlock: mb, brk: br, maxDay: md }; N.save(); N.toast("Horaires enregistrés"); N.render(); };
N.act.export = () => { const b = new Blob([JSON.stringify(N.db, null, 2)], { type: "application/json" }), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "nova-sauvegarde-" + N.todayS() + ".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); N.toast("Sauvegarde exportée"); };
N.chg.import = (d, el) => { const f = el.files && el.files[0]; if (!f) return;
  f.text().then(t => { let o; try { o = JSON.parse(t); } catch (e) { return N.toast("Fichier illisible."); }
    if (!o || typeof o !== "object" || !Array.isArray(o.tasks)) return N.toast("Ce fichier n’est pas une sauvegarde NOVA.");
    N.Store.ad.set(N.Store.key + ".before-import", JSON.stringify(N.db)); N.db = N.migrate(o).db; N.db.settings.welcomed = true; N.save(); N.toast("Sauvegarde importée"); N.render(); }); };
N.act.resetAll = () => N.confirm("Effacer toutes tes données NOVA sur cet appareil ? Une copie de secours reste en mémoire locale.", () => {
  N.Store.ad.set(N.Store.key + ".before-reset", JSON.stringify(N.db)); N.db = N.emptyDb(); N.run = N.runDefault(); N.saveRun(); N.save(); N.render(); }, "Tout effacer");

/* ---------- bienvenue ---------- */
N.welcome = () => { const w = N.$("wel"); if (!w || N.db.settings.welcomed) return; w.hidden = false;
  w.innerHTML = `<div class="wl"><div class="logo big">NOVA<b>✦</b></div><p class="wsl">${N.slogan}</p><p class="wtx">Ton espace pour t’organiser, avancer à ton rythme et célébrer chaque étape.</p>
<form data-f="welcome"><label for="wn" class="wlab">Comment doit-on t’appeler ?</label><input id="wn" name="name" maxlength="30" placeholder="Ton prénom" value="${E(N.db.profile.name)}" autocomplete="given-name"><button class="btn wbtn">Commencer</button></form><button class="wskip" data-a="welSkip">Passer</button></div>`; };
const done = () => { N.db.settings.welcomed = true; N.save(); const w = N.$("wel"); if (w) { w.hidden = true; w.innerHTML = ""; } N.render(); };
N.form.welcome = fd => { N.db.profile.name = String(fd.get("name") || "").trim(); done(); };
N.act.welSkip = () => done();
})(globalThis);
