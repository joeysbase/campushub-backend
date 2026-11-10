import { ResourceModel, type IResource } from '../models/Resource.model';
import type { CreateReservationRequest, Resource } from '../types/reservation';

/** Inserts a resource straight through the model (tests shouldn't depend on a seed script). */
export const createTestResource = async (overrides: Partial<IResource> = {}): Promise<Resource> => {
  const doc = await ResourceModel.create({
    name: 'Study Room 302',
    type: 'ROOM',
    location: 'Snell Library, Floor 3',
    isAvailable: true,
    ...overrides,
  });
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    location: doc.location,
    isAvailable: doc.isAvailable,
  };
};

/** A valid POST /reservations body for `resourceId`, 10:00–11:00 UTC on 2026-12-01 unless overridden. */
export const reservationRequest = (
  resourceId: string,
  overrides: Partial<CreateReservationRequest> = {},
): CreateReservationRequest => ({
  resourceId,
  userId: 'user-456',
  startTime: '2026-12-01T10:00:00.000Z',
  endTime: '2026-12-01T11:00:00.000Z',
  ...overrides,
});

/** The same instant shifted by `ms` milliseconds, as an ISO string. */
export const shiftIso = (iso: string, ms: number): string =>
  new Date(Date.parse(iso) + ms).toISOString();

/** Deterministic PRNG (mulberry32), so fuzz tests replay identically from a seed. */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
