# Tasfflow / manage-taskFlow

Application mobile et web de **gestion de tâches** : créer, modifier, marquer comme faites, supprimer des tâches, avec **date limite** et **couleur** par tâche, et **suppression groupée** après sélection.

## Objectif

Aider à organiser le travail au quotidien en synchronisant les données avec une **API REST** (stockage côté serveur, ex. Firestore via le backend documenté dans `FRONTEND_API.md`).

## Pile technique

| Élément | Détail |
|--------|--------|
| Framework | [Expo](https://expo.dev/) ~54, [React Native](https://reactnative.dev/) 0.81 |
| UI | React 19, navigation par onglets avec **expo-router** |
| État | **Zustand** (`stores/taskStore`) |
| HTTP | **Axios** / `fetch` vers l’API des tâches |
| Web | Export possible (`npm run build:web`) |

Configuration app : `app.config.js` (nom affiché **manage-taskFlow**, schéma `myapp`, routes typées).

## Fonctionnalités principales

- **Liste des tâches** : chargement au démarrage, état vide, gestion des erreurs avec possibilité de réessayer.
- **Création / édition** : titre, date limite (sélecteur de date), couleur parmi des préréglages.
- **Complétion** : bascule terminé / non terminé.
- **Suppression** : une tâche ou **plusieurs** via mode sélection et endpoint bulk-delete.
- **Paramètres** : affichage des variables d’environnement utiles (nom app, version, environnement, URL API) et court texte « About ».

L’interface des tâches est en grande partie en français (dates formatées `fr-FR`, libellés UI).

## API backend

Le client consomme une API documentée dans **`FRONTEND_API.md`** :

- `GET /tasks` — liste paginée (`limit`, `offset`)
- `POST /tasks` — création
- `PATCH /tasks/:id` — mise à jour partielle
- `DELETE /tasks/:id` — suppression
- `POST /tasks/bulk-delete` — suppression groupée (`ids`)

La base URL est typiquement configurée via **`EXPO_PUBLIC_API_URL`** (voir écran Settings).

## Lancer le projet

- Développement : `npm run dev` (Expo)
- Lint : `npm run lint`
- Tests : `npm run test` / `npm run test:ci`
- Build web statique : `npm run build:web`

---

Répertoire du dépôt : `tasfflow-app` ; nom npm du package : `manage-taskflow`.
