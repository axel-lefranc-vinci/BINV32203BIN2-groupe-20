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

