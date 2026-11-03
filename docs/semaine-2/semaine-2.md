# Bilan semaine 2 — candidatures étudiantes

## Choix

- J'ai conservé l'architecture existante : backend Express/SQLite avec repository/service/controller, et frontend React/Vite avec services et hooks.
- Le schéma contenait déjà la table `applications` et les quatre statuts nécessaires. Aucune migration n'a donc été ajoutée.
- Une candidature en double est refusée si une candidature du même étudiant et de la même offre existe déjà, sauf si elle est `WITHDRAWN`.
- Après un retrait, la ligne existante est réactivée plutôt que de créer une nouvelle ligne. Ce choix évite les doublons, mais ne conserve pas l'historique de chaque tentative.
- Le bouton de candidature est placé dans la liste des offres, conformément au cahier des charges. Une candidature existante est signalée par un bouton grisé « Candidature déjà postulée ».
- Le retrait est possible depuis « Mes candidatures » et depuis la page des offres, uniquement pour une candidature « En cours ».
- La sélection d'un candidat, la création du stage, le détail complet d'une offre et le filtre automatique obligatoire sur l'année courante sont restés hors périmètre.

## Résultat

La fonctionnalité EF-32/EF-33 fonctionne :

- un étudiant peut candidater à une offre publiée avec ou sans message ;
- il peut consulter ses candidatures et les statuts « En cours », « Retenue », « Non retenue » et « Retirée » ;
- il peut retirer une candidature encore en cours ;
- il peut candidater à nouveau après un retrait ;
- une candidature déjà traitée ne peut pas être retirée ;
- un contact ou un administrateur ne peut pas candidater ;
- une offre non publiée n'accepte pas de candidature ;
- les candidatures sont isolées entre étudiants.

Les principales difficultés ont été la coordination entre l'état local de la liste des offres et la liste des candidatures, ainsi que la vérification des transitions de statut. Le retrait depuis la page des offres a été ajouté après la première validation fonctionnelle.

Limites restantes :

- aucune interface d'administration ne permet encore de passer une candidature à « Retenue » ou « Non retenue » ;
- le choix de réactivation réutilise la même ligne et ne fournit donc pas un historique détaillé des tentatives ;
- la validation navigateur a été réalisée manuellement avec le navigateur intégré, mais aucun scénario Playwright automatisé n'a été ajouté au dépôt ;
- Docker n'était pas exploitable car son daemon ne répondait pas ; les validations ont utilisé SQLite et des bases en mémoire.

## Modifications

### Backend

- `backend/src/models/application.ts` : types des candidatures et statuts ;
- `backend/src/mappers/application.mapper.ts` : conversion base/API ;
- `backend/src/repositories/applications.repository.ts` : lecture, création, réactivation et retrait ;
- `backend/src/services/applications.service.ts` : règles métier et contrôles d'accès ;
- `backend/src/controllers/applications.controller.ts` : routes `GET /applications/mine`, `POST /applications` et `DELETE /applications/:id` ;
- `backend/src/app.ts` : branchement du routeur protégé.

### Frontend

- `frontend/src/models/application.ts`, `services/applications.service.ts`, `hooks/useApplications.ts` et `hooks/useMyApplications.ts` : contrat API et gestion des états ;
- `frontend/src/pages/ApplicationsPage.tsx` : page « Mes candidatures » ;
- `frontend/src/pages/OffersPage.tsx` et `components/OfferTable.tsx` : candidature et retrait depuis la liste des offres ;
- `frontend/src/components/NavBar.tsx` et `App.tsx` : navigation et route étudiant ;
- `frontend/src/utils/guards.ts` et `utils/labels.ts` : validation des réponses et libellés des statuts ;
- `frontend/src/index.css` : styles des formulaires et boutons.

### Validation

- `backend/src/validation/application-happy-path.test.ts`
- `backend/src/validation/application-security.test.ts`
- `backend/src/validation/application-state.test.ts`

Ces tests couvrent les parcours nominaux, les refus serveur, l'isolation des étudiants, le retrait et la réactivation.

## Validation fonctionnelle

Les essais réels ont été effectués avec les utilisateurs de démonstration :

1. Dmytro Kovalenko a candidaté à une offre avec message et à une autre sans message.
2. Après rechargement et navigation vers « Mes candidatures », les deux candidatures étaient présentes avec le statut « En cours » ; le message facultatif était conservé.
3. Une candidature a été retirée avec la confirmation navigateur ; elle est passée à « Retirée » et l'action de retrait a disparu.
4. Mateusz Kowalski possédait une candidature « Retenue » ; aucun bouton de retrait n'était affiché.
5. Lucas Dupont et Mateusz Kowalski ne voyaient pas les candidatures de l'autre.
6. La candidature depuis la page des offres affichait ensuite « Candidature déjà postulée » et un bouton grisé.

Les refus non accessibles directement dans l'interface ont été vérifiés avec l'API :

- un contact promoteur reçoit `403 FORBIDDEN` ;
- une offre `SUBMITTED` reçoit `409 OFFER_NOT_PUBLISHED` ;
- le retrait d'une candidature `SELECTED` reçoit `409 APPLICATION_NOT_WITHDRAWABLE`.

La base de démonstration a été réinitialisée après ces essais. Le serveur backend a ensuite été arrêté pour libérer la base.

## Qualité

- Les contrôles d'autorisation sont réalisés côté serveur, et pas uniquement masqués dans l'interface.
- Les données retournées par l'API sont validées par des type guards côté frontend.
- Les transitions de statut sont contrôlées avant la modification SQL.
- Les messages facultatifs composés uniquement d'espaces sont normalisés en `null`.
- Les règles métier sont regroupées dans le service ; le contrôleur reste limité au parsing HTTP.
- Les composants existants et les conventions de nommage ont été réutilisés.
- Aucun changement de schéma ou code de sélection de candidat hors périmètre n'a été ajouté.

Un problème rencontré pendant la validation était un premier scénario manuel qui utilisait un étudiant ayant déjà une candidature différente de celle testée. Le scénario a été corrigé sans modification du code métier. Une erreur de double appel dans le hook de candidature a également été détectée et supprimée avant la validation finale.

## Tests et commandes

Tests ajoutés :

```text
backend/src/validation/application-happy-path.test.ts
backend/src/validation/application-security.test.ts
backend/src/validation/application-state.test.ts
```

Commandes exécutées avec succès :

```text
backend: npm.cmd test -- --run src/validation       # 3 fichiers, 5 tests réussis
backend: npm.cmd run typecheck                      # succès
backend: npm.cmd run lint                           # succès
backend: npm.cmd run build                          # succès
frontend: npm.cmd run typecheck                     # succès
frontend: npm.cmd run lint                          # succès
frontend: npm.cmd run build                         # succès
```

Exemple de comportement couvert par un test : une candidature `IN_PROGRESS` peut être retirée, puis la même ligne est réactivée par une nouvelle candidature ; une candidature `SELECTED` renvoie une erreur HTTP 409 et reste inchangée.

La commande `npm.cmd run db:reset` a d'abord échoué parce que le serveur détenait encore la base SQLite (`EPERM`). Après arrêt explicite du serveur, la réinitialisation a réussi. Le rapport de validation runtime détaillé est conservé dans le dossier de session et n'est pas ajouté au dépôt.


utilisation des crédits 
Axel 13 %
Mitica 2 %