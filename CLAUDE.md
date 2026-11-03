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

- **Backend:** TypeScript, Node.js, Express, Mongoose. Dev: `typescript`, `ts-node`, `@types/*`, `prettier`.
- **Client:** React, React DOM, Vite (`@vitejs/plugin-react`), `axios`, `oxlint`. Styling is CSS Modules only (no CSS framework).
- Do not add, remove, or swap dependencies without explicit user approval. Propose the change and explain why first.
- TypeScript only (`.ts` / `.tsx`): no `.js` files in `src/`, `shared/`, or `client/src/`.

## 2. Backend Architecture (`src/`)

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
- Format with Prettier using the repo's `.prettierrc.json`, and only the files you changed. Never disable lint rules inline; fix the code.
- Prefer small, single-responsibility functions.

## 4. Client Rules (`client/src/`)

- Functional components with an exported `...Props` interface.
- **No API calls in components.** HTTP goes through `api/campushubApi.ts`. Reads use hooks built on `useApiQuery` (e.g. `useResources`), and writes use hooks built on `useApiMutation` (e.g. `useReservations.ts`).
- Every async workflow shows a loading state and an `ErrorBanner` (with a retry or dismiss action), and never leaves a spinner hanging. Map backend error codes to messages in `getApiErrorMessage` only.
- Keep pure logic (validation, formatting) in `utils/`. One `.module.css` per component, shared buttons in `styles/shared.module.css`, and colors only from the variables in `index.css`.

## 5. Verify Before Finishing

- Backend: `npx tsc --noEmit` and `npm run build`.
- Client (in `client/`): `npx tsc -b`, `npm run lint`, and `npm run build`, all with no warnings.
- Behavior changes: test with `docker compose up -d`, `npm run seed`, `npm run dev`, including the 400/404/409 paths.

## 6. Commits

- Say **what** changed and **why** any rule above shaped it (e.g. "moved the DB query into a service to keep controllers DB-free"). Keep unrelated changes separate.
- Never commit `.env`, `node_modules/`, or `dist/`.
