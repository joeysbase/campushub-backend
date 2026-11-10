# Lab 7: Test Suite & Edge-Case Report

Agent: Claude Code (Claude Opus 5.5), working under the rules in `CLAUDE.md`.

## Setup

- **Packages:** `jest` 30, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`, `mongodb-memory-server` (MongoDB 8.2 binary), installed as the lab specifies.
- **`jest.config.ts`:** uses ts-jest, runs `**/__tests__/**/*.test.ts`, and enforces coverage thresholds.
- **`src/test/setup.ts`:** each test file gets its own in-memory MongoDB, with indexes built, and collections are emptied after each test.
- **Testable app:** `src/app.ts` used to connect to the real database and listen as soon as it was imported, so Supertest couldn't use it. Startup moved to `src/server.ts`; `npm run dev` and `npm start` now run that.
- **Build:** `tsconfig.build.json` keeps tests out of `dist/`, while `tsc --noEmit` still type-checks them.

### Setup problems solved

1. **MongoDB rejected every connection under Jest** ("Missing required sub-document 'driver' in the client metadata document"). The cause is that MongoDB driver 7.6 loads `os` with a dynamic `import()`. Jest's CommonJS sandbox doesn't support that, so the load failed silently and the handshake went out with empty metadata. Plain Node connects fine. Fix: `setup.ts` passes `os` through the driver's `runtimeAdapters` option.
2. **"Failed to load the ES module: jest.config.ts" warning.** On Node 24, Jest first tries Node's built-in TypeScript loader, which rejects `export default` in a CommonJS package. The config now uses `module.exports`.

## Results

`npm test`: **3 suites, 118 tests, all passing, in about 2 s.** `npx jest --coverage`: **100% statements, branches, functions, and lines** on every file in `src/` (excluding startup, config, and the seed script).

| Suite | Tests | Covers |
| --- | --- | --- |
| `services/__tests__/reservation.service.test.ts` | 32 | Creation, the half-open overlap rule at ±1 ms, invalid ranges reaching the model, missing/malformed/unavailable resources, cancel freeing a slot, all status transitions, concurrent cancels, a known double-booking race, and a 150-step seeded fuzz run |
| `services/__tests__/resource.service.test.ts` | 12 | Filters (type, availability, both, unknown types), lookups by id, health |
| `routes/__tests__/reservation.routes.test.ts` | 74 | Every endpoint and status code (200/201/400/404/409/500), 36 malformed `POST` bodies, query-parameter fuzzing, malformed JSON, URL-encoded ids, unknown routes, and that 500s don't leak error details |

### Do the tests catch bugs? (mutation check)

Seven deliberate bugs were planted one at a time. **All 7 made the suite fail:**

| Bug planted | Failing tests |
| --- | --- |
| Overlap uses `<=` (back-to-back slots conflict) | 1 |
| Overlap ignores status (cancelled bookings still block) | 3 |
| A CONFIRMED reservation can be confirmed again | 2 |
| Conflicts mapped to 400 instead of 409 | 5 |
| Controller skips the end-after-start check | 3 |
| User reservations not sorted | 1 |
| Impossible calendar dates accepted (see below) | 4 |

## Bugs Found

1. **Impossible dates were silently moved to a different day (fixed).** `startTime: "2026-02-30T10:00:00Z"` returned **201** and booked **March 2**, because `Date.parse` rolls invalid dates over. The same happened for Feb 29 in non-leap years, April 31, and `T24:00`. `validation.ts` now checks that the date exists and the hour is 00–23, as RFC 3339 (OpenAPI `date-time`) requires. Feb 29, 2028 is still accepted.
2. **Concurrent requests can double-book the same slot (open, recorded as `test.failing`).** The overlap check and the insert are two separate database calls. In probing, 5 identical simultaneous requests stored 2–5 reservations on every one of 10 runs. The test asserts the correct behavior (only one of 10 simultaneous bookings stored), so it passes while the bug exists and turns red when it is fixed. Possible fixes, each a design decision:
   - an atomic per-resource lock or version check on the Resource document;
   - MongoDB transactions, which need a replica set (a change to `docker-compose.yml`);
   - an in-process lock per resource, which is only safe while one server process runs.
