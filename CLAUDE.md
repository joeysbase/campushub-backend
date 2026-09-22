# CLAUDE.md

This file provides context and governing rules for Claude Code (or any AI coding agent) when working in this repository. These rules are mandatory constraints, not suggestions. If a request conflicts with these rules, follow the rules and flag the conflict to the user instead of silently overriding them.

## Project Overview

**CampusHub** is a multi-tenant campus resource management system. This repository, `campushub-backend`, is the backend service: a TypeScript/Node.js/Express API backed by MongoDB (via Mongoose).

## 1. Tech Stack & Libraries

- **Authorized stack:** TypeScript, Node.js, Express, Mongoose.
- **Authorized dev tooling:** `typescript`, `ts-node`, `@types/node`, `eslint`, `prettier`.
- All source code must be written in TypeScript (`.ts`). **Raw JavaScript (`.js`) files are strictly forbidden** anywhere in `src/`.
- Do not add new runtime or dev dependencies without explicit user approval. Do not introduce alternative frameworks (e.g. Fastify, Koa, NestJS), alternative ORMs/ODMs (e.g. Prisma, Sequelize, TypeORM), or utility libraries (e.g. lodash, moment) unless the user explicitly requests them.
- Do not silently swap a package for a "better" alternative. If you believe a new dependency is warranted, propose it and explain why before installing it.

## 2. Architectural Boundaries

Enforce a strict 3-tier separation of concerns under `src/`. Every file must belong to exactly one of these layers, and must not perform the responsibilities of another layer:

```
src/
├── routes/        # Route definitions and middleware mapping only
├── controllers/    # Request/response handling and status codes
├── services/       # Pure business logic
└── models/         # Mongoose schemas and interface definitions only
```

- **Routes** (`src/routes/`): Define endpoints and wire up middleware/controllers only. No business logic, no direct DB access, no response construction beyond delegating to a controller.
- **Controllers** (`src/controllers/`): Parse the request, call the appropriate service, and shape the HTTP response (status codes, JSON payloads). **Controllers must never query the database directly** — all data access goes through a service.
- **Services** (`src/services/`): Contain all business logic and are the only layer permitted to call models/perform database operations. Services must be framework-agnostic — no `Request`/`Response` objects (Express types) inside a service.
- **Models** (`src/models/`): Mongoose schemas, models, and their corresponding TypeScript interfaces only. No business logic here.

If a task seems to require logic outside its designated layer, restructure the code to keep the boundary intact rather than taking a shortcut.

## 3. Coding Standards & Safety

- Every function signature (parameters and return type) and every database schema/document must have an explicit TypeScript `interface` (or `type`) definition. Do not rely on inferred or implicit types for public function signatures.
- **The `any` type is disallowed.** Use precise types, `unknown` with narrowing, or generics instead. If a third-party library lacks types, write a minimal local type declaration rather than falling back to `any`.
- All asynchronous code must use `async`/`await` with explicit error handling:
  - Every `async` function that can reject must have its errors handled (`try`/`catch` or a passed-through error handler) — no unhandled promise rejections.
  - In Express, use a consistent error-handling pattern (e.g. an async wrapper or centralized error-handling middleware) rather than ad hoc `try`/`catch` duplicated in every route.
- Follow the existing ESLint and Prettier configuration. Do not disable lint rules inline (`// eslint-disable`) to work around a violation — fix the underlying code instead, unless the user explicitly approves an exception.
- Prefer small, single-responsibility functions over large multi-purpose ones, consistent with the layer boundaries above.

## 4. Git & Commit Formatting

- When proposing or generating a commit, PR, or diff description, keep it concise and structured:
  - Summarize **what** was built/changed.
  - Note **why** any context-rule constraints from this file were applied (e.g. "moved DB query out of controller into a service to comply with architectural boundaries").
- Do not include unrelated changes in a single commit/PR description. If a change touches multiple concerns, call that out explicitly.
- Never commit secrets, `.env` files, `node_modules/`, or build output (`dist/`) — confirm `.gitignore` covers these before assuming a commit is safe.

## Verification Expectations

Before considering generated code complete, verify it against this file:

- [ ] Only TypeScript files were added/modified — no `.js` files.
- [ ] No unauthorized dependencies were introduced.
- [ ] Code is placed in the correct layer (`routes/`, `controllers/`, `services/`, `models/`) and does not cross responsibilities.
- [ ] All function signatures and schemas have explicit types; no `any` is used.
- [ ] Async operations have explicit error handling.
- [ ] The proposed commit/diff description explains what was built and why any rules from this file were applied.

This document is a living artifact. If project needs evolve (e.g. new authorized libraries, new layers, new standards), update this file explicitly rather than letting practice silently drift from what is documented here.
