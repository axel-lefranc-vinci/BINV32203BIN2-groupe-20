# Bilan de la semaine 5

## Scénarios

Les deux scénarios sont décrits dans
[e2e/recherche-offres/scenarios.md](../e2e/recherche-offres/scenarios.md).

Le choix du **scénario 1** comme cas nominal vérifie la règle courante la plus complète :
recherche insensible à la casse, suppression des espaces externes, combinaison avec la période
P2 et respect de la visibilité étudiante. Il devait afficher une seule offre publiée,
« Application React de gestion de flotte ».

Le **scénario 2** est un cas particulier essentiel : une expression sans correspondance doit
produire une liste vide et le message « Aucune offre ne correspond à votre recherche. » plutôt
qu'un état vide générique ou des offres visibles non filtrées. Ces deux cas couvrent chacun
un résultat positif et un résultat négatif observable depuis l'interface.

## Test interactif avec Playwright MCP

Le **scénario 1** a été exécuté avec les outils Playwright MCP.

Actions observées :

- `browser_navigate` a ouvert `http://localhost:5173/`, puis l'outil a renvoyé la page
  « Gesta » et ses éléments accessibles.
- `browser_snapshot` a montré la page de connexion avec l'étudiant Lucas Dupont, puis, après
  sélection de cet utilisateur, la navigation « Offres ».
- `browser_click` a sélectionné Lucas Dupont puis ouvert la page « Offres de stage ».
- `browser_type` a saisi `  aPpLiCAtIoN  ` dans le champ Recherche.
- `browser_select_option` a sélectionné la période P2.

Le dernier instantané affichait exactement **1 offre** :
« Application React de gestion de flotte », Lumen Digital, 2026-2027, P2 et Publiée.
Ce résultat correspond au scénario attendu. Les autres offres n'étaient plus visibles.

## Tests automatisés Playwright Test

Playwright Test est installé dans le projet via `@playwright/test`. Le navigateur Chromium
a été installé avec `npx playwright install chromium`.

- [playwright.config.ts](../playwright.config.ts) définit `testDir: "./e2e"`, l'URL
  `http://localhost:5173`, un projet Chromium et le démarrage automatique de l'application
  avec `npm run dev`.
- [e2e/recherche-offres/recherche-offres.spec.ts](../e2e/recherche-offres/recherche-offres.spec.ts)
  contient les tests des deux scénarios.
- Le package expose aussi la commande `npm run test:e2e`.

Le test du scénario 1 vérifie explicitement l'état initial de quatre offres, la casse et les
espaces de la saisie, le filtre P2, le compteur « 1 offre », les informations de la ligne
attendue et l'exclusion des autres offres. Le test du scénario 2 vérifie le message exact
de recherche sans résultat, l'absence de tableau et l'absence du message générique
« Aucune offre à afficher. ».

Exécutions :

- Première exécution : **2 tests réussis**.
- Exécution avec `--repeat-each=2` : **4 exécutions réussies**, soit deux passages verts
  pour chacun des deux tests.
- `npm run check` : réussi, avec 124 tests backend, 49 tests frontend, lint, typecheck et
  les deux builds réussis.

## Vérification de la capacité à détecter un défaut

Pour contrôler la qualité du test du scénario 1, le filtre SQL de recherche a été
temporairement désactivé dans `backend/src/repositories/offers.repository.ts`. Avec cette
mutation, Playwright a échoué sur l'attente exacte de « 1 offre » : les offres P2 n'étaient
plus filtrées comme prévu.

La clause SQL initiale a ensuite été restaurée exactement. Le même test du scénario 1
a réussi à nouveau. Cette vérification confirme que l'échec venait du défaut temporaire
de l'application et non d'une erreur de configuration ou de connexion. Le défaut n'est
pas conservé dans le dépôt.

## Comparaison des approches

1. **Que permet Playwright MCP ?** Il permet à un agent de piloter le navigateur pendant
   une conversation : navigation, clic, saisie, sélection, instantané d'accessibilité et
   observation du résultat. Exemple précis observé : `browser_type` a saisi la recherche
   mal orthographiée en casse dans le champ Recherche, puis `browser_snapshot` a montré
   l'offre restante.

2. **Qu'apportent les scripts Playwright Test ?** Ils conservent des actions et des assertions
   déterministes, réexécutables sans agent ni interprétation probabiliste. Ils peuvent être
   lancés deux fois successivement, intégrés à la CI/CD et maintenus avec le dépôt.

3. **Quand choisir MCP ?** Pour une exploration interactive, une investigation visuelle, une
   reproduction ponctuelle ou une vérification pilotée par un agent. **Quand choisir
   Playwright Test ?** Pour les régressions répétées, la CI/CD et toute preuve automatisée
   durable.

Les deux approches sont complémentaires : MCP aide à explorer; Playwright Test fournit les
vérifications exécutables.

## Conversations exportées

- [Conversation Playwright de la semaine 5](semaine-5/conversation.md)
