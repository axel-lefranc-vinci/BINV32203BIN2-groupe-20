# Gesta project guidelines

## Build, test, and lint

Use Node.js 22.14 or newer (Node 24 LTS is recommended) and run commands from the
repository root. Install the locked dependencies with `npm ci`, then run `npm run setup`
once to create `backend/.env` and initialize the demo SQLite database.

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

`npm run check` runs linting, TypeScript checks, all tests, and both workspace builds.
To run one test file, use Vitest through the relevant workspace:

```bash
npm test --workspace backend -- tests/companies.test.ts
npm test --workspace frontend -- tests/CompaniesPage.test.tsx
```

To run one named test or test group, append Vitest's `-t` selector:

```bash
npm test --workspace backend -- tests/permissions.test.ts -t "can list offers"
```

Backend tests use an in-memory SQLite database and do not use
`backend/data/gesta.db`. `npm run db:reset` recreates the development database; stop the
dev server first because SQLite keeps the database open.

## Architecture

This is an npm-workspaces monorepo with a React/Vite frontend and an Express/TypeScript
backend backed by SQLite (`better-sqlite3`). The Vite development server exposes the
frontend at port 5173 and proxies `/api/...` to the backend at port 3000, removing the
`/api` prefix. `API_PORT` changes the backend port and must also be reflected in the
frontend's Vite proxy environment.

The backend is assembled in `backend/src/app.ts`: controllers parse HTTP input and map
responses, services hold business rules, repositories contain SQL, and mappers translate
between database rows, domain objects, and API DTOs. Authentication and authorization are
middleware/service concerns. Errors should be raised as `HttpError` and are converted by
the central error handler to `{ "error": { "code", "message" } }`.

Database startup (`backend/src/main.ts`) loads configuration, opens SQLite, applies
numbered migrations, seeds an empty database, and starts Express. Add schema changes as a
new ordered SQL migration under `backend/src/db/migrations/`; do not edit an applied
migration.

The frontend follows `pages -> hooks -> services/utils -> models`, with reusable UI in
`components`. `App.tsx` is the single owner of the `useAuth` session; pages receive the
token and logout callback. API services validate response JSON with type guards, and hooks
translate 401 responses into logout rather than duplicating authentication logic.

See [docs/architecture.md](../docs/architecture.md) for the layer boundaries and the
reference companies/offers flows, [backend/API.md](../backend/API.md) for the HTTP
contract, and [docs/seed.md](../docs/seed.md) for demo identities and stable seed IDs.

## Repository-specific conventions

- Backend relative imports use explicit `.ts` extensions. TypeScript rewrites them to
  `.js` in the compiled output.
- Build each backend layer through a factory (`create...Repository`, `create...Service`,
  or router factory) and compose dependencies in `app.ts`; services must not depend on
  Express `Request` or `Response`.
- Keep SQL in repositories and return DBOs there. Convert DBOs to domain values in
  mappers/services and to public DTOs at the controller boundary.
- Keep access rules named and centralized in `backend/src/services/permissions.ts`.
  `authenticate` re-reads the account, roles, and company relationships from the
  database for every request; do not trust roles supplied by the token or frontend.
- The `Authorization` header contains the token directly, without a `Bearer` prefix.
  Demo authentication is for local development only and must never be enabled with
  `NODE_ENV=production`.
- Use the existing status codes and error codes documented in `backend/API.md`; do not
  return ad-hoc error shapes or silently convert invalid input into a default.
- SQLite enforces schema constraints; business rules such as visibility, permissions, and
  status transitions belong in services. Stored status codes are English; the frontend
  supplies French display labels.
- Frontend API calls should use the shared `readJson`/type-guard utilities, pass an
  `AbortSignal` for cancellable loads where appropriate, and call the supplied
  `onUnauthorized` callback on 401.
- Keep tests close to the layer they exercise: backend API tests use Supertest and the
  seeded in-memory app helpers; frontend tests use Vitest, Testing Library, jsdom, and
  the fetch mocks from `frontend/tests/helpers`.
