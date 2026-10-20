import { isValidObjectId } from 'mongoose';
import { ResourceModel, type ResourceDocument } from '../models/Resource.model';
import {
  RESOURCE_TYPES,
  type Resource,
  type ResourceFilter,
  type ResourceType,
} from '../types/reservation';

const toResource = (doc: ResourceDocument): Resource => ({
  id: doc._id.toString(),
  name: doc.name,
  type: doc.type,
  location: doc.location,
  isAvailable: doc.isAvailable,
});

const isResourceType = (value: string): value is ResourceType =>
  (RESOURCE_TYPES as readonly string[]).includes(value);

export const listResources = async (filter: ResourceFilter = {}): Promise<Resource[]> => {
  const query: { type?: ResourceType; isAvailable?: boolean } = {};
  if (filter.type !== undefined) {
    if (!isResourceType(filter.type)) {
      return []; // No resource can have an unknown type.
    }
    query.type = filter.type;
  }
  if (filter.isAvailable !== undefined) {
    query.isAvailable = filter.isAvailable;
  }
  const docs = await ResourceModel.find(query).sort({ name: 1 }).exec();
  return docs.map(toResource);
};

export const findResourceById = async (id: string): Promise<Resource | null> => {
  if (!isValidObjectId(id)) {
    return null;
  }
  const doc = await ResourceModel.findById(id).exec();
  return doc === null ? null : toResource(doc);
};
