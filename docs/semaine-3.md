# Bilan semaine 8 — Harnais agentique : guider et vérifier

> Le sujet demande un fichier `semaine-3.md` dans `docs/`, même si l'activité est
> intitulée « semaine 8 ». Ce nom est donc conservé pour respecter le livrable.

## 1. Inventaire des guides et des senseurs

Le support `Harnais_agentique_deux_boucles.pptx` distingue :

- le **feedforward**, qui guide l'agent avant la modification ;
- le **feedback**, qui observe le résultat après exécution ;
- une boucle automatique de correction ;
- une boucle humaine de validation.

| Catégorie | Mécanisme | Emplacement / outil | Rôle et exemple | Vérification |
|---|---|---|---|---|
| Guide — inférentiel | Instructions Copilot | `.github/copilot-instructions.md` | Impose les couches `controllers -> services -> repositories`, les erreurs `HttpError`, les imports `.ts` et l'exécution de `npm run check`. | Fichier lu en entier ; consignes comparées à l'architecture et aux scripts. |
| Guide — inférentiel | Architecture documentée | `docs/architecture.md` | Décrit le flux HTTP backend et le flux `pages -> hooks -> services/utils -> models` du frontend. | Fichier lu ; organisation vérifiée dans les sources. |
| Guide — computationnel | Scripts npm | `package.json`, `backend/package.json`, `frontend/package.json` | Fournit les commandes `lint`, `typecheck`, `test`, `build` et `check`. | Exécuté avec `npm run check`. |
| Senseur — computationnel | TypeScript | `tsc --noEmit`, `tsc -b` | Détecte les erreurs de types et de compilation. | Exécuté avec succès. |
| Senseur — computationnel | Oxlint | `npm run lint` | Vérifie les règles statiques du backend et du frontend. | Exécuté avec succès dans `npm run check`. |
| Senseur — computationnel | Vitest + Supertest | `backend/tests/` | Vérifie les réponses HTTP, les statuts, les droits et les transitions de candidature. | Exécuté ; tous les tests passent. |
| Senseur — computationnel | Build | `npm run build` | Vérifie que les deux workspaces produisent une version compilable. | Exécuté avec succès dans `npm run check`. |
| Senseur — inférentiel | Revue assistée par IA | Support PPTX / analyse de ce bilan | Peut comparer le diff aux exigences et relever des trous de couverture. | Réalisée pour préparer les matrices ci-dessous ; ce n'est pas un contrôle automatisé du dépôt. |

Les quatre cases de la matrice ne sont pas remplies artificiellement : aucun
générateur de code dédié ni aucune revue IA automatisée dans une CI n'ont été
trouvés dans le dépôt.

## 2. Couverture des exigences EF-32 et EF-33

## 3. Modifications et vérification

### Modifications

- Ajout de scénarios de candidature dans `backend/tests/offers.test.ts`,
  `backend/tests/auth.test.ts` et `backend/tests/companies.test.ts`.
- Ces tests vérifient notamment deux défauts précis : accepter un doublon actif ou accepter un
  `offerId` de type chaîne au lieu d'un entier.
- Les tests existants de candidature ont été relus sans être affaiblis.

### Commande et résultat

Commande exécutée depuis la racine :

```text
npm.cmd run check
```

Résultat attendu et observé pour les quatre contrôles :

- lint backend/frontend : succès ;
- typecheck backend/frontend : succès ;
- tests backend/frontend : succès ;
- build backend/frontend : succès.

Les nouveaux tests ont également été exécutés seuls avant le contrôle complet :
2 tests réussis.

### Limites

- La vérification navigateur reste manuelle ; aucun scénario Playwright/E2E
  n'est enregistré dans le dépôt.
- Le contrôle de `REJECTED` pour la route `GET /applications/mine` pourrait être
  renforcé par un test dédié.
- L'audit des consignes Web 2 s'appuie sur les sources présentes dans ce dépôt
  et sur le support PPTX fourni ; aucune autre note de cours n'était jointe.
- Le dépôt n'est pas un dépôt Git dans l'environnement de travail fourni :
  aucun commit ni push GitHub n'a donc pu être réalisé ici.