- Before adding dependencies, preserve the repository's `ignore-scripts=true` install
  behavior and update the root lockfile with the package-manager workflow documented in
  [README.md](../README.md). Run `npm run check` after dependency or cross-layer changes.
- After each working session, record the exported agent conversation in `docs/` as
  described in [README.md](../README.md); add `docs/bilan.md` at the end of the project.

# Gesta repository guidelines

## Build, test, and lint

- Use Node.js `>=22.14.0` (Node 24 LTS is recommended) and npm.
- From the repository root, install with `npm ci`, then run `npm run setup` once to create `backend/.env` and initialize the demo database.
- Run the complete development stack with `npm run dev`: the API is on `http://localhost:3000` and the Vite app is on `http://localhost:5173`.
- Before a substantial commit, run `npm run check` (lint, typecheck, tests, and build).
- Individual checks are available with `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Run one workspace's tests with `npm test -w backend` or `npm test -w frontend`. Run a single test file with, for example, `npm test -w backend -- tests/offers.test.ts` or `npm test -w frontend -- tests/CompaniesPage.test.tsx`; pass Vitest filters after `--` when narrowing to a test name.
- Use `npm run db:init` to apply migrations and seed an empty database. Use `npm run db:reset` only with the development server stopped.

See [README.md](../README.md) for setup/troubleshooting and [backend/API.md](../backend/API.md) for the HTTP contract.

## Architecture

This is an npm-workspaces monorepo with a React/Vite frontend and an Express/TypeScript backend backed by local SQLite (`better-sqlite3`).

- Backend request flow is `main.ts` → `app.ts` → authentication/authorization middleware → controllers → services → repositories → SQLite. Mappers convert database rows to domain objects and API DTOs.
- Controllers own HTTP parsing/validation and response status codes. Services contain business rules and must not depend on Express `Request` or `Response`. Repositories contain SQL and return database records.
- Authorization is intentionally layered: `authenticate` validates the raw session token and reloads the current user, roles, and companies from the database on every request; `authorize` and named predicates in `services/permissions.ts` enforce access; services apply resource visibility filters.
- The frontend follows `pages → hooks → services/utils → models`, with reusable presentational components. `App` is the single owner of `useAuth`; pages receive the session token and an unauthorized callback through props.
- Frontend requests use `/api/...`; Vite proxies them to the backend and removes `/api`. Backend routes themselves are mounted without that prefix.
- Database migrations in `backend/src/db/migrations/` are applied once in filename order. Add a new numbered `.sql` migration for schema changes; do not edit an already-applied migration. Foreign keys and structural constraints belong in SQLite, while business rules belong in services.

For the fuller layer map and reference flows, see [docs/architecture.md](../docs/architecture.md).

## Repository-specific conventions

- Backend relative imports intentionally include the `.ts` extension; TypeScript rewrites them to `.js` during the build. Preserve this style.
- Use the existing factory pattern (`create...Repository`, `create...Service`, `create...Router`) and assemble dependencies in `backend/src/app.ts` so tests can inject an in-memory database.
- Represent API failures with `throw new HttpError(status, code, message)`. Let `errorHandler` produce the standard `{ "error": { "code", "message" } }` response; do not create ad-hoc error JSON.
- Keep permission rules named and reusable in `backend/src/services/permissions.ts`; do not rely on frontend route visibility as authorization.
- The `Authorization` header contains the JWT directly, without a `Bearer` prefix. Tokens contain only `{ kind, id }`; roles and company access are reloaded server-side.
- Demo authentication is local-development-only (`DEMO_AUTH_ENABLED=true`) and must not be enabled with `NODE_ENV=production`.
- API status values use English codes such as `PUBLISHED`; translate them to French only at the display layer.
- Frontend services must use the shared `readJson` helper and validate response shapes with the existing type guards. Handle HTTP 401 through the hook's `onUnauthorized` path.
- Backend tests use Vitest/Supertest with `tests/helpers/createTestApp` and an isolated in-memory SQLite database; never use `backend/data/gesta.db` in tests. Frontend tests use Vitest/Testing Library with `frontend/tests/setup.ts` and mocked fetch responses.
- Keep user-facing UI and API messages in French, matching existing wording and error codes.

