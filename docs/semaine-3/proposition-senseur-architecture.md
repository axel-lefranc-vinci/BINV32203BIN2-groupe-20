# Proposition de senseur d’architecture

## Règle vérifiée

Le senseur vérifierait les frontières de couches du backend :

`controllers → services → repositories → SQLite`

Plus précisément :

- les controllers peuvent dépendre des services, mais pas directement des repositories ou de `better-sqlite3` ;
- les services ne doivent importer ni Express `Request`/`Response`, ni les objets de la base ;
- les repositories sont la seule couche qui contient du SQL et reçoit la connexion SQLite.

Cette règle est concrète et récurrente dans Gesta. Elle protège la séparation des responsabilités, permet l’injection d’une base en mémoire dans les tests et évite de déplacer les règles métier dans les routes ou les requêtes SQL. Elle correspond aux passages sur les couches dans [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) et [`architecture.md`](../architecture.md).

## Moment d’exécution

Le senseur fonctionnerait comme une commande de vérification, par exemple `npm run check:architecture`, exécutée :

1. localement avant une livraison ;
2. dans la CI à chaque pull request ;
3. éventuellement comme étape d’une revue assistée avant de proposer une modification.

Il compléterait TypeScript, le lint et les tests : ceux-ci vérifient surtout la compilation, le style et le comportement, pas la direction des dépendances.

## Données examinées et résultat

Le senseur parcourrait les fichiers TypeScript sous `backend/src/controllers`, `backend/src/services` et `backend/src/repositories`. Il construirait un graphe des imports et signalerait aussi :

- les imports de `better-sqlite3` hors de `repositories/` et `db/` ;
- les imports de `express` ou les types `Request`/`Response` dans `services/` ;
- les requêtes SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) hors de `repositories/` ;
- un controller qui instancie lui-même un repository au lieu de recevoir ses dépendances depuis `app.ts`.

Le résultat serait une sortie non nulle en cas de violation, avec un message exploitable :

```text
Architecture violation:
backend/src/services/offers.service.ts:3 imports Request from express.
Services must not depend on Express request/response types.
```

En l’absence de violation, la commande afficherait un résumé court et retournerait le code 0.

## Exemple de violation

Le fichier suivant devrait déclencher un retour :

```ts
// backend/src/services/offers.service.ts
import Database from "better-sqlite3";

export function listOffers(db: Database.Database) {
  return db.prepare("SELECT * FROM offers").all();
}
```

Il contourne le repository, mélange accès aux données et service, et rend le service difficile à tester avec l’architecture prévue.

## Faux positifs, limites et coûts

- Une importation de type peut être légitime dans une couche particulière ; le senseur devrait distinguer `import type` et les imports d’exécution, tout en refusant explicitement `Request`/`Response` dans les services.
- La détection textuelle de SQL peut être imparfaite pour une chaîne construite dynamiquement. Une analyse TypeScript de l’AST serait plus fiable qu’une simple expression régulière.
- Certains fichiers d’initialisation ou scripts de migration ont besoin de SQLite ; ils doivent être exclus explicitement plutôt que générer de faux positifs.
- Le coût de développement est faible si le senseur réutilise le graphe d’imports du linter ou une bibliothèque AST. Il faut toutefois maintenir la liste des exceptions et adapter le senseur lors d’un changement volontaire d’architecture.

Cette proposition reste un audit : le senseur n’est pas implémenté et les guides ne sont pas modifiés.
