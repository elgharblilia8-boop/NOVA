const IC={home:"M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",cal:"M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",tasks:"M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",bell:"M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0",spark:"M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",plus:"M12 5v14M5 12h14",trash:"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",edit:"M4 20h4L19 9l-4-4L4 16z",send:"M4 12l16-8-6 16-3-7z",check:"M5 12l5 5L19 7",rep:"M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4",clock:"M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18"};
const ic=n=>`<svg class="i" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;
const NAV=[["home","Accueil","home"],["plan","Planner","cal"],["tasks","Tâches","tasks"],["rem","Rappels","bell"],["ai","NOVA AI","spark"]];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T0=new Date();T0.setHours(0,0,0,0);const dow=(T0.getDay()+6)%7;
const ad=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const mon=ad(T0,dow===6?1:-dow);const WK=dow===6?7-dow+6:0;
const dd=(s,o)=>new Date(s+"T00:00").toLocaleDateString("fr-FR",o);
const diff=s=>Math.round((new Date(s+"T00:00")-T0)/864e5);
const rel=s=>{const n=diff(s);return n<0?"En retard":n===0?"Aujourd’hui":n===1?"Demain":n<7?dd(s,{weekday:"long"}):dd(s,{day:"numeric",month:"short"})};
const hm=m=>m<60?m+" min":Math.floor(m/60)+" h"+(m%60?" "+String(m%60).padStart(2,"0"):"");
const DS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],DL=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SC={"Mathématiques":"#5C1A2E","Physique-chimie":"#A0596B","Français":"#C98B86","Histoire-géo":"#8A6A4F","Anglais":"#6E7F6A","SVT":"#7B6A8A","Philosophie":"#4F5D75"};
const SUBJ=Object.keys(SC);
const seedTasks=()=>[[ "Mathématiques","Exercices sur les suites, fiche 7",1,"haute",45,0],["Français","Dissertation : plan détaillé",2,"haute",90,0],["Physique-chimie","Compte rendu de TP sur la spectrophotométrie",3,"moyenne",60,0],["Anglais","Vocabulaire de l’unité 5 (30 mots)",1,"basse",20,1],["SVT","Fiches de révision : génétique",5,"moyenne",75,0],["Histoire-géo","Croquis sur la mondialisation",6,"basse",40,0],["Philosophie","Lecture : Le Mythe de Sisyphe, chapitre 2",8,"basse",50,0]].map((a,i)=>({id:i+1,subj:a[0],title:a[1],due:iso(ad(T0,a[2])),prio:a[3],dur:a[4],done:!!a[5]}));
const seedRems=()=>[{id:1,title:"Apporter la calculatrice graphique",time:"07:30",kind:"once",date:iso(ad(T0,1)),days:[],on:true},{id:2,title:"Réviser les fiches du jour",time:"18:00",kind:"rec",date:"",days:[0,2,4],on:true},{id:3,title:"Préparer le plan de la semaine",time:"16:00",kind:"rec",date:"",days:[6],on:true},{id:4,title:"Rendre l’autorisation de sortie",time:"08:00",kind:"once",date:iso(ad(T0,2)),days:[],on:false}];
const E=[[0,"08:00","10:00","Mathématiques","c","Salle 214"],[0,"10:15","12:15","Français","c","Salle 108"],[0,"14:00","16:00","Physique-chimie","c","Labo 2"],[0,"17:30","18:30","Révision de maths","e","Bibliothèque"],
[1,"08:00","09:00","Anglais","c","Salle 301"],[1,"09:00","11:00","SVT","c","Labo 1"],[1,"13:30","15:30","Histoire-géo","c","Salle 112"],[1,"18:00","19:00","Basket","p","Gymnase"],
[2,"08:00","10:00","Mathématiques","c","Salle 214"],[2,"10:15","12:15","Philosophie","c","Salle 205"],[2,"14:00","15:30","Dissertation de français","e","Chez moi"],
[3,"08:00","10:00","Physique-chimie","c","Labo 2"],[3,"10:15","12:15","Philosophie","c","Salle 205"],[3,"15:00","17:00","DS de mathématiques","x","Salle 214"],
[4,"08:00","10:00","Français","c","Salle 108"],[4,"10:15","12:15","Anglais","c","Salle 301"],[4,"14:00","16:00","SVT","c","Labo 1"],[4,"17:00","18:00","Piano","p","Conservatoire"],
[5,"10:00","12:00","Fiches de SVT","e","Chez moi"],[5,"15:00","17:00","Sortie avec Inès","p","Centre-ville"],
[6,"16:00","17:30","Plan de la semaine","e","Chez moi"],[6,"19:00","20:00","Vocabulaire d’anglais","e","Chez moi"]].map(a=>({d:a[0],s:a[1],e:a[2],t:a[3],k:a[4],p:a[5]}));
const EX=[["DS de mathématiques","Mathématiques",ad(mon,3)],["Contrôle de physique-chimie","Physique-chimie",ad(mon,9)],["Bac blanc de français","Français",ad(mon,17)]];
/* ===== Configuration et stockage ===== */
const CONFIG={API_URL:"/chat",TIMEOUT_MS:25000,HISTORY:10,PROFILE:{name:"Camille",level:"Terminale"}}; // PROFILE : à remplacer par le profil réel de l’élève
const Store={key:"nova.v1", // stockage local (localStorage). Pour une base de données, remplacer par un adaptateur qui appelle votre API.
 load(){try{return JSON.parse(localStorage.getItem(this.key))}catch(e){return null}},
 save(d){try{localStorage.setItem(this.key,JSON.stringify(d))}catch(e){}}};
const saved=Store.load();
let tasks=(saved&&saved.tasks)||seedTasks(),rems=(saved&&saved.rems)||seedRems(),sessions=(saved&&saved.sessions)||[];
let S={v:"home",day:dow===6?0:dow,f:"all"};let chat=[];let nid=Math.max(20,...tasks.concat(rems,sessions).map(x=>x.id+1));
const toast=m=>{const t=document.getElementById("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("on"),1800)};
const om=h=>{const m=document.getElementById("mod");m.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${h}</div>`;m.classList.add("on");const f=m.querySelector("input,select");f&&f.focus()};
const cm=()=>document.getElementById("mod").classList.remove("on");
document.addEventListener("keydown",e=>e.key==="Escape"&&cm());
const go=v=>{S.v=v;render();scrollTo(0,0)};
function nav(){const h=NAV.map(n=>`<button class="${S.v===n[0]?"on":""}" onclick="go('${n[0]}')" ${S.v===n[0]?'aria-current="page"':""}>${ic(n[2])}${n[1]}</button>`).join("");
document.getElementById("bn").innerHTML=h;document.getElementById("sb").innerHTML=`<div class="logo">NOVA<b>✦</b></div>${h}<div class="me">Camille Laurent<br>Terminale, lycée Descartes</div>`}
const subj=s=>`<span class="dot" style="background:${SC[s]||"var(--rs)"}"></span>`;
const sess2ev=s=>({k:"e",t:s.title,subj:s.subj,s:s.s,e:s.e,p:s.subj||"Séance de travail"});
const evFor=date=>{const w=(new Date(date+"T00:00").getDay()+6)%7;return E.filter(e=>e.d===w).concat(sessions.filter(s=>s.date===date).map(sess2ev)).sort((a,b)=>a.s.localeCompare(b.s))};
const evH=e=>`<div class="ev ${e.k==="x"?"exam":e.k==="e"?"etude":e.k==="p"?"perso":""}" style="--c:${SC[e.subj]||SC[e.t]||"var(--rs)"}"><div class="t">${e.t}</div><div class="s">${e.s} – ${e.e}, ${e.p}</div></div>`;
const open=()=>tasks.filter(t=>!t.done).sort((a,b)=>a.due.localeCompare(b.due)||(a.prio==="haute"?-1:1));
const taskH=t=>`<div class="card row ${t.done?"done":""}"><button class="ck" aria-label="Marquer comme terminée" onclick="tg(${t.id})">${ic("check")}</button><div class="f"><div class="t">${esc(t.title)}</div><div class="s row" style="gap:6px;flex-wrap:wrap">${subj(t.subj)}${t.subj}, ${hm(t.dur)}</div></div><div style="text-align:right;display:grid;gap:4px;justify-items:end"><span class="chip ${diff(t.due)<0&&!t.done?"late":""}">${rel(t.due)}</span><span class="chip ${t.prio}">${{haute:"Haute",moyenne:"Moyenne",basse:"Basse"}[t.prio]}</span></div></div>`;
function home(){const h=new Date().getHours(),n=tasks.length,d=tasks.filter(t=>t.done).length,p=n?d/n:0,r=open(),w=r.filter(t=>diff(t.due)<7).reduce((a,t)=>a+t.dur,0),ev=evFor(iso(T0));
const c=2*Math.PI*40;
return `<div class="top"><div class="logo">NOVA<b>✦</b></div></div>
<div class="hero"><div style="z-index:1"><div class="d">${T0.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div><h1>${h<18?"Bonjour":"Bonsoir"}, Camille</h1><p>${r.filter(t=>diff(t.due)<=1).length} tâches à rendre d’ici demain. ${hm(w)} de travail estimé cette semaine.</p></div>
<div class="ring"><svg viewBox="0 0 100 100" width="96" height="96"><circle cx="50" cy="50" r="40" fill="none" stroke="#FBF6EE22" stroke-width="8"/><circle cx="50" cy="50" r="40" fill="none" stroke="#D8A7A4" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" transform="rotate(-90 50 50)"/></svg><span>${Math.round(p*100)}%</span></div></div>
${inst()}<div class="hg"><div><h2>Aujourd’hui</h2>${ev.length?ev.map(evH).join(""):'<div class="emp">Rien de prévu aujourd’hui.</div>'}
<h2>Examens à venir</h2><div class="g">${EX.slice(0,2).map(x=>`<div class="card row">${subj(x[1])}<div class="f"><div class="t">${x[0]}</div><div class="s">${x[2].toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div></div><span class="chip haute">${Math.round((x[2]-T0)/864e5)} j</span></div>`).join("")}</div></div>
<div><h2>Priorités</h2><div class="g">${r.slice(0,3).map(taskH).join("")||'<div class="emp">Tout est terminé. Bravo !</div>'}</div>
<h2>Progression du jour</h2><div class="card"><div class="t">${d} tâche${d>1?"s":""} terminée${d>1?"s":""} sur ${n}</div><div style="height:8px;background:var(--cr);border-radius:9px;margin-top:10px"><div style="height:8px;width:${p*100}%;background:var(--bd);border-radius:9px"></div></div></div>
<h2>Prochaines échéances <button class="chip" onclick="go('tasks')">Tout voir</button></h2><div class="g">${r.slice(3,6).map(taskH).join("")}</div></div></div>`}
function plan(){const b=ad(mon,0),e=ad(mon,6);
return `<div class="top"><div class="logo">NOVA<b>✦</b></div></div><h1 style="font-size:28px">Planner</h1><p class="s" style="margin-bottom:12px">Semaine du ${b.getDate()} au ${e.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p>
<div class="tabs mob">${DS.map((x,i)=>`<button class="tab ${S.day===i?"on":""}" onclick="S.day=${i};render()">${x} ${ad(mon,i).getDate()}</button>`).join("")}</div>
<div class="wk" style="margin-top:12px">${DL.map((x,i)=>`<div class="col ${S.day===i?"on":""}"><h3>${x} ${ad(mon,i).getDate()}</h3>${evFor(iso(ad(mon,i))).map(evH).join("")||'<div class="s">Journée libre</div>'}</div>`).join("")}</div>
<p class="s" style="margin-top:8px">Cours, sessions de travail (rose), engagements personnels (pointillés) et examens (bordeaux).</p>
<h2>Examens à venir</h2><div class="g">${EX.map(x=>`<div class="card row">${subj(x[1])}<div class="f"><div class="t">${x[0]}</div><div class="s">${x[2].toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div></div></div>`).join("")}</div>`}
function tasksV(){const l=tasks.filter(t=>S.f==="all"||(S.f==="todo")!==t.done).sort((a,b)=>a.done-b.done||a.due.localeCompare(b.due));
return `<div class="top"><div class="logo">NOVA<b>✦</b></div></div><div class="row" style="justify-content:space-between;margin-bottom:12px"><h1 style="font-size:28px">Tâches</h1><button class="btn" onclick="tf()">${ic("plus")}Nouvelle tâche</button></div>
<div class="tabs">${[["all","Toutes"],["todo","À faire"],["done","Terminées"]].map(x=>`<button class="tab ${S.f===x[0]?"on":""}" onclick="S.f='${x[0]}';render()">${x[1]}</button>`).join("")}</div>
<div class="g" style="margin-top:10px">${l.map(t=>`<div>${taskH(t)}<div style="display:flex;justify-content:flex-end;gap:2px;margin-top:2px"><button class="ib" aria-label="Modifier" onclick="tf(${t.id})">${ic("edit")}</button><button class="ib" aria-label="Supprimer" onclick="td(${t.id})">${ic("trash")}</button></div></div>`).join("")||'<div class="emp">Aucune tâche ici. Ajoute ta première tâche pour organiser ta semaine.</div>'}</div>`}
const tg=id=>{const t=tasks.find(x=>x.id===id);t.done=!t.done;toast(t.done?"Tâche terminée":"Tâche rouverte");render()};
const td=id=>{tasks=tasks.filter(x=>x.id!==id);toast("Tâche supprimée");render()};
function tf(id){const t=tasks.find(x=>x.id===id)||{subj:"Mathématiques",title:"",due:iso(ad(T0,2)),prio:"moyenne",dur:30};
om(`<h2 style="margin-top:0">${id?"Modifier la tâche":"Nouvelle tâche"}</h2><form onsubmit="ts(event,${id||0})"><label>Matière</label><select name="s">${SUBJ.map(s=>`<option ${s===t.subj?"selected":""}>${s}</option>`).join("")}</select><label>Titre</label><input name="t" required value="${esc(t.title)}" placeholder="Ex. : exercices 12 à 15"><label>Échéance</label><input type="date" name="d" required value="${t.due}"><label>Priorité</label><div class="seg">${["haute","moyenne","basse"].map(p=>`<label><input type="radio" name="p" value="${p}" ${p===t.prio?"checked":""}><span>${p[0].toUpperCase()+p.slice(1)}</span></label>`).join("")}</div><label>Durée estimée (minutes)</label><input type="number" name="m" min="5" step="5" required value="${t.dur}"><div class="row" style="margin-top:20px;justify-content:flex-end"><button type="button" class="btn o" onclick="cm()">Annuler</button><button class="btn">Enregistrer</button></div></form>`)}
function ts(e,id){e.preventDefault();const f=new FormData(e.target),o={subj:f.get("s"),title:f.get("t").trim(),due:f.get("d"),prio:f.get("p"),dur:+f.get("m")};
if(id)Object.assign(tasks.find(x=>x.id===id),o);else tasks.push({id:nid++,done:false,...o});cm();toast(id?"Tâche modifiée":"Tâche ajoutée");render()}
const rl=r=>r.kind==="once"?rel(r.date)+" à "+r.time:(r.days.length===7?"Tous les jours":r.days.map(i=>DS[i]).join(", "))+" à "+r.time;
function remV(){return `<div class="top"><div class="logo">NOVA<b>✦</b></div></div><div class="row" style="justify-content:space-between;margin-bottom:12px"><h1 style="font-size:28px">Rappels</h1><button class="btn" onclick="rf()">${ic("plus")}Nouveau rappel</button></div>
<div class="g">${rems.map(r=>`<div class="card row"><div class="av" style="background:var(--rs2);color:var(--acc)">${ic(r.kind==="rec"?"rep":"clock")}</div><div class="f"><div class="t">${esc(r.title)}</div><div class="s">${rl(r)}</div></div><button class="sw ${r.on?"on":""}" role="switch" aria-checked="${r.on}" aria-label="Activer le rappel" onclick="rt(${r.id})"></button><button class="ib" aria-label="Supprimer" onclick="rd(${r.id})">${ic("trash")}</button></div>`).join("")||'<div class="emp">Aucun rappel. Crée un rappel unique ou récurrent.</div>'}</div>`}
const rt=id=>{const r=rems.find(x=>x.id===id);r.on=!r.on;render()};const rd=id=>{rems=rems.filter(x=>x.id!==id);toast("Rappel supprimé");render()};
function rf(){om(`<h2 style="margin-top:0">Nouveau rappel</h2><form onsubmit="rs(event)"><label>Titre</label><input name="t" required placeholder="Ex. : relire le cours d’histoire"><label>Fréquence</label><div class="seg"><label><input type="radio" name="k" value="once" checked onchange="rk()"><span>Une fois</span></label><label><input type="radio" name="k" value="rec" onchange="rk()"><span>Récurrent</span></label></div>
<div id="r1"><label>Date</label><input type="date" name="d" value="${iso(ad(T0,1))}"></div><div id="r2" hidden><label>Jours</label><div class="seg">${DS.map((x,i)=>`<label><input type="checkbox" name="w" value="${i}"><span>${x}</span></label>`).join("")}</div></div>
<label>Heure</label><input type="time" name="h" required value="18:00"><div class="row" style="margin-top:20px;justify-content:flex-end"><button type="button" class="btn o" onclick="cm()">Annuler</button><button class="btn">Créer le rappel</button></div></form>`)}
const rk=()=>{const o=document.querySelector("[name=k]:checked").value==="once";r1.hidden=!o;r2.hidden=o};
function rs(e){e.preventDefault();const f=new FormData(e.target),k=f.get("k"),w=f.getAll("w").map(Number);if(k==="rec"&&!w.length){toast("Choisis au moins un jour");return}
rems.unshift({id:nid++,title:f.get("t").trim(),time:f.get("h"),kind:k,date:k==="once"?f.get("d"):"",days:w,on:true});cm();toast("Rappel créé");render()}
function reply(q){q=q.toLowerCase();const r=open().slice(0,3);
if(/semaine|organis|planning/.test(q))return `<p>Voici une proposition légère pour cette semaine :</p><ul><li>Lundi soir : fiche 7 de maths (45 min)</li><li>Mardi : plan de dissertation (1 h 30)</li><li>Mercredi : compte rendu de TP (1 h)</li><li>Samedi matin : fiches de SVT (1 h 15)</li></ul><p>Cela laisse ton basket et ton piano intacts.</p>`;
if(/maths|ds|contr/.test(q))return `<p>Pour le DS de mathématiques, je te conseille 3 sessions de 40 minutes :</p><ul><li>Relire le cours sur les suites</li><li>Refaire deux exercices types sans la correction</li><li>Un sujet complet chronométré</li></ul><p>Je peux ajouter un rappel la veille si tu veux.</p>`;
if(/priorit|faire|urgent/.test(q))return `<p>Voici ce qui compte le plus en ce moment :</p><ul>${r.map(t=>`<li>${esc(t.title)} (${t.subj}, ${rel(t.due).toLowerCase()})</li>`).join("")}</ul>`;
if(/rappel/.test(q))return `<p>Bonne idée. Va dans l’onglet Rappels pour en créer un unique ou récurrent. Je te suggère un rappel quotidien à 18 h pour relire tes cours.</p>`;
return `<p>Je suis une version de démonstration : mes réponses sont des exemples. Essaie de me demander d’organiser ta semaine, de préparer un DS ou de définir tes priorités.</p>`}
chat=[{r:"n",h:"<p>Bonjour Camille, je suis NOVA. Je peux t’aider à prioriser tes tâches, préparer un contrôle ou organiser ta semaine.</p>"}];
const statusH=()=>({check:"Vérification de la connexion…",demo:"Mode démonstration : réponses d’exemple, l’IA n’est pas connectée.",live:"Assistante connectée. Les réponses peuvent contenir des erreurs."})[aiMode];
function aiV(){return `<div class="top"><div class="logo">NOVA<b>✦</b></div></div><div class="row" style="margin-bottom:10px"><div class="av">${ic("spark")}</div><div><h1 style="font-size:24px">NOVA AI</h1><div class="s" id="aist">${statusH()}</div></div></div>
<div class="chat"><div id="msgs">${chat.map(msgH).join("")}</div><div class="chips">${["Organise ma semaine","Prépare-moi pour le DS de maths","Que faire en priorité ?","Crée un rappel"].map(x=>`<button onclick="ask('${x}')">${x}</button>`).join("")}</div>
<form class="cin" onsubmit="ask(q.value);return false"><input name="q" id="q" maxlength="600" autocomplete="off" placeholder="Pose une question à NOVA" aria-label="Message"><button class="btn" id="sd" style="padding:10px 14px" aria-label="Envoyer">${ic("send")}</button></form></div>`}
function render(){Store.save({v:2,tasks,rems,sessions});nav();document.getElementById("main").innerHTML={home,plan,tasks:tasksV,rem:remV,ai:aiV}[S.v]();const m=document.getElementById("msgs");if(m)m.scrollTop=m.scrollHeight}
/* ===== NOVA AI : client du backend /chat (mode démonstration si l’IA n’est pas connectée) ===== */
let aiMode="check",busy=false,lastQ="";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ERRS={offline:"Tu es hors ligne. NOVA AI a besoin d’une connexion.",network:"Impossible de joindre NOVA AI. Vérifie ta connexion.",timeout:"NOVA AI met trop de temps à répondre.",rate_limited:"Tu envoies beaucoup de messages. Patiente un instant.",daily_limit:"Limite quotidienne atteinte. Reviens demain.",upstream_busy:"Le service d’IA est très sollicité.",bad_request:"Ce message n’a pas pu être traité.",too_large:"Ce message est trop long.",empty_response:"NOVA AI n’a pas pu répondre."};
const ERR=e=>(ERRS[e.code]||"NOVA AI est indisponible pour le moment. Réessaie plus tard.")+(e.retryAfter&&e.retryAfter<3600?` Réessaie dans ${e.retryAfter} s.`:"");
const TITLES={create_task:"Créer une tâche",create_reminder:"Créer un rappel",plan_week:"Organiser la semaine",update_plan:"Modifier le planning"};
const dl=d=>dd(d,{weekday:"long",day:"numeric",month:"long"});
const ovl=(d,s,e)=>{const v=evFor(d).find(v=>v.s<e&&s<v.e);return v?`<div class="w">Chevauche : ${esc(v.t)} (${v.s} – ${v.e})</div>`:""};
const actLabel=a=>a.type==="create_task"||a.type==="create_reminder"?TITLES[a.type].toLowerCase()+" « "+a.title+" »":a.type==="plan_week"?"organiser "+a.sessions.length+" séances":"modifier "+a.changes.length+" séance(s)";
function actBody(a){
 if(a.type==="create_task")return `<div class="s">${esc(a.title)}<br>${a.subj}, pour le ${dl(a.due)}, priorité ${a.prio}, ${hm(a.dur)}</div>`;
 if(a.type==="create_reminder")return `<div class="s">${esc(a.title)}<br>${rl(a)}</div>`;
 if(a.type==="plan_week")return (a.summary?`<div class="s">${esc(a.summary)}</div>`:"")+"<ul>"+a.sessions.map(s=>`<li class="s">${dd(s.date,{weekday:"short",day:"numeric",month:"short"})}, ${s.start} – ${s.end} : ${esc(s.title)}${ovl(s.date,s.start,s.end)}</li>`).join("")+"</ul>";
 return "<ul>"+a.changes.map(c=>{const s=sessions.find(x=>x.id===c.id);if(!s)return `<li class="s">Séance introuvable (ignorée)</li>`;
  return `<li class="s">${c.remove?"Supprimer":"Modifier"} « ${esc(s.title)} »${c.remove?"":" : "+[c.date&&dl(c.date),c.start,c.end&&"jusqu’à "+c.end,c.title&&esc(c.title)].filter(Boolean).join(", ")}</li>`}).join("")+"</ul>"}
const actH=(x,i,j)=>`<div class="act"><div class="t">${TITLES[x.a.type]}</div>${actBody(x.a)}${x.st==="pending"?`<div class="row"><button class="btn sm" onclick="actOk(${i},${j})">Confirmer</button><button class="btn o sm" onclick="actNo(${i},${j})">Ignorer</button></div>`:`<div class="st">${x.st==="done"?"Appliquée "+esc(x.note||""):"Ignorée"}</div>`}</div>`;
const msgH=(m,i)=>`<div class="m ${m.r}${m.err?" err":""}">${m.h}${(m.acts||[]).map((x,j)=>actH(x,i,j)).join("")}${m.retry?'<div style="margin-top:8px"><button class="btn o sm" onclick="retry()">Réessayer</button></div>':""}</div>`;
function applyAct(a){ // seule fonction qui modifie les données à la demande de l’IA, appelée uniquement après confirmation
 if(a.type==="create_task"){tasks.push({id:nid++,subj:a.subj,title:a.title,due:a.due,prio:a.prio,dur:a.dur,done:false});return ""}
 if(a.type==="create_reminder"){rems.unshift({id:nid++,title:a.title,time:a.time,kind:a.kind,date:a.date,days:a.days,on:true});return ""}
 if(a.type==="plan_week"){a.sessions.forEach(s=>sessions.push({id:nid++,date:s.date,s:s.start,e:s.end,title:s.title,subj:s.subj}));return ""}
 let n=0,skip=0;a.changes.forEach(c=>{const k=sessions.findIndex(s=>s.id===c.id);if(k<0){skip++;return}
  if(c.remove){sessions.splice(k,1);n++;return}
  const ns={...sessions[k],...(c.date&&{date:c.date}),...(c.start&&{s:c.start}),...(c.end&&{e:c.end}),...(c.title&&{title:c.title})};
  if(ns.s>=ns.e){skip++;return}sessions[k]=ns;n++});
 return skip?`(${n} modifiée${n>1?"s":""}, ${skip} ignorée${skip>1?"s":""})`:""}
function actOk(i,j){const x=chat[i]&&chat[i].acts&&chat[i].acts[j];if(!x||x.st!=="pending")return;x.note=applyAct(x.a);x.st="done";toast("Modification appliquée");render()}
function actNo(i,j){const x=chat[i]&&chat[i].acts&&chat[i].acts[j];if(!x||x.st!=="pending")return;x.st="skipped";paint(false)}
function fmt(t){let o="",u=false;for(const l of String(t).split("\n")){const b=/^\s*[-•]\s+(.*)/.exec(l);if(b){if(!u){o+="<ul>";u=true}o+="<li>"+esc(b[1])+"</li>"}else{if(u){o+="</ul>";u=false}if(l.trim())o+="<p>"+esc(l.trim())+"</p>"}}return o+(u?"</ul>":"")}
const demoActs=q=>{q=q.toLowerCase();const a=[];
 if(/rappel/.test(q))a.push({type:"create_reminder",title:"Relire les cours de la journée",time:"18:00",kind:"rec",days:[0,1,2,3,4]});
 else if(/semaine|organis|planning/.test(q))a.push({type:"plan_week",summary:"Exemple de séances légères, sans toucher aux cours.",sessions:[[0,"18:45","19:30","Fiche 7 de maths","Mathématiques"],[1,"16:00","17:30","Plan de dissertation","Français"],[2,"16:30","17:30","Compte rendu de TP","Physique-chimie"]].map(x=>({date:iso(ad(mon,x[0])),start:x[1],end:x[2],title:x[3],subj:x[4]}))});
 return a.map(x=>NovaActions.cleanAction(x,iso(T0))).filter(Boolean).map(a=>({a,st:"pending"}))};
const hist=()=>chat.filter(m=>!m.err&&m.t).slice(-CONFIG.HISTORY).map(m=>({role:m.r==="u"?"user":"assistant",content:m.t+((m.acts||[]).length?"\n[Actions proposées : "+m.acts.map(x=>actLabel(x.a)+" ("+{pending:"en attente",done:"confirmée",skipped:"ignorée"}[x.st]+")").join(" ; ")+"]":"")}));
const AI={
 async check(){const c=new AbortController(),t=setTimeout(()=>c.abort(),4000);
  try{const r=await fetch(CONFIG.API_URL,{cache:"no-store",signal:c.signal});const j=await r.json();aiMode=j&&j.ok&&j.configured?"live":"demo"}catch(e){aiMode="demo"}finally{clearTimeout(t)}paint(false)},
 ctx(){const t0=iso(T0);return{today:t0,weekday:DL[dow],weekStart:iso(mon),profile:CONFIG.PROFILE,
  tasks:tasks.slice(0,40).map(t=>({id:t.id,subj:t.subj,title:t.title,due:t.due,prio:t.prio,dur:t.dur,done:t.done})),
  reminders:rems.slice(0,30).map(r=>({id:r.id,title:r.title,time:r.time,kind:r.kind,date:r.date,days:r.days,on:r.on})),
  sessions:sessions.filter(s=>s.date>=t0).slice(0,40).map(s=>({id:s.id,date:s.date,start:s.s,end:s.e,title:s.title,subj:s.subj})),
  timetable:E.map(e=>({day:e.d,start:e.s,end:e.e,title:e.t,type:e.k})),
  exams:EX.map(x=>({title:x[0],subj:x[1],date:iso(x[2])}))}},
 async ask(msgs){
  if(aiMode!=="live"){await wait(700);const q=msgs[msgs.length-1].content,h=reply(q);return{text:h.replace(/<[^>]+>/g," "),h,acts:demoActs(q)}}
  if(!navigator.onLine)throw{code:"offline"};
  const c=new AbortController(),t=setTimeout(()=>c.abort(),CONFIG.TIMEOUT_MS);
  try{const r=await fetch(CONFIG.API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:msgs,context:AI.ctx()}),signal:c.signal});
   let j=null;try{j=await r.json()}catch(e){}
   if(!r.ok||!j||!j.ok)throw{code:(j&&j.code)||"upstream_error",retryAfter:j&&j.retryAfter};
   return{text:j.text,h:fmt(j.text),acts:NovaActions.cleanMany(j.actions,iso(T0)).map(a=>({a,st:"pending"}))}}
  catch(e){if(e&&e.name==="AbortError")throw{code:"timeout"};if(e instanceof TypeError)throw{code:"network"};throw e}
  finally{clearTimeout(t)}}};
