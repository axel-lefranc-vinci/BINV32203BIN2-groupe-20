# Audit des tests des candidatures — EF-32 / EF-33

| Cas à vérifier | Test existant et assertion utile | Constat |
|---|---|---|
| Candidater à une offre non publiée | [`auth.test.ts:194`](../../backend/tests/auth.test.ts#L194) vérifie le statut `409` et le code `OFFER_NOT_PUBLISHED`. | Couvert |
| Retirer une candidature déjà traitée | [`offers.test.ts:116`](../../backend/tests/offers.test.ts#L116) vérifie le statut `409` et le code `APPLICATION_NOT_WITHDRAWABLE`. | Partiel : seul le statut `SELECTED` est testé, pas `REJECTED`. |
| Un étudiant ne voit pas les candidatures d’un autre étudiant | [`auth.test.ts:219`](../../backend/tests/auth.test.ts#L219) compare les offres retournées pour Lucas et Mateusz. | Couvert |
| Un contact ne peut pas consulter `/applications/mine` | Aucun test ne vérifiait ce refus avant l’audit. | Manque confirmé, puis corrigé par l’ajout du test [`auth.test.ts:210`](../../backend/tests/auth.test.ts#L210), qui vérifie `403 FORBIDDEN`. |
| Créer une candidature avec ou sans message | [`offers.test.ts:53`](../../backend/tests/offers.test.ts#L53) vérifie `201`, la conservation du message et la normalisation à `null`. | Couvert |

## Vérification du test ajouté

- Test ciblé : réussi.
- Suite complète [`auth.test.ts`](../../backend/tests/auth.test.ts) : **25 tests réussis**.
- Aucun défaut de code applicatif révélé ; aucune correction du code de production nécessaire.