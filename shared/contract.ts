/**
 * API contract types shared by the backend (src/) and the client (client/src/).
 * Mirrors the component schemas in docs/openapi.yaml, which is authoritative:
 * when the spec changes, change this file, and both sides pick it up.
 */

export const RESOURCE_TYPES = ['ROOM', 'EQUIPMENT', 'LAB'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** An ISO 8601 date-time string (OpenAPI `format: date-time`). */
export type IsoDateTimeString = string;

/** components/schemas/Resource */
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

/** components/schemas/Reservation */
export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: IsoDateTimeString;
  endTime: IsoDateTimeString;
  status: ReservationStatus;
}

/** components/schemas/CreateReservationRequest — request body of POST /reservations */
export interface CreateReservationRequest {
  resourceId: string;
  userId: string;
  startTime: IsoDateTimeString;
  endTime: IsoDateTimeString;
}

/** components/schemas/ErrorResponse */
export interface ErrorResponse {
  code: string;
  message: string;
}
