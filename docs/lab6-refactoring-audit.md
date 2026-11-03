# Lab 6: Refactoring & Context Optimization

Agent: Claude Code (Claude Opus 5.5), working under the rules in `CLAUDE.md`.

## Part 1: Context Optimization

| Change | Before | After |
| --- | --- | --- |
| `CLAUDE.md` | 1,029 words. It told agents to follow ESLint/Prettier configs that didn't exist, had backend and client rules in separate places, and ended with a checklist that repeated Sections 1–3. | 587 words. Adds a project map, merges the two dependency lists, and replaces the checklist with the commands to run. Stale rules updated: no `asyncHandler`, `middleware/` path, `shared/contract.ts`. |
| `.ignore` (new) | Agent-searchable files: 57 files, 238 KB, of which 140 KB were the two `package-lock.json` files | 53 files, 89 KB (**−63%**). Excludes lockfiles, build output, maps, logs, `.env`, and the historical `docs/lab*-*.md` logs. |
| `.claude/settings.json` (new) | No restrictions | Denies `Read` on `.env`, `node_modules`, `dist`, `build`, `coverage`, `*.map`, `*.log`, and lockfiles. |
| `.prettierrc.json` (new) | No config. Prettier's defaults (double quotes) rewrote untouched files in Lab 2 (Lab 4 log, Incident 4). | Encodes the existing style: single quotes, width 100, trailing commas. |

We use Claude Code, so the tool equivalents of `.cursorignore` are `.ignore`, honored by ripgrep and therefore by Claude Code's Grep/Glob, plus the `permissions.deny` rules in `.claude/settings.json`.

**Verification:**
- `rg -l DOUBLE_BOOKING` now returns only `src/`, `client/src/`, and `docs/openapi.yaml`. Without the `.ignore` rules it also returned both old lab logs.
- A headless query (`claude -p "Which source files implement the double-booking check and turn it into an HTTP 409?"`, Haiku) answered correctly in 3 turns for $0.003. It searched only `src/` and `shared/`.
- Caveat: that agent used plain `grep` through Bash, which does not read `.ignore`. It stayed in the source folders because `CLAUDE.md` now maps the repo for it. `.ignore` covers only the rg-based tools, and the `Read` deny rules are the hard limit.

## Part 2: Bloat & Redundancy Audit

| # | Finding | Where | Action |
| --- | --- | --- | --- |
| 1 | **Wrapper Express doesn't need.** Every controller was wrapped in `asyncHandler`, but Express 5 already forwards rejected promises to error middleware. `getHealth` was `async` with nothing to await. | `src/utils/asyncHandler.ts`, all controllers | Removed (Part 3) |
| 2 | **Duplicate interfaces across the stack.** `Resource`, `Reservation`, `ErrorResponse`, the create-request shape (named differently, `CreateReservationDTO` vs `CreateReservationRequest`), and the type/status enums were declared on both sides. | `src/types/reservation.ts`, `client/src/types/campushub.ts` | Merged (Part 3) |
| 3 | **Repeated request logic in components.** `BookingForm` and `UserReservations` each managed their own `isSubmitting`/`cancellingId` + error state with a `try`/`catch` and `getApiErrorMessage` call. | client components | Extracted (Part 3) |
| 4 | **Overly verbose component.** `BookingForm` was 149 lines mixing validation rules, request state, and rendering. | `client/src/components/BookingForm.tsx` | Split (Part 3) |
| 5 | **Repeated validation checks.** "Non-empty string" was checked 3 ways and "is an ObjectId" 2 ways. | `src/utils/validation.ts` | Merged into `isNonEmptyString` / `isObjectId` |
| 6 | **Lab path mismatch.** The lab expects `src/middleware/`, but the repo had `src/middlewares/`. The centralized handler itself already existed (Lab 3). | `src/middlewares/` | Renamed |

Checked and left alone:
- Services and models: no duplication, and each file is under 125 lines.
- `App.tsx` fetches the unfiltered resource list separately from `ResourceList`, to look up names. That's one extra small request, not worth coupling the two components.
- ESLint is installed in the backend but has no config. Configuring it for TypeScript needs `typescript-eslint`, a new dependency, so it is pending approval and `CLAUDE.md` no longer claims a config exists.

## Part 3: Refactoring

1. **Backend error handling:** deleted `asyncHandler`. Controllers are now plain `async` functions with no `try`/`catch`, and errors go to `src/middleware/errorHandler.ts`, renamed from `middlewares/`.
2. **Frontend hooks:** added `client/src/hooks/useReservations.ts`:
   - `useUserReservations(userId)` handles the list, loading, error, reload, and `cancel`.
   - `useCreateReservation(onCreated)` handles creating a reservation.
   - Both are built on a new generic `useApiMutation` (pending input + error message), next to the existing `useApiQuery`.
   - Neither component calls the API or holds request state any more.
   - Booking validation moved to `client/src/utils/validateBooking.ts`.
3. **Shared interfaces:** `shared/contract.ts` is now the single declaration of the API types.
   - Backend: `src/types/reservation.ts` re-exports it and keeps only backend-only types. `tsconfig.json` has `rootDir: "."`, so `npm start` runs `dist/src/app.js`.
   - Client: imports it as `@shared/contract` (Vite alias + tsconfig `paths`). `server.fs.allow` opens only `../shared`: Vite serves `/@fs/.../shared/contract.ts` (200) and refuses `/@fs/.../.env` (403).

| File | Before | After |
| --- | --- | --- |
| `BookingForm.tsx` | 149 lines | 119 |
| `UserReservations.tsx` | 81 | 62 |
| `src/utils/asyncHandler.ts` | 16 | deleted |
| `client/src/types/campushub.ts` | 45 (duplicate) | deleted |

## Regression Testing

- **API:** a 29-case curl script was run before and after the refactor on freshly seeded data, with ids and timestamps normalized. All responses were identical. It covers every endpoint and every 400/404/409 path, including malformed JSON, the unknown route 404, the confirm/cancel transitions, and re-booking a freed slot.
- **Database down:** with MongoDB stopped, `GET /resources` and `PATCH /cancel` return `500 INTERNAL_SERVER_ERROR`. This confirms errors from async handlers still reach the error handler without `asyncHandler`.
- **UI (headless Chrome, Vite dev server):** all Lab 5 flows behave as before: filters, disabled unavailable card, field validation, 409 banner (inputs kept, dismissible), booking, cancel, re-booking the freed slot, and switching students.
  - New case: cancelling a booking already cancelled elsewhere shows "This reservation has already been cancelled." and the list still reloads.
  - No JavaScript errors; the only console entries are the network log of the expected 409s.
- **Builds:** backend `tsc --noEmit` and `npm run build`. Client `tsc -b`, `oxlint` (0 warnings), and `vite build`. `prettier --check` passes on `src`, `shared`, and `client/src`.
