# CLAUDE.md

Mandatory rules for AI coding agents in this repository. If a request conflicts with them, follow the rules and flag the conflict instead of silently overriding them. If the project changes (new libraries, layers, or standards), update this file in the same change.

## Project Map

**CampusHub** is a campus resource reservation system: an Express + MongoDB (Mongoose) API and a React client.

```
src/           # Backend (TypeScript, Express 5, Mongoose)
shared/        # contract.ts: API types used by both src/ and client/
client/src/    # Frontend (React, Vite, axios, CSS Modules)
docs/          # openapi.yaml is the authoritative API contract
```

Agents should skip the paths in `.ignore` (dependencies, lockfiles, build output, logs, historical `docs/lab*-*.md` write-ups). Only read those when the user asks.

## 1. Dependencies

- **Backend:** TypeScript, Node.js, Express, Mongoose. Dev: `typescript`, `ts-node`, `@types/*`, `prettier`, `eslint` + `typescript-eslint`, for tests `jest`, `ts-jest`, `supertest`, `mongodb-memory-server`. CI uses `anthropics/claude-code-action`.
- **Client:** React, React DOM, Vite (`@vitejs/plugin-react`), `axios`, `oxlint`. Styling is CSS Modules only (no CSS framework).
- Do not add, remove, or swap dependencies without explicit user approval. Propose the change and explain why first.
- TypeScript only (`.ts` / `.tsx`): no `.js` files in `src/`, `shared/`, or `client/src/`.

## 2. Backend Architecture (`src/`)

`app.ts` builds the Express app (no DB connection, no `listen`), so tests can import it. `server.ts` connects to MongoDB and listens.

Each file belongs to exactly one layer and does only that layer's job:

- **`routes/`:** map endpoints to controllers. No logic, no DB access.
- **`controllers/`:** parse and validate the request (`utils/validation.ts`), call a service, and set the status code and JSON. **Never touch models or the DB.**
- **`services/`:** all business logic. The only layer that calls models. Framework-agnostic: no Express types, no HTTP status codes. Throw `AppError`s from `utils/errors.ts` (`validationError`, `notFoundError`, `conflictError`).
- **`models/`:** Mongoose schemas and their document interfaces only.
- **`middleware/errorHandler.ts`:** the only place that maps errors to HTTP responses (`AppError` kind to 400/404/409, anything else to 500).

If a task seems to need logic outside its layer, restructure to keep the boundary.

## 3. Coding Standards

- Explicit types on every exported function signature and schema. **No `any`**; use `unknown` and narrow it.
- **Errors in Express:** controllers are plain `async` functions with **no `try`/`catch` and no wrapper**. Express 5 forwards thrown and rejected errors to `middleware/errorHandler.ts`.
- **API types:** declare request/response shapes once, in `shared/contract.ts`, matching `docs/openapi.yaml`. Never redeclare them on either side; backend-only types go in `src/types/reservation.ts`.
- `npm run lint` (ESLint, `eslint.config.mjs`) must pass. Format with Prettier using `.prettierrc.json`, and only the files you changed. Never disable lint rules inline; fix the code.
- Prefer small, single-responsibility functions.

## 4. Client Rules (`client/src/`)

- Functional components with an exported `...Props` interface.
- **No API calls in components.** HTTP goes through `api/campushubApi.ts`. Reads use hooks built on `useApiQuery` (e.g. `useResources`), and writes use hooks built on `useApiMutation` (e.g. `useReservations.ts`).
- Every async workflow shows a loading state and an `ErrorBanner` (with a retry or dismiss action), and never leaves a spinner hanging. Map backend error codes to messages in `getApiErrorMessage` only.
- Keep pure logic (validation, formatting) in `utils/`. One `.module.css` per component, shared buttons in `styles/shared.module.css`, and colors only from the variables in `index.css`.

## 5. Testing

- Unit tests: `src/services/__tests__/`. HTTP integration tests (Supertest against `app`): `src/routes/__tests__/`. Shared helpers: `src/test/fixtures.ts`.
- `src/test/setup.ts` gives each test file its own in-memory MongoDB and empties the collections after each test. Never point tests at the real database.
- Test business rules against the in-memory DB, not mocked models: the overlap rule *is* a query. Mock only to force failures (e.g. a 500).
- Cover the failure paths, not just the happy path: every 400/404/409 code, boundary times (touching vs 1 ms overlap), and concurrency.
- A known bug is recorded as `test.failing` with a comment, never deleted or skipped. When a fix lands, it turns red; switch it back to `test`.
- `npm run test:coverage` enforces ≥80% statements and branches for `src/services/` and `src/controllers/`.

## 6. CI (`.github/workflows/ci.yml`)

- Every push to `main` and every PR into `main` runs `npm ci`, `npm run lint`, and `npm test`.
- If the Jest step fails, the `auto-fix` job runs Claude Code (`anthropics/claude-code-action`, auth from the `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` repo secret) on the failure log. Claude may edit but not commit, and the job rejects any change outside existing non-test files under `src/`. It re-runs lint and tests, and only if both pass opens a `fix/auto-heal-<run id>` PR into the failing branch.
- Auto-heal PRs are proposals. A human reviews the diff (root cause, no test changes) and fills in the PR's Audit Log before merging. Never merge one unreviewed.

## 7. Verify Before Finishing

- Backend: `npx tsc --noEmit` (includes tests), `npm run lint`, `npm test`, and `npm run build`.
- Client (in `client/`): `npx tsc -b`, `npm run lint`, and `npm run build`, all with no warnings.
- Behavior changes: test with `docker compose up -d`, `npm run seed`, `npm run dev`, including the 400/404/409 paths.

## 8. Commits

- Say **what** changed and **why** any rule above shaped it (e.g. "moved the DB query into a service to keep controllers DB-free"). Keep unrelated changes separate.
- Never commit `.env`, `node_modules/`, or `dist/`.
