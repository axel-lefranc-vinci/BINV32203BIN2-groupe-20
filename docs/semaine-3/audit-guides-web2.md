# Audit des consignes de l’agent par rapport à Web 2

Date de l’audit : 10 novembre 2026

## Périmètre et sources

Le dépôt ne contient pas de `AGENTS.md`. Le guide directement applicable à l’agent
est [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md).
Il est complété par [`../README.md`](../README.md), [`architecture.md`](architecture.md)
et [`../backend/API.md`](../backend/API.md). Le guide Copilot est lu dans son
intégralité ; il contient deux sections largement redondantes, de la ligne 1 à 94
et de la ligne 96 à 136.

Les sources Web 2 utilisées sont les supports officiels :

- [Supports Web 2 — JavaScript avancé](https://e-vinci.github.io/BINV2150A-slides/)
- [HTTP, REST et documentation d’API](https://raw.githubusercontent.com/e-vinci/BINV2150A-slides/main/seance-02/slides.md)
- [Authentification par JWT](https://raw.githubusercontent.com/e-vinci/BINV2150A-slides/main/seance-03/slides.md)
- [Hachage et sécurité](https://raw.githubusercontent.com/e-vinci/BINV2150A-slides/main/seance-04/slides.md)
- [React, état, formulaires et routage](https://raw.githubusercontent.com/e-vinci/BINV2150A-slides/main/seance-07/slides.md)

## Comparaison

| Attente ou convention de Web 2 (source) | Guide examiné (fichier et passage) | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| Séparer contrôleurs, services et repositories ; garder SQL dans la couche d’accès aux données (supports sur l’architecture d’API et la structure de projet) | `.github/copilot-instructions.md:36-61`, `:110-119` ; `docs/architecture.md:15-39` | **Oui** | La séparation est précise. Conserver cette règle et ajouter, si nécessaire, un exemple de flux complet pour les nouvelles fonctionnalités. |
| Utiliser les verbes, chemins, corps JSON et codes HTTP REST (support sur HTTP et conventions REST) | `.github/copilot-instructions.md:36-61`, `:79-81`, `:126-127` ; `backend/API.md` | **Oui** | Le guide impose les erreurs standardisées et la documentation API. Il pourrait préciser systématiquement `Content-Type: application/json` et le code attendu pour chaque nouveau endpoint. |
| Documenter les endpoints, paramètres, réponses et erreurs (support sur la documentation d’API) | `.github/copilot-instructions.md:79-80` ; `backend/API.md` | **Oui, mais dispersée** | Faire de la mise à jour de `backend/API.md` une obligation explicite à chaque changement d’endpoint ; éventuellement ajouter des exemples REST Client. |
| Distinguer authentification et autorisation, vérifier le JWT côté serveur et renvoyer 401/403 (supports sur JWT et autorisation) | `.github/copilot-instructions.md:73-76`, `:116`, `:127-130` ; `docs/architecture.md:53-65` | **Oui** | La règle est même plus robuste que l’exemple du support : les rôles et entreprises sont relus en base. |
| Ne jamais stocker de secret ou de clé dans Git ; garder les secrets dans l’environnement (support sur la clé secrète) | `.github/copilot-instructions.md:90-93`, `:130` ; `README.md` (configuration `.env`) | **Partielle** | Le guide interdit le mode démo en production, mais devrait dire explicitement : ne jamais committer JWT secrets, mots de passe, tokens ou fichiers `.env`, et vérifier `.gitignore`. |
| Ne jamais stocker les mots de passe en clair ; utiliser un hachage salé et asynchrone (support sur le hachage et `bcrypt`) | `.github/copilot-instructions.md` (aucun passage dédié) | **Non vérifiable / absente** | Ajouter une consigne si le projet gère de vrais mots de passe. Pour le mode démo actuel, préciser qu’il ne constitue pas une authentification de production et qu’aucun mot de passe réel ne doit être ajouté aux seeds. |
| Utiliser React de façon déclarative, avec des composants réutilisables et des props typées (supports sur React et les composants) | `.github/copilot-instructions.md:49-61`, `:117`, `:126` ; `docs/architecture.md:76-94` | **Oui** | La structure `pages → hooks → services/utils → models` et les composants réutilisables sont clairement imposés. |
| Utiliser `useState`, des mises à jour immuables, des valeurs dérivées et le « lifting state up » (supports sur l’état React) | `.github/copilot-instructions.md:49-61`, `:117` ; `docs/architecture.md:76-94` | **Partielle** | Le guide décrit où placer les hooks, mais pas les règles de mise à jour fonctionnelle, d’état dérivé, de `key` pour les collections ni d’état partagé dans le parent commun. Les ajouter éviterait des implémentations React incohérentes. |
| Gérer les formulaires avec `onSubmit`, `preventDefault`, validation HTML et conversion explicite des chaînes (support sur événements et formulaires) | `.github/copilot-instructions.md:84-86`, `:132` | **Partielle** | Le guide couvre les appels API et les guards, mais pas la validation des champs, les messages d’erreur, les champs contrôlés ni la conversion de `input[type=number]`. Ajouter ces exigences côté frontend et côté contrôleur. |
| Échapper les contenus affichés et éviter les XSS (support sur JSX et sécurité) | `.github/copilot-instructions.md:79-81`, `:127` | **Partielle** | La séparation API/DTO et la validation JSON aident, mais aucune consigne n’interdit explicitement `dangerouslySetInnerHTML` ou l’injection de HTML non contrôlé. Ajouter cette règle. |
| Prévoir l’accessibilité des contrôles, notamment un nom accessible pour les boutons sans texte (support sur l’accessibilité des contrôles React) | `.github/copilot-instructions.md` (aucun passage dédié) | **Non** | Ajouter une vérification minimale : labels associés aux champs, nom accessible des boutons/icônes, navigation clavier, messages d’erreur associés et tableaux utilisables par lecteur d’écran. |
| Associer les URLs aux pages, gérer les liens SPA, les routes inconnues et le rechargement (support sur le routage côté client) | `.github/copilot-instructions.md:49-61`, `:117-119` ; `docs/architecture.md:76-94` | **Partielle** | L’architecture parle de pages et de routes, mais ne fixe pas de convention pour `react-router`, `NotFoundPage`, les liens internes ou le fallback `index.html` en production. |
| Tester les comportements backend et frontend, et valider avant livraison (supports sur les tests et commandes du projet) | `.github/copilot-instructions.md:3-34`, `:87-94`, `:100-106`, `:133` | **Oui** | Les commandes `lint`, `typecheck`, `test`, `build` et `check` sont explicites, avec des tests proches de la couche concernée. |

## Conclusion et recommandations

Le guide est globalement cohérent avec Web 2 sur l’architecture, TypeScript,
REST, la documentation d’API, l’authentification/autorisation, React et les tests.
Aucune contradiction directe avec les supports consultés n’a été trouvée.

Les compléments prioritaires sont :

1. préciser la sécurité des secrets et, si nécessaire, le hachage des mots de passe ;
2. imposer une validation explicite et cohérente des entrées côté frontend **et**
   backend ;
3. ajouter les attentes d’accessibilité et de prévention XSS ;
4. documenter les conventions React d’état, de formulaires et de routage ;
5. fusionner les deux sections redondantes du guide pour éviter des règles divergentes.

Ces recommandations sont un résultat d’audit ; le guide n’a pas été modifié.
