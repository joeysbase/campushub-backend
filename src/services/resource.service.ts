import type { Resource } from '../types/reservation';

/**
 * In-memory resource store for local development and testing.
 * Swap for ResourceModel (src/models/resource.model.ts) once MongoDB is wired up.
 */
const resources: Resource[] = [
  {
    id: 'res-101',
    name: 'Study Room 302',
    type: 'ROOM',
    location: 'Snell Library, Floor 3',
    isAvailable: true,
  },
  {
    id: 'res-102',
    name: '3D Printer A',
    type: 'EQUIPMENT',
    location: 'EXP Makerspace',
    isAvailable: true,
  },
  {
    id: 'res-103',
    name: 'Chemistry Lab B',
    type: 'LAB',
    location: 'Hurtig Hall, Room 110',
    isAvailable: true,
  },
  {
    id: 'res-104',
    name: 'Study Room 105',
    type: 'ROOM',
    location: 'Snell Library, Floor 1',
    isAvailable: false,
  },
];

export const listResources = async (type?: string): Promise<Resource[]> => {
  return type === undefined
    ? [...resources]
    : resources.filter((resource) => resource.type === type);
};

export const findResourceById = async (id: string): Promise<Resource | undefined> => {
  return resources.find((resource) => resource.id === id);
};
