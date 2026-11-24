# Bilan de la semaine 4

## Audit des tests

Audit limité à la recherche des offres par titre et à ses chemins directement liés.

| Constat vérifié | Preuve dans les tests | Résultat |
|---|---|---|
| Recherche insensible à la casse et espaces externes ignorés | `backend/tests/offers.test.ts:156`, avec `PORTAIL CLIENT` entouré d'espaces | Test API présent et réussi |
| Expression entière recherchée dans le titre | `backend/tests/offers.test.ts:156`, résultat limité à `OFFER.CLIENT_PORTAL` | Test API présent et réussi |
| Combinaison recherche/période et visibilité étudiant | `backend/tests/offers.test.ts:165` | Test API présent et réussi |
| Recherche vide | `backend/tests/offers.test.ts:176` | Test API présent et réussi |
| Absence de correspondance | `backend/tests/offers.test.ts:188` | Liste vide vérifiée |
| Transmission frontend de la recherche et de la période | `frontend/tests/OffersPage.test.tsx:26` | URL et en-tête vérifiés |
| Message frontend sans résultat | `frontend/tests/OffersPage.test.tsx:49` | Message adapté vérifié |

Le test ajouté ou amélioré est le lot de quatre tests API dans
`backend/tests/offers.test.ts` et de deux tests frontend dans
`frontend/tests/OffersPage.test.tsx`. La correction du rôle attendu de l'input (`searchbox`
au lieu de `textbox`) a été faite dans le test, car elle correspond au comportement
d'accessibilité réel de `input type="search"`.

Le script automatique `coverage_map.py` a été tenté, mais l'exécution de Python a été
bloquée par la sandbox. La vérification a donc été réalisée manuellement sur le périmètre
de la recherche, conformément aux tests et aux chemins applicatifs concernés.

## TDD

Les tests ont été écrits avant l'implémentation et exécutés en RED :

- backend : 22 tests, dont 3 échecs fonctionnels parce que le paramètre `search` était
  ignoré ;
- frontend : 7 tests, dont 2 échecs fonctionnels parce que le champ de recherche et le
  message sans résultat n'existaient pas encore.

Les échecs n'étaient dus ni à une installation manquante ni à une erreur de syntaxe.
Après relecture, les tests correspondaient aux règles demandées : casse, espaces,
expression entière, recherche vide, période, visibilité et absence de résultat.
L'implémentation a donc été autorisée après cette vérification. Les tests sont ensuite
passés au vert.

## Recherche

Les cas essayés sont :

- `PORTAIL CLIENT` avec espaces avant et après ;
- recherche combinée avec `period=P2` ;
- recherche vide composée d'espaces ;
- expression sans correspondance ;
- recherche frontend avec transmission de la période ;
- affichage du message « Aucune offre ne correspond à votre recherche. ».

Résultats de validation :

- tests backend : 124 réussis ;
- tests frontend : 49 réussis ;
- `npm run check` : réussi entièrement (lint, typecheck, tests et builds) ;
- diagnostics sur les fichiers modifiés : aucune erreur.

Le parcours navigateur a été tenté après démarrage des serveurs. Les serveurs répondaient
correctement (`/health` backend et frontend en HTTP 200), mais l'outil navigateur a été
bloqué par la politique réseau de la sandbox pour `localhost` et `127.0.0.1`.

Il ne reste pas de problème fonctionnel identifié dans le périmètre. La vérification
visuelle navigateur reste la seule vérification non réalisable dans cet environnement.