function paint(w){const m=document.getElementById("msgs");if(!m)return;m.innerHTML=chat.map(msgH).join("")+(w?'<div class="m n" aria-live="polite">NOVA écrit…</div>':"");m.scrollTop=m.scrollHeight;
 const s=document.getElementById("aist");if(s)s.innerHTML=statusH();const b=document.getElementById("sd");if(b)b.disabled=!!w}
async function ask(q,again){q=(q||"").trim();if(!q||busy)return;
 if(!again){chat.push({r:"u",h:esc(q),t:q});const i=document.getElementById("q");if(i)i.value=""}
 busy=true;lastQ=q;chat=chat.filter(m=>!m.err);paint(true);let m;
 try{const a=await AI.ask(hist());m={r:"n",t:a.text,h:a.h,acts:a.acts}}
 catch(e){if(e.code==="not_configured"){aiMode="demo";busy=false;return ask(q,true)}
  m={r:"n",err:1,retry:!["bad_request","too_large"].includes(e.code),h:"<p>"+esc(ERR(e))+"</p>"}}
 busy=false;chat.push(m);paint(false)}
const retry=()=>ask(lastQ,true);

/* ===== Installation (PWA) ===== */
let dip=null,hideInst=false;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();dip=e;if(S.v==="home")render()});
addEventListener("appinstalled",()=>{dip=null;render()});
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function inst(){if(hideInst||standalone())return "";
 const m=dip?"Installe NOVA sur cet appareil pour l’ouvrir comme une application.":isIOS()?"Pour installer NOVA : touche Partager dans Safari, puis « Sur l’écran d’accueil ».":"";
 if(!m)return "";
 return `<div class="card inst"><div class="s" style="color:var(--ink);flex:1">${m}</div><div class="row">${dip?'<button class="btn" onclick="doInst()">Installer</button>':""}<button class="btn o" onclick="hideInst=true;render()">Plus tard</button></div></div>`}
async function doInst(){if(!dip)return;dip.prompt();await dip.userChoice;dip=null;render()}
if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
AI.check();
render();
