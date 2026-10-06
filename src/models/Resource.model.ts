import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { RESOURCE_TYPES, type ResourceType } from '../types/reservation';

/** Persisted Resource fields; the API `id` is derived from MongoDB's `_id`. */
export interface IResource {
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

export type ResourceDocument = HydratedDocument<IResource>;

const resourceSchema = new Schema<IResource>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: RESOURCE_TYPES, required: true },
    location: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, required: true, default: true },
  },
  { versionKey: false },
);

resourceSchema.index({ type: 1 });

export const ResourceModel: Model<IResource> = model<IResource>('Resource', resourceSchema);
