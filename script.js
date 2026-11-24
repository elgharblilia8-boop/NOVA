/* NOVA 2.0 : démarrage (données, interface, minuteur, installation, hors ligne) */
(function (g) {
"use strict";
const N = g.N;
let dip = null, hidden = false;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); dip = e; if (N.S.v === "home") N.render(); });
addEventListener("appinstalled", () => { dip = null; N.render(); });
const standalone = () => (g.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
N.instH = () => {
  if (hidden || standalone()) return "";
  const m = dip ? "Installe NOVA sur cet appareil pour l’ouvrir comme une application." : ios() ? "Pour installer NOVA : touche Partager dans Safari, puis « Sur l’écran d’accueil »." : "";
  if (!m) return "";
  return `<div class="card inst"><div class="s" style="color:var(--ink);flex:1">${m}</div><div class="row">${dip ? '<button class="btn sm" data-a="doInst">Installer</button>' : ""}<button class="btn o sm" data-a="hideInst">Plus tard</button></div></div>`;
};
N.act.doInst = async () => { if (!dip) return; dip.prompt(); try { await dip.userChoice; } catch (e) {} dip = null; N.render(); };
N.act.hideInst = () => { hidden = true; N.render(); };

N.start = () => {
  N.init(); N.bind(); N.render(); N.welcome();
  if (N.pendingDone) { const r = N.pendingDone; N.pendingDone = null; N.focusDone(r); }
  setInterval(() => { const r = N.runTick(); if (r) N.focusDone(r); N.focusUpdate(); }, 500);
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
};
N.start();
})(globalThis);
