# Lab 5: State Management & Error Handling Audit

Tested against the seeded database (`npm run seed`) with the backend on port 3000 and the client on Vite's dev server, by driving the UI in headless Chrome.

| Scenario | Result |
| --- | --- |
| Double-book Study Room 302 (14:15–14:45 over an existing 14:00–15:00) | `409 DOUBLE_BOOKING` → form shows "This resource is already reserved for the selected time window." The button re-enables and the inputs are kept so the student can adjust them. |
| Submit with empty times / end before start | Blocked client-side with field errors ("Choose a start time.", "End time must be after the start time."); no request is sent. |
| Valid booking | Success message, form resets, "My Bookings" refreshes and shows the new `PENDING` booking. |
| Cancel a booking | Row shows "Cancelling…", then the list refreshes without it. Re-booking the freed slot succeeds. |
| Unavailable resource (Study Room 105) | "Book" button is disabled. |
| Backend stopped | Both lists show "Cannot reach the CampusHub server…" with Retry, no loader left spinning. Retry works once the backend is back. |
| Filters (All / Rooms / Equipment / Labs) | Each refetches `GET /resources?type=…` and shows only matching cards. |

## Issues found and fixed during the audit

1. **Backend down showed "Request failed with status 502."** Through the Vite proxy a dead backend returns a 502, not a network error, so the "can't reach server" branch never ran. `getApiErrorMessage` now treats 502/503/504 the same as no response.
2. **Field errors were inside the `<label>`.** The End input's accessible name became "End time End time must be after the start time." Errors now sit outside the label and are linked with `aria-describedby`.
3. **Lint warnings instead of suppressions.** `oxlint` flagged `setState` called synchronously inside an effect, and an unused `refreshKey` dependency. Rather than disabling the rules (forbidden by `CLAUDE.md`), `useApiQuery` now derives `isLoading` from which request last settled, and `App` owns the bookings query so `BookingForm` can call its `reload` directly.
4. **Backend `tsc` picked up `client/`.** The root `tsconfig.json` had no `include`, so adding the client broke the backend build (`TS6059`). It is now limited to `src/`.
