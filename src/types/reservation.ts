/**
 * TypeScript interfaces mirroring the component schemas in docs/openapi.yaml.
 * docs/openapi.yaml is the authoritative contract — keep these in sync with it.
 */

export const RESOURCE_TYPES = ['ROOM', 'EQUIPMENT', 'LAB'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Reservation statuses that occupy a resource's time block. */
export const ACTIVE_RESERVATION_STATUSES: readonly ReservationStatus[] = ['PENDING', 'CONFIRMED'];

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

/** Query parameters of GET /resources */
export interface ListResourcesQuery {
  type?: string;
}

/** Path parameters of GET /reservations/user/{userId} */
export interface UserReservationsParams {
  userId: string;
}
