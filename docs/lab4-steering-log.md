# Lab 4: Prompt Steering Log

Agent: Claude Code (Claude Opus 5.5), working under the rules in `CLAUDE.md`.

These incidents come from the agent sessions that built Labs 2–4 of this repository. In most of them the agent caught the failure itself from tool output (the TypeScript compiler, the OpenAPI linter, or `git diff`), not from a human correction. Each entry records what actually triggered the fix, plus a reusable prompt that heads off the same failure up front.

---

### Incident 1: HTTP status codes leaked into the service layer

- **Initial Agent Output:** In Lab 2, `reservation.service.ts` threw errors built with `createHttpError(409, 'DOUBLE_BOOKING', ...)` and `createHttpError(404, ...)`. The service layer contained no Express imports, so it looked compliant, but it still decided HTTP status codes. That breaks the `CLAUDE.md` rule that services are framework-agnostic and controllers own status codes.
- **Root Cause:** The agent read the layer rule literally ("no `Request`/`Response` objects in services") and missed what it was for (services know nothing about HTTP). Building errors with a status code attached was the shortest route to a 409.
- **Remediation Prompt:** Triggered by the Lab 3 audit, Check 2: _"Does any file in `src/services/` import express or reference `res.status()`? The service layer should be limited to business logic and interactions with the database."_ Reusable prompt: _"Services must not know HTTP status codes. Throw domain errors (validation / not-found / conflict) from services, and map them to 400/404/409 in the error-handling middleware."_
- **Resolution:** Added `src/utils/errors.ts` (`AppError` with kinds `VALIDATION`, `NOT_FOUND`, `CONFLICT`), mapped kinds to status codes only in `middlewares/errorHandler.ts`, and deleted `utils/httpError.ts`. Verified with `grep -rnE "express|res\.|req\.|status\(" src/services` (no matches) and by rerunning the 404/409 curl tests.

### Incident 2: Mongoose query filter rejected by the compiler (enum vs. string)

- **Initial Agent Output:** In Lab 3, `resource.service.ts` passed `{ type }`, with `type: string` taken straight from the query string, into `ResourceModel.find(...)`. `tsc` failed with `TS2769: No overload matches this call ... Type 'string' is not assignable to type 'StrictCondition<"ROOM" | "EQUIPMENT" | "LAB">'`. A follow-on error on the result's `.map(toResource)` made the failure look larger than it was.
- **Root Cause:** The agent deliberately kept the `type` filter a free string so that `?type=STUDY_ROOM` returns `200 []`, as the Lab 2 tests expect. It then forgot that the Mongoose model types `type` as the `ResourceType` enum. The obvious fix, casting with `as ResourceType`, would have hidden the mismatch instead of handling it.
- **Remediation Prompt:** No human prompt; the compiler error was the steering signal. Reusable prompt: _"Do not cast to silence Mongoose filter types. Narrow untrusted strings with a type guard, and return an empty result for values that cannot match any document."_
- **Resolution:** Added an `isResourceType` type guard. Unknown types return `[]` without querying the database, and valid ones are passed as `ResourceType`. Verified with `npx tsc --noEmit` (clean) and curl: `?type=ROOM` returns 200 with only rooms, and `?type=STUDY_ROOM` returns `200 []`. In Lab 4 the same pattern was reused unchanged when adding the `isAvailable` filter.

### Incident 3: Mongoose validator `this` typing

- **Initial Agent Output:** In Lab 2, the Reservation schema enforced `endTime > startTime` with a field-level `validate: { validator(this: ReservationAttributes, value) {...} }`. `tsc` rejected it because Mongoose types a validator's `this` as either a document or a `Query`, not as the plain attributes interface.
- **Root Cause:** The agent used a validator pattern from older Mongoose documentation that doesn't type-check with Mongoose 9's stricter typings.
- **Remediation Prompt:** No human prompt; the compiler error was the steering signal. Reusable prompt: _"For validation that compares two fields of a Mongoose document, use a `pre('validate')` hook with `this.invalidate(...)` rather than a field-level validator."_
- **Resolution:** Replaced it with a `pre('validate')` hook in `Reservation.model.ts`. Verified with `npx tsc --noEmit`. The API also rejects reversed times before reaching the model (`endTime must be after startTime.`, 400).

### Incident 4: Formatter run that rewrote untouched files

- **Initial Agent Output:** In Lab 2, the agent ran `npx prettier --write src docs` to format its new files. With no Prettier config in the repo, Prettier's defaults (double quotes) rewrote every file, including the Lab 1 files the agent hadn't changed (`app.ts`, the health route/controller/service).
- **Root Cause:** The agent assumed a project Prettier config existed without checking. The existing code used single quotes and a 100-character line width only by convention.
- **Remediation Prompt:** No human prompt; the agent noticed the unexpected files in `git status`. Reusable prompt: _"Before running a formatter, check for its config. Only format the files you changed, and match the existing style (single quotes, width 100)."_
- **Resolution:** Restored the untouched files with `git checkout`, then reformatted only the new files using `--single-quote --print-width 100`. Verified that `git diff --stat` listed only intended changes and `prettier --check` passed.

### Incident 5: Lab-mandated paths flagged as ambiguous

- **Initial Agent Output:** In Lab 4, adding `PATCH /reservations/{id}/cancel` and `/confirm` produced Redocly `no-ambiguous-paths` warnings against `GET /reservations/user/{userId}`, because `/reservations/user/cancel` matches both templates.
- **Root Cause:** The lab specifies both path shapes. The overlap exists only on paper: the HTTP methods differ, and `{id}` must be a 24-character ObjectId, which `user` is not.
- **Remediation Prompt:** No human prompt; the agent evaluated the lint warning before choosing a fix. Reusable prompt: _"When a linter flags a lab-mandated design, confirm whether it causes a real routing conflict before changing the API. If it doesn't, disable the rule with a comment explaining why."_
- **Resolution:** Disabled `no-ambiguous-paths` in `redocly.yaml` with a comment explaining why. Verified with `redocly lint` (clean) and curl: `GET /reservations/user/user-456` returns 200, and `PATCH /reservations/not-an-id/cancel` returns 400.

---

## Lab 4 Verification Summary

All tests were run against MongoDB (`docker compose up -d`, `npm run seed`, `npm run dev`):

| Area                   | Tests                                                                                                                                                                                                       | Result                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Lab 2–3 regression     | health; list/filter resources; empty `type`; create; double-booking; back-to-back booking; unavailable resource; missing field; non-ISO date; reversed times; unknown resource; bad JSON; user reservations | All match previous behavior                                |
| `isAvailable` filter   | `true`, `false`, combined with `type`, invalid value                                                                                                                                                        | 200 / 200 / 200 / 400                                      |
| Confirm                | `PENDING` → `CONFIRMED`; confirm again; confirm a cancelled reservation                                                                                                                                     | 200 / 409 / 409                                            |
| Cancel                 | `CONFIRMED` → `CANCELLED`; `PENDING` → `CANCELLED`; cancel again; malformed id; unknown id                                                                                                                  | 200 / 200 / 409 / 400 / 404                                |
| Slot freed by cancel   | Rebook an overlapping time after cancelling                                                                                                                                                                 | 201                                                        |
| User list after cancel | Cancelled reservations excluded                                                                                                                                                                             | 200 `[]`                                                   |
| Database down          | `GET /resources` with MongoDB stopped                                                                                                                                                                       | 500 `INTERNAL_SERVER_ERROR` (details logged, not returned) |
