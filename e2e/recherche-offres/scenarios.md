# Scénarios E2E - Recherche d'offres par titre

## Préparation commune

- Démarrer l'application avec une base initialisée ou recréée à partir des données de démonstration.
- Se connecter en tant que l'étudiant **Lucas Dupont**.
- Utiliser les données fictives de `backend/src/db/seed/offersData.ts`.
- L'année académique courante contient les offres de 2026-2027.
- Pour Lucas, seules les offres au statut **Publiée** sont visibles.
- Commencer sur la page **Offres de stage**, accessible depuis la navigation principale.
- Au départ, le champ **Recherche** est vide et le filtre **Période** vaut **Toutes les périodes**.

## Scénario 1 - Recherche nominale avec résultat

| Élément | Description |
|---|---|
| Numéro | 1 |
| Scénario | Recherche insensible à la casse et aux espaces avec une période |
| État initial | Lucas Dupont est connecté. Les offres publiées de l'année courante sont disponibles : **Application React de gestion de flotte** (Lumen Digital, P2), **API REST de facturation** (Orbis, P2), **Tableau de bord de qualité des données** (Lumen Data, P2) et **Assistant conversationnel interne** (Nexalis, P2). Il existe également des offres non publiées ou non visibles pour l'étudiant, notamment **Refonte du portail client** (soumise) et **Migration d'une application vers le cloud** (attribuée). |
| Actions dans l'interface | 1. Saisir `  aPpLiCAtIoN  ` dans le champ **Recherche**. 2. Attendre la fin du délai de recherche automatique. 3. Sélectionner **P2** dans le filtre **Période**. |
| Résultat attendu | La recherche ignore la casse et les espaces extérieurs. Le tableau affiche exactement une offre : **Application React de gestion de flotte**, de **Lumen Digital**, avec le statut **Publiée** et la période **P2**. Le compteur indique `1 offre`. Les offres **API REST de facturation**, **Tableau de bord de qualité des données**, **Assistant conversationnel interne**, ainsi que toutes les offres soumises, en attente, attribuées ou archivées, ne sont pas affichées. |

## Scénario 2 - Recherche particulière sans résultat

| Élément | Description |
|---|---|
| Numéro | 2 |
| Scénario | Recherche sans correspondance |
| État initial | Lucas Dupont est connecté sur la page **Offres de stage**. Le champ **Recherche** est vide, le filtre **Période** vaut **Toutes les périodes** et les quatre offres publiées de l'année 2026-2027 sont chargées. |
| Actions dans l'interface | Saisir `expression-inexistante` dans le champ **Recherche** et attendre la fin du délai de recherche automatique. |
| Résultat attendu | Aucune ligne d'offre n'est affichée. La page affiche exactement le message **Aucune offre ne correspond à votre recherche.** Aucun titre d'offre publié, aucune autre offre visible et aucun message d'état vide général tel que `Aucune offre à afficher.` ne sont présents. |
