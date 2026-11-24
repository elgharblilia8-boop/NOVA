/* NOVA 2.0 : socle d’interface (icônes, modales, graphiques, navigation, événements) */
(function (g) {
"use strict";
const N = g.N;
const IC = { home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z", cal: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4", tasks: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  bell: "M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0", plus: "M12 5v14M5 12h14", trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13", edit: "M4 20h4L19 9l-4-4L4 16z",
  check: "M5 12l5 5L19 7", rep: "M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4", clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z", book: "M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 17a3 3 0 0 1 3-3h11",
  timer: "M10 2h4M12 14l3-3M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16z", chart: "M3 3v18h18M7 15l4-4 3 3 5-6", dots: "M5 12h.01M12 12h.01M19 12h.01", play: "M7 4l13 8-13 8z", pause: "M8 5v14M16 5v14",
  left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2", spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" };
const E = N.esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
N.ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"/></svg>`;
N.views = {}; N.act = {}; N.form = {}; N.chg = {};
N.S = { v: "home", wo: 0, day: null, tf: "all", tstat: "todo", tsubj: "", tsort: "due", rtab: "lock", gsel: "all", pm: 0, pday: null };
N.$ = id => document.getElementById(id);
N.slogan = "Fall in love with the process.";
N.toast = m => { const t = N.$("toast"); if (!t) return; t.textContent = m; t.classList.add("on"); clearTimeout(N._tt); N._tt = setTimeout(() => t.classList.remove("on"), 2400); };
N.modal = h => { const m = N.$("mod"); m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${h}</div>`; m.classList.add("on"); const f = m.querySelector("input:not([type=hidden]):not([type=radio]):not([type=checkbox]),select"); if (f && f.focus) f.focus(); };
N.close = () => { const m = N.$("mod"); if (m) { m.classList.remove("on"); m.innerHTML = ""; } };
N.confirm = (msg, ok, label) => { N._ok = ok; N.modal(`<h2 style="margin-top:0">${E(msg)}</h2><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn o" data-a="close">Annuler</button><button class="btn" data-a="confirmOk">${E(label || "Confirmer")}</button></div>`); };
N.formErr = m => { const e = N.$("ferr"); if (e) e.textContent = m; return false; };
N.act.close = () => N.close();
N.act.confirmOk = () => { const f = N._ok; N.close(); if (f) f(); };
N.act.go = d => N.go(d.v);
N.chg.set = (d, el) => { N.S[d.k] = el.value; N.render(); };
N.go = v => { N.S.v = v; N.render(); if (g.scrollTo) g.scrollTo(0, 0); };
N.brand = () => `<div class="brand"><div class="logo">NOVA<b>✦</b></div><div class="slogan">${N.slogan}</div></div>`;
N.head = (t, btn) => `<div class="row hd"><h1 class="f">${E(t)}</h1>${btn || ""}</div>`;
N.pb = p => `<div class="pb" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100, Math.max(0, p))}%"></i></div>`;

/* ---------- graphiques SVG (aucune dépendance) ---------- */
N.line = (pts, o) => { o = o || {}; if (!pts.length) return '<div class="emp">Ajoute des notes pour voir ta progression.</div>';
  const w = 320, h = 160, L = 30, R = 10, T = 10, B = 24, iw = w - L - R, ih = h - T - B, mn = o.min == null ? 0 : o.min, mx = o.max == null ? 20 : o.max, n = pts.length;
  const X = i => L + (n === 1 ? iw / 2 : iw * i / (n - 1)), Y = v => T + ih * (1 - (Math.min(Math.max(v, mn), mx) - mn) / (mx - mn));
  let s = `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(o.label || "Graphique")}">`;
  [mn, mn + (mx - mn) / 2, mx].forEach(v => { s += `<line class="gr0" x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 4}" y="${Y(v) + 3}" text-anchor="end">${Math.round(v)}</text>`; });
  if (o.target != null) s += `<line class="tg" x1="${L}" x2="${w - R}" y1="${Y(o.target)}" y2="${Y(o.target)}"/>`;
  s += `<path class="l" d="${pts.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p.y).toFixed(1)).join("")}"/>`;
  pts.forEach((p, i) => { s += `<circle class="d" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5"><title>${E(p.x)} : ${N.f1(p.y)}</title></circle>`; });
  s += `<text x="${L}" y="${h - 6}">${E(pts[0].x)}</text>` + (n > 1 ? `<text x="${w - R}" y="${h - 6}" text-anchor="end">${E(pts[n - 1].x)}</text>` : "");
  return s + "</svg>"; };
N.bars = (items, o) => { o = o || {}; if (!items.length) return "";
  const w = 320, h = 150, L = 28, R = 6, T = 10, B = 26, iw = w - L - R, ih = h - T - B, mx = o.max || Math.max(1, ...items.map(i => i.v), o.goal || 0), st = iw / items.length, bw = Math.min(28, st * .6), Y = v => T + ih * (1 - v / mx);
  let s = `<svg class="ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(o.label || "Graphique")}"><line class="gr0" x1="${L}" x2="${w - R}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  if (o.goal) s += `<line class="tg" x1="${L}" x2="${w - R}" y1="${Y(o.goal)}" y2="${Y(o.goal)}"/>`;
  items.forEach((it, i) => { const x = L + st * i + (st - bw) / 2, y = Y(it.v); s += `<rect class="b" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, Y(0) - y).toFixed(1)}" rx="4"${it.c ? ` style="fill:${it.c}"` : ""}><title>${E(it.l)} : ${E(it.t == null ? it.v : it.t)}</title></rect><text x="${(x + bw / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle">${E(it.l)}</text>`; });
  s += `<text x="${L - 4}" y="${T + 4}" text-anchor="end">${Math.round(mx)}</text><text x="${L - 4}" y="${Y(0)}" text-anchor="end">0</text>`;
  return s + "</svg>"; };

/* ---------- navigation et rendu ---------- */
const NAV = [["home", "Accueil", "home"], ["tasks", "Tâches", "tasks"], ["plan", "Planner", "cal"], ["rewards", "Récompenses", "gift"], ["grades", "Notes", "book"], ["focus", "Focus", "timer"], ["progress", "Progrès", "chart"], ["rem", "Rappels", "bell"], ["more", "Réglages", "gear"]];
const BOT = [["home", "Accueil", "home"], ["tasks", "Tâches", "tasks"], ["plan", "Planner", "cal"], ["focus", "Focus", "timer"], ["more", "Plus", "dots"]];
const SUB = ["rewards", "grades", "progress", "rem", "more"];
N.nav = () => { const cur = N.S.v, b = (l, bot) => l.map(n => { const on = n[0] === cur || (bot && n[0] === "more" && SUB.includes(cur)); return `<button data-a="go" data-v="${n[0]}" class="${on ? "on" : ""}"${on ? ' aria-current="page"' : ""}>${N.ic(n[2])}<span>${n[1]}</span></button>`; }).join("");
  N.$("sb").innerHTML = N.brand() + b(NAV, false) + `<div class="me">${E(N.db.profile.name || "Élève")}${N.db.profile.level ? "<br>" + E(N.db.profile.level) : ""}</div>`; N.$("bn").innerHTML = b(BOT, true); };
N.render = () => { N.nav(); const f = N.views[N.S.v] || N.views.home;
  N.$("main").innerHTML = `<div class="top">${N.brand()}</div>` + (N.saveOk === false ? '<div class="card note">Impossible d’enregistrer sur cet appareil (stockage plein ou navigation privée). Exporte une sauvegarde dans Réglages.</div>' : "") + f();
  if (N.focusUpdate) N.focusUpdate(); };
N.bind = () => {
  document.addEventListener("click", e => { if (e.target.id === "mod") return N.close(); const el = e.target.closest("[data-a]"); if (el && N.act[el.dataset.a]) N.act[el.dataset.a](el.dataset, el, e); });
  document.addEventListener("submit", e => { const f = e.target.closest("form[data-f]"); if (f && N.form[f.dataset.f]) { e.preventDefault(); N.form[f.dataset.f](new FormData(f), f); } });
  const h = e => { const el = e.target.closest("[data-c]"); if (el && N.chg[el.dataset.c]) N.chg[el.dataset.c](el.dataset, el, e); };
  document.addEventListener("change", h); document.addEventListener("input", e => { const el = e.target.closest("[data-i]"); if (el && N.chg[el.dataset.i]) N.chg[el.dataset.i](el.dataset, el, e); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") N.close(); });
};
})(globalThis);