## 4. Audit des guides à la lumière de Web 2

| Attente Web 2 vérifiable | Guide examiné | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| Séparer les responsabilités et conserver une architecture lisible | `docs/architecture.md` et `.github/copilot-instructions.md` : couches backend et flux frontend explicitement nommés. | Oui | Maintenir cette règle et ajouter une vérification d'architecture automatisée à terme. |
| Valider les entrées côté serveur | `.github/copilot-instructions.md` demande aux contrôleurs de parser/valider les entrées ; `applications.controller.ts` valide `offerId`, l'identifiant et le statut. | Oui | Ajouter dans le guide une règle indiquant que chaque nouveau endpoint doit avoir au moins un test de rejet d'entrée invalide. |
| Ne pas faire reposer la sécurité sur l'interface | Le guide demande l'authentification, les permissions nommées et la relecture des droits en base ; les tests Supertest vérifient les 403/404. | Oui | Préciser qu'un test d'API doit couvrir toute nouvelle règle de visibilité. |
| Vérifier les comportements par compilation, lint et tests | `.github/copilot-instructions.md` et scripts npm demandent `npm run check`. | Oui | Ajouter le résultat attendu « commande lancée depuis la racine » dans le guide de contribution. |
| Organiser le frontend par responsabilités | Le guide et `docs/architecture.md` indiquent `pages -> hooks -> services/utils -> models`. | Oui | Ajouter une règle explicite : pas d'appel `fetch` directement dans une page. |
| Préserver l'accessibilité de base | Les sources utilisent déjà `label`, `aria-label`, `scope` et des boutons sémantiques. | Partielle | Le guide ne donne pas de checklist accessibilité ; proposer de mentionner labels associés, focus clavier et messages d'erreur lisibles. |
| Ne pas exposer de secrets et limiter le mode démo | Le guide précise que le mode démo est local et interdit en production ; les secrets sont configurés par environnement. | Oui | Ajouter une vérification CI qui refuse le mode démo avec `NODE_ENV=production`. |

Le support PPTX confirme que les guides sont du **feedforward** : ils
réduisent l'ambiguïté avant l'édition. Les commandes et tests sont des
senseurs **computationnels** : ils produisent un résultat observable après
l'édition. La revue de ce document constitue la boucle humaine ; elle ne
remplace pas les contrôles exécutables.

## 5. Senseur d'architecture proposé (optionnel)

### Règle

Les dépendances doivent rester orientées vers l'intérieur :

```text
controllers -> services -> repositories -> db
pages -> hooks -> services/utils -> models
```

Un service ne doit pas importer Express (`Request`, `Response`) et un
repository ne doit pas être importé directement par une page frontend.

### Fonctionnement

Une commande `npm run architecture-check` pourrait :

1. parcourir les imports TypeScript sous `backend/src` et `frontend/src` ;
2. associer chaque fichier à sa couche selon son dossier ;
3. refuser les arêtes interdites ;
4. produire la liste des violations avec fichier source et import fautif.

Le senseur fonctionnerait dans `npm run check` et en CI, après le typecheck ou
avant les tests. Exemple de violation : `backend/src/services/foo.ts`
importe `express`, ou `frontend/src/pages/OffersPage.tsx` importe directement
`backend/src/repositories/offers.repository.ts`.

### Limites et coûts

- Les imports dynamiques et les alias peuvent produire des faux négatifs sans
  analyse AST.
- Une règle par dossier ne comprend pas toujours les dépendances indirectes.
- Il faut maintenir la liste des couches lorsque l'architecture évolue.
- Le coût reste faible pour ce dépôt, mais une analyse AST dédiée ajouterait
  une dépendance et une étape de CI.

## Conclusion

Le harnais actuel est fonctionnel : les guides décrivent l'architecture et les
commandes, tandis que TypeScript, Oxlint, Vitest/Supertest et le build donnent
un feedback exécutable. La principale amélioration immédiate est de rendre
obligatoire un test de rejet pour chaque nouvelle entrée et chaque règle de
visibilité. La couverture EF-32/EF-33 est bonne côté API, avec deux limites
explicitement conservées au lieu d'être présentées comme couvertes.
