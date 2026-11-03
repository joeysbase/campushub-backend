# CampusHub Client

React + TypeScript + Vite frontend for the CampusHub API in this repository. It lists campus resources, books time slots, and manages a student's bookings.

## Running locally

1. Start the backend from the repository root: `docker compose up -d`, `npm run seed`, then `npm run dev` (port 3000).
2. In `client/`: `npm install`, then `npm run dev`, and open http://localhost:5173.

Vite proxies `/api` to `http://localhost:3000`, so the browser talks to a single origin and the backend needs no CORS setup.

## Structure

```
src/
├── api/campushubApi.ts     # Typed API client + error-message mapping
├── hooks/
│   ├── useApiQuery.ts      # Reads: loading / error / reload, ignores stale responses
│   ├── useApiMutation.ts   # Writes: pending / error state
│   ├── useResources.ts
│   └── useReservations.ts  # useUserReservations (list + cancel), useCreateReservation
├── components/             # ResourceList, BookingForm, UserReservations, ErrorBanner
├── styles/shared.module.css
└── utils/                  # format.ts (labels, dates), validateBooking.ts
```

API types (`Resource`, `Reservation`, `CreateReservationRequest`, ...) are imported from `@shared/contract`, which is `../shared/contract.ts`, the same file the backend uses.

There is no authentication yet, so the current student is whatever ID is entered in the header (default `user-456`).

## Checks

`npx tsc -b`, `npm run lint`, `npm run build`
