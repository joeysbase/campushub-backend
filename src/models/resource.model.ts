import { Schema, model, type Model } from 'mongoose';
import { RESOURCE_TYPES, type Resource } from '../types/reservation';

/** Persisted Resource fields; `id` is derived from MongoDB's `_id`. */
export type ResourceAttributes = Omit<Resource, 'id'>;

const resourceSchema = new Schema<ResourceAttributes>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: RESOURCE_TYPES, required: true },
    location: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, required: true, default: true },
  },
  { versionKey: false, toJSON: { virtuals: true } },
);

resourceSchema.index({ type: 1 });

export const ResourceModel: Model<ResourceAttributes> = model<ResourceAttributes>(
  'Resource',
  resourceSchema,
);
