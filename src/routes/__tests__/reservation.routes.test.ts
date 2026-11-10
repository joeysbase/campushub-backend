import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Types } from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { ReservationModel } from '../../models/Reservation.model';
import { ResourceModel } from '../../models/Resource.model';
import { createTestResource, reservationRequest } from '../../test/fixtures';
import type { Reservation, Resource } from '../../types/reservation';

/*
 * End-to-end HTTP tests: Supertest drives the real Express app (routes, validation,
 * controllers, services, error middleware) against the in-memory MongoDB from src/test/setup.ts.
 */

const api = request(app);

const postReservation = (body: unknown) => api.post('/api/v1/reservations').send(body as object);

describe('POST /api/v1/reservations', () => {
  let resource: Resource;

  beforeEach(async () => {
    resource = await createTestResource();
  });

  it('returns 201 Created with the new PENDING reservation', async () => {
    const res = await postReservation(reservationRequest(resource.id));

    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      id: expect.stringMatching(/^[a-f0-9]{24}$/),
      resourceId: resource.id,
      userId: 'user-456',
      startTime: '2026-12-01T10:00:00.000Z',
      endTime: '2026-12-01T11:00:00.000Z',
      status: 'PENDING',
    });
  });

  it('returns 409 Conflict for an overlapping booking and stores nothing', async () => {
    await postReservation(reservationRequest(resource.id)).expect(201);

    const res = await postReservation(
      reservationRequest(resource.id, {
        userId: 'user-789',
        startTime: '2026-12-01T10:30:00Z',
        endTime: '2026-12-01T11:30:00Z',
      }),
    );

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      code: 'DOUBLE_BOOKING',
      message: 'Resource is already reserved for this time slot.',
    });
    expect(await ReservationModel.countDocuments()).toBe(1);
  });

  it('returns 201 for a back-to-back booking (end == next start)', async () => {
    await postReservation(reservationRequest(resource.id)).expect(201);

    await postReservation(
      reservationRequest(resource.id, {
        startTime: '2026-12-01T11:00:00Z',
        endTime: '2026-12-01T12:00:00Z',
      }),
    ).expect(201);
  });

  it('returns 409 RESOURCE_UNAVAILABLE for an unavailable resource', async () => {
    const closed = await createTestResource({ name: 'Study Room 105', isAvailable: false });

    const res = await postReservation(reservationRequest(closed.id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('RESOURCE_UNAVAILABLE');
  });

  it('returns 404 RESOURCE_NOT_FOUND for a resource that does not exist', async () => {
    const res = await postReservation(reservationRequest(new Types.ObjectId().toString()));

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
  });

  describe('payload fuzzing → 400 VALIDATION_ERROR, nothing stored', () => {
    const valid = (): Record<string, unknown> => ({ ...reservationRequest(resource.id) });
    const without = (field: string) => (): Record<string, unknown> => {
      const body = valid();
      delete body[field];
      return body;
    };
    const withField = (field: string, value: unknown) => (): Record<string, unknown> => ({
      ...valid(),
      [field]: value,
    });

    it.each<[string, () => unknown, string]>([
      ['an array body', () => [], 'Request body must be a JSON object.'],
      ['a string body', () => 'hello', 'Request body must be a JSON object.'],
      ['an empty object', () => ({}), 'resourceId is required and must be a non-empty string.'],
      ['an unknown extra field', withField('notes', 'x'), 'Unknown field(s): notes.'],
      ['a prototype-polluting field', withField('__proto__', { admin: true }), 'Unknown field'],
      ...(['resourceId', 'userId', 'startTime', 'endTime'] as const).flatMap(
        (field) =>
          [
            [
              `missing ${field}`,
              without(field),
              `${field} is required and must be a non-empty string.`,
            ],
            [
              `blank ${field}`,
              withField(field, '   '),
              `${field} is required and must be a non-empty string.`,
            ],
            [
              `numeric ${field}`,
              withField(field, 42),
              `${field} is required and must be a non-empty string.`,
            ],
            [
              `null ${field}`,
              withField(field, null),
              `${field} is required and must be a non-empty string.`,
            ],
          ] as [string, () => unknown, string][],
      ),
      [
        'a non-ObjectId resourceId',
        withField('resourceId', 'room-302'),
        'resourceId must be a 24-character',
      ],
      [
        'a 23-character resourceId',
        withField('resourceId', '0'.repeat(23)),
        'resourceId must be a 24-character',
      ],
      [
        'a date-only startTime',
        withField('startTime', '2026-12-01'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'a startTime without a timezone',
        withField('startTime', '2026-12-01T10:00:00'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'Feb 29 in a non-leap year',
        withField('startTime', '2026-02-29T10:00:00Z'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'April 31',
        withField('startTime', '2026-04-31T10:00:00Z'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'month 13',
        withField('startTime', '2026-13-01T10:00:00Z'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'hour 24 (rolls over to the next day)',
        withField('endTime', '2026-12-01T24:00:00Z'),
        'endTime must be a valid ISO 8601',
      ],
      [
        'an impossible date (Feb 30)',
        withField('startTime', '2026-02-30T10:00:00Z'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'an hour of 25',
        withField('startTime', '2026-12-01T25:00:00Z'),
        'startTime must be a valid ISO 8601',
      ],
      [
        'a natural-language endTime',
        withField('endTime', 'tomorrow at noon'),
        'endTime must be a valid ISO 8601',
      ],
      [
        'a Unix timestamp string',
        withField('endTime', '1764590400'),
        'endTime must be a valid ISO 8601',
      ],
      [
        'endTime before startTime',
        withField('endTime', '2026-12-01T09:00:00Z'),
        'endTime must be after startTime.',
      ],
      [
        'endTime equal to startTime',
        withField('endTime', '2026-12-01T10:00:00.000Z'),
        'endTime must be after startTime.',
      ],
      [
        'a negative range across a timezone',
        withField('endTime', '2026-12-01T10:30:00+01:00'),
        'endTime must be after startTime.',
      ],
    ])('rejects %s', async (_label, makeBody, message) => {
      const res = await postReservation(makeBody());

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain(message);
      expect(await ReservationModel.countDocuments()).toBe(0);
    });

    it('accepts Feb 29 in a leap year', async () => {
      await postReservation(
        reservationRequest(resource.id, {
          startTime: '2028-02-29T10:00:00Z',
          endTime: '2028-02-29T11:00:00Z',
        }),
      ).expect(201);
    });

    it('rejects malformed JSON before reaching the route', async () => {
      const res = await api
        .post('/api/v1/reservations')
        .set('Content-Type', 'application/json')
        .send('{"resourceId": ');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Request body must be valid JSON.',
      });
    });
  });
});

describe('GET /api/v1/resources', () => {
  beforeEach(async () => {
    await createTestResource({ name: 'Study Room 302' });
    await createTestResource({ name: 'Study Room 105', isAvailable: false });
    await createTestResource({ name: '3D Printer A', type: 'EQUIPMENT' });
    await createTestResource({ name: 'Chemistry Lab B', type: 'LAB' });
  });

  const namesFor = async (query: string): Promise<string[]> => {
    const res = await api.get(`/api/v1/resources${query}`).expect(200);
    return (res.body as Resource[]).map((r) => r.name);
  };

  it.each([
    ['', ['3D Printer A', 'Chemistry Lab B', 'Study Room 105', 'Study Room 302']],
    ['?type=ROOM', ['Study Room 105', 'Study Room 302']],
    ['?type=LAB', ['Chemistry Lab B']],
    ['?isAvailable=false', ['Study Room 105']],
    ['?type=ROOM&isAvailable=true', ['Study Room 302']],
    ['?type=STUDY_ROOM', []],
    ['?type=room', []],
  ])('returns 200 OK with the matching resources for "%s"', async (query, expected) => {
    expect(await namesFor(query)).toEqual(expected);
  });

  it('returns resources in the API shape', async () => {
    const res = await api.get('/api/v1/resources?type=LAB').expect(200);

    expect(res.body).toEqual([
      {
        id: expect.stringMatching(/^[a-f0-9]{24}$/),
        name: 'Chemistry Lab B',
        type: 'LAB',
        location: 'Snell Library, Floor 3',
        isAvailable: true,
      },
    ]);
  });

  it.each([
    ['?type=', 'type must be a non-empty string when provided.'],
    ['?type=ROOM&type=LAB', 'type must be a non-empty string when provided.'],
    ['?isAvailable=yes', 'isAvailable must be "true" or "false" when provided.'],
    ['?isAvailable=TRUE', 'isAvailable must be "true" or "false" when provided.'],
    ['?isAvailable=1', 'isAvailable must be "true" or "false" when provided.'],
  ])('returns 400 for "%s"', async (query, message) => {
    const res = await api.get(`/api/v1/resources${query}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR', message });
  });
});

describe('GET /api/v1/reservations/user/:userId', () => {
  it('returns 200 with the user’s active reservations only', async () => {
    const resource = await createTestResource();
    const kept = await postReservation(reservationRequest(resource.id)).expect(201);
    const cancelled = await postReservation(
      reservationRequest(resource.id, {
        startTime: '2026-12-01T12:00:00Z',
        endTime: '2026-12-01T13:00:00Z',
      }),
    ).expect(201);
    await api.patch(`/api/v1/reservations/${cancelled.body.id}/cancel`).expect(200);

    const res = await api.get('/api/v1/reservations/user/user-456').expect(200);

    expect((res.body as Reservation[]).map((r) => r.id)).toEqual([kept.body.id]);
  });

  it('returns 200 [] for an unknown user', async () => {
    await api.get('/api/v1/reservations/user/nobody').expect(200, []);
  });

  it('decodes URL-encoded user ids', async () => {
    const resource = await createTestResource();
    await postReservation(reservationRequest(resource.id, { userId: 'jane doe' })).expect(201);

    const res = await api.get('/api/v1/reservations/user/jane%20doe').expect(200);

    expect(res.body).toHaveLength(1);
  });

  it('returns 400 for a blank userId', async () => {
    const res = await api.get('/api/v1/reservations/user/%20');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('userId must be a non-empty string.');
  });
});

describe('PATCH /api/v1/reservations/:id/cancel and /confirm', () => {
  let reservationId: string;

  beforeEach(async () => {
    const resource = await createTestResource();
    const res = await postReservation(reservationRequest(resource.id)).expect(201);
    reservationId = res.body.id;
  });

  const patch = (action: 'cancel' | 'confirm', id = reservationId) =>
    api.patch(`/api/v1/reservations/${id}/${action}`);

  it('confirms, then cancels, returning the updated reservation each time', async () => {
    expect((await patch('confirm').expect(200)).body.status).toBe('CONFIRMED');
    expect((await patch('cancel').expect(200)).body.status).toBe('CANCELLED');
  });

  it.each<['cancel' | 'confirm', 'cancel' | 'confirm']>([
    ['cancel', 'cancel'],
    ['cancel', 'confirm'],
    ['confirm', 'confirm'],
  ])('returns 409 INVALID_STATUS_TRANSITION for %s then %s', async (first, second) => {
    await patch(first).expect(200);

    const res = await patch(second);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it.each(['cancel', 'confirm'] as const)(
    'returns 404 when %sing a missing reservation',
    async (action) => {
      const res = await patch(action, new Types.ObjectId().toString());

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('RESERVATION_NOT_FOUND');
    },
  );

  it.each(['not-an-id', '0'.repeat(25), 'zzzzzzzzzzzzzzzzzzzzzzzz'])(
    'returns 400 for the malformed id %j',
    async (id) => {
      const res = await patch('cancel', id);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('id must be a 24-character hexadecimal ObjectId.');
    },
  );

  it('frees the slot: a cancelled reservation’s time can be booked again', async () => {
    await patch('cancel').expect(200);
    const resourceId = (await ReservationModel.findById(
      reservationId,
    ).exec())!.resourceId.toString();

    await postReservation(reservationRequest(resourceId, { userId: 'user-789' })).expect(201);
  });
});

describe('cross-cutting behavior', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/v1/health returns 200 ok', async () => {
    const res = await api.get('/api/v1/health').expect(200);

    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('returns 404 ROUTE_NOT_FOUND for an unknown route', async () => {
    await api
      .delete('/api/v1/reservations')
      .expect(404, { code: 'ROUTE_NOT_FOUND', message: 'Cannot DELETE /api/v1/reservations' });
  });

  it('turns an unexpected error into a generic 500 without leaking details', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(ResourceModel, 'find').mockImplementation(() => {
      throw new Error('connection reset by peer (secret-host:27017)');
    });

    const res = await api.get('/api/v1/resources');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
    expect(JSON.stringify(res.body)).not.toContain('secret-host');
  });

  it('turns a rejected database promise into a 500 (Express 5 forwards async errors)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(ReservationModel, 'exists').mockReturnValue({
      exec: () => Promise.reject(new Error('timeout')),
    } as unknown as ReturnType<typeof ReservationModel.exists>);
    const resource = await createTestResource();

    const res = await postReservation(reservationRequest(resource.id));

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
