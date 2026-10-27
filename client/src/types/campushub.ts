/**
 * Client-side mirrors of the component schemas in ../docs/openapi.yaml.
 * The OpenAPI spec is the authoritative contract — keep these in sync with it.
 */

export const RESOURCE_TYPES = ['ROOM', 'EQUIPMENT', 'LAB'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

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
export interface CreateReservationDTO {
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
