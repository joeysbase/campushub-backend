import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { RESERVATION_STATUSES, type ReservationStatus } from '../types/reservation';

/** Persisted Reservation fields; times are stored as Dates and serialized as ISO 8601. */
export interface IReservation {
  resourceId: Types.ObjectId;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

export type ReservationDocument = HydratedDocument<IReservation>;

const reservationSchema = new Schema<IReservation>(
  {
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    userId: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: RESERVATION_STATUSES, required: true, default: 'PENDING' },
  },
  { versionKey: false },
);

reservationSchema.pre('validate', function () {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'endTime must be after startTime.');
  }
});

// Supports overlap checks (resourceId + time range) and per-user lookups.
reservationSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
reservationSchema.index({ userId: 1, status: 1 });

export const ReservationModel: Model<IReservation> = model<IReservation>(
  'Reservation',
  reservationSchema,
);
