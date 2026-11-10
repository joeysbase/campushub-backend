import { beforeEach, describe, expect, it } from '@jest/globals';
import { Types } from 'mongoose';
import { createTestResource } from '../../test/fixtures';
import type { Resource } from '../../types/reservation';
import { findResourceById, listResources } from '../resource.service';
import { getHealthStatus } from '../health.service';

describe('listResources', () => {
  let room302: Resource;
  let room105: Resource;
  let printer: Resource;

  beforeEach(async () => {
    room302 = await createTestResource({ name: 'Study Room 302' });
    room105 = await createTestResource({ name: 'Study Room 105', isAvailable: false });
    printer = await createTestResource({ name: '3D Printer A', type: 'EQUIPMENT' });
  });

  const names = (resources: Resource[]): string[] => resources.map((r) => r.name);

  it('returns every resource sorted by name when no filter is given', async () => {
    expect(names(await listResources())).toEqual([printer.name, room105.name, room302.name]);
  });

  it('filters by type', async () => {
    expect(names(await listResources({ type: 'ROOM' }))).toEqual([room105.name, room302.name]);
  });

  it.each([
    [true, ['3D Printer A', 'Study Room 302']],
    [false, ['Study Room 105']],
  ])('filters by isAvailable=%s', async (isAvailable, expected) => {
    expect(names(await listResources({ isAvailable }))).toEqual(expected);
  });

  it('combines type and isAvailable', async () => {
    expect(await listResources({ type: 'ROOM', isAvailable: true })).toEqual([room302]);
  });

  it.each(['STUDY_ROOM', 'room', ''])(
    'returns [] for a type no resource can have (%j)',
    async (type) => {
      expect(await listResources({ type })).toEqual([]);
    },
  );
});

describe('findResourceById', () => {
  it('returns the resource in API shape', async () => {
    const resource = await createTestResource();

    await expect(findResourceById(resource.id)).resolves.toEqual(resource);
  });

  it.each([
    ['an id that does not exist', new Types.ObjectId().toString()],
    ['a malformed id', 'not-an-id'],
  ])('returns null for %s', async (_label, id) => {
    await expect(findResourceById(id)).resolves.toBeNull();
  });
});

describe('getHealthStatus', () => {
  it('reports ok with a non-negative uptime and an ISO timestamp', () => {
    const health = getHealthStatus();

    expect(health.status).toBe('ok');
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(new Date(health.timestamp).toISOString()).toBe(health.timestamp);
  });
});
