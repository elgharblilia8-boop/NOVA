# NOVA, PWA d’organisation scolaire avec assistante IA

Interface en français, installable sur iPhone et ordinateur. NOVA AI fonctionne en **mode démonstration** tant qu’aucune clé n’est configurée sur le serveur. Une fois la clé ajoutée, la même interface bascule automatiquement en **mode connecté**.

## Structure

```
nova/
├── public/                 site statique publié (ce que voient les visiteurs)
│   ├── index.html  style.css  script.js  manifest.json  service-worker.js  assets/
│   └── actions.js          validation des actions de l’IA (partagée navigateur + serveur)
├── netlify/
│   ├── functions/chat.js   endpoint POST /chat (reçoit la question, appelle l’IA, renvoie texte + actions)
│   └── lib/
│       ├── prompt.js       identité et règles de NOVA AI
│       ├── provider.js     adaptateur du fournisseur d’IA + définition des outils (actions)
│       └── limits.js       limitation d’usage par IP
├── test/chat.test.mjs      tests du backend (npm test)
├── netlify.toml  package.json  .env.example  .gitignore
```

Seul le dossier `public/` est publié. Le code serveur, le README et les tests ne sont pas accessibles depuis le site.

## Comment ça marche

1. L’élève écrit à NOVA AI. `script.js` appelle `AI.ask()`, qui envoie à `/chat` les derniers messages et un **contexte** : date du jour, emploi du temps fixe, tâches, rappels, séances de travail et examens.
2. `chat.js` nettoie et tronque tout ce qu’il reçoit, construit le prompt système (`prompt.js`) et appelle le fournisseur (`provider.js`) avec la clé lue dans `process.env`.
3. Le modèle répond par du texte et, si utile, par des **actions structurées** : `create_task`, `create_reminder`, `plan_week`, `update_plan`.
4. Le serveur **valide** ces actions (`actions.js`), puis le navigateur les valide **une seconde fois** avant de les afficher.
5. Chaque action apparaît dans une carte avec « Confirmer » et « Ignorer ». **Rien n’est modifié sans confirmation.** Les chevauchements avec les cours sont signalés sur la carte.

`update_plan` ne peut modifier que les séances créées via NOVA AI (par identifiant). Les cours fixes du planner restent en lecture seule.

## Déploiement sur Netlify

Les fonctions Netlify ne sont **pas** déployées par « Netlify Drop » : il faut un déploiement depuis Git (ou la CLI).

1. Crée un dépôt GitHub avec le contenu de ce dossier. Le fichier `.gitignore` empêche d’y envoyer `.env`.
2. Sur Netlify : *Add new site*, *Import an existing project*, choisis le dépôt. Les réglages viennent de `netlify.toml` (publication de `public/`, fonctions dans `netlify/functions`).
3. Crée une clé API chez le fournisseur (par défaut Anthropic, console.anthropic.com). **Définis une limite de dépense mensuelle** dans sa console.
4. Dans Netlify : *Site configuration*, *Environment variables*, ajoute `ANTHROPIC_API_KEY` avec ta clé (marque-la comme secrète si l’option est proposée), puis relance un déploiement.
5. Ouvre le site, puis NOVA AI : le texte sous le titre passe de « Mode démonstration » à « Assistante connectée ».

Variables disponibles (voir `.env.example`) :

| Variable | Rôle | Défaut |
|---|---|---|
| `ANTHROPIC_API_KEY` | clé du fournisseur (obligatoire pour le mode connecté) | aucune |
| `NOVA_MODEL` | modèle utilisé : vérifie le nom exact dans la console du fournisseur | `claude-sonnet-5-5` |
| `ALLOWED_ORIGIN` | seulement si le site est hébergé sur un autre domaine que `/chat` | aucune |
| `NOVA_RATE_PER_MIN` / `NOVA_RATE_PER_DAY` | messages autorisés par IP | 8 / 80 |
| `NOVA_TIMEOUT_MS` | délai maximal d’attente du fournisseur | 22000 |

## Développement local

```
npm install -g netlify-cli
cp .env.example .env      # puis colle ta clé dans .env (jamais dans le dépôt)
netlify dev               # site + fonction sur http://localhost:8888
npm test                  # tests du backend
```
Sans Netlify, `cd public && python3 -m http.server 8000` lance le site en mode démonstration.

## Sécurité

- La clé n’existe que dans `process.env` côté serveur. Elle n’est ni dans le HTML, ni dans le JavaScript, ni dans le dépôt, ni dans les réponses (un test le vérifie).
- `/chat` refuse les requêtes venant d’un autre site (contrôle de l’en-tête `Origin`), limite la taille des requêtes, borne chaque champ du contexte et limite l’usage par IP.
- Le contenu des tâches est traité comme des données, pas comme des instructions. Et comme tout changement exige une confirmation, une consigne cachée dans un titre ne peut rien modifier seule.

## Erreurs et limites gérées

Hors ligne, serveur injoignable, délai dépassé, trop de messages (minute ou jour), service d’IA saturé ou indisponible, réponse vide, message trop long. L’élève voit un message en français et un bouton « Réessayer » quand c’est pertinent. Si le serveur répond que l’IA n’est pas configurée, l’application repasse en mode démonstration.

## Limites actuelles, à connaître

- Le limiteur est **en mémoire** : approximatif et propre à chaque instance. Pour une limite stricte, ajoute un limiteur de la plateforme (consulte la documentation Netlify sur le rate limiting) ou une base partagée.
- Il n’y a **pas de comptes** : la limite est par adresse IP, et les données restent dans le navigateur de chaque appareil (aucune synchronisation).
- Le contenu des tâches et rappels est **envoyé au fournisseur d’IA** pour chaque question. Les utilisateurs étant des lycéens, dont des mineurs, prévois avant tout test réel une information claire, une politique de confidentialité et, selon l’âge, l’accord des parents (RGPD).
- Le backend a été testé avec un fournisseur **simulé** (7 tests) et le frontend avec un simulateur de navigateur. Il n’a **jamais été testé avec une vraie clé ni sur un vrai déploiement Netlify** : fais un premier essai toi-même.
- Les rappels ne déclenchent pas encore de notification.
- Si tu modifies un fichier de `public/`, augmente `VERSION` dans `service-worker.js` pour que les appareils se mettent à jour.

## Changer de fournisseur d’IA

Réécris uniquement `callModel()` dans `netlify/lib/provider.js` pour qu’il renvoie `{ text, actions }`. Le reste (validation, confirmation, interface) ne change pas.
