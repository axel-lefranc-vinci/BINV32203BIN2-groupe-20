# Conversation exportée de la semaine 5

## Exécution interactive Playwright MCP

L'utilisateur a demandé d'utiliser Playwright MCP pour le scénario 1, sans modifier
l'application ni générer de script de test.

Le serveur MCP a été lancé sur `http://localhost:8931/mcp` et l'application sur
`http://localhost:5173`.

Appels observés :

- `browser_navigate` : ouverture de l'application Gesta.
- `browser_snapshot` : page de connexion, puis navigation et quatre offres visibles.
- `browser_click` : connexion en Lucas Dupont et ouverture de la page Offres.
- `browser_type` : saisie de `  aPpLiCAtIoN  `.
- `browser_select_option` : sélection de P2.
- `browser_snapshot` final : une seule offre visible,
  « Application React de gestion de flotte », Lumen Digital, P2, Publiée.

## Génération Playwright Test

L'utilisateur a demandé des tests classiques TypeScript pour les deux scénarios, sans
MCP. Les fichiers créés sont `playwright.config.ts` et
`e2e/recherche-offres/recherche-offres.spec.ts`.

Les assertions couvrent le compteur, la ligne de résultat et ses données, l'exclusion
des offres non correspondantes, le message exact sans résultat et l'absence du tableau.

Résultats :

- première exécution : 2 tests réussis ;
- répétition avec `--repeat-each=2` : 4 exécutions réussies ;
- `npm run check` : lint, typecheck, 124 tests backend, 49 tests frontend et builds réussis.

## Vérification de la détection de défaut

Une mutation temporaire a désactivé la clause SQL de filtrage du titre. Le test du
scénario 1 a échoué sur l'attente « 1 offre ».

La clause SQL a été restaurée exactement, puis le test a réussi. Aucun défaut temporaire
ni secret n'a été conservé dans les fichiers modifiés.
