import { isValidObjectId } from 'mongoose';
import { ResourceModel, type ResourceDocument } from '../models/Resource.model';
import { RESOURCE_TYPES, type Resource, type ResourceType } from '../types/reservation';

const toResource = (doc: ResourceDocument): Resource => ({
  id: doc._id.toString(),
  name: doc.name,
  type: doc.type,
  location: doc.location,
  isAvailable: doc.isAvailable,
});

const isResourceType = (value: string): value is ResourceType =>
  (RESOURCE_TYPES as readonly string[]).includes(value);

export const listResources = async (type?: string): Promise<Resource[]> => {
  if (type !== undefined && !isResourceType(type)) {
    return []; // No resource can have an unknown type.
  }
  const filter = type === undefined ? {} : { type };
  const docs = await ResourceModel.find(filter).sort({ name: 1 }).exec();
  return docs.map(toResource);
};

export const findResourceById = async (id: string): Promise<Resource | null> => {
  if (!isValidObjectId(id)) {
    return null;
  }
  const doc = await ResourceModel.findById(id).exec();
  return doc === null ? null : toResource(doc);
};
