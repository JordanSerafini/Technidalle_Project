import { createEvent, updateEvent, mapDbEventToAppEvent } from '../services/eventsService';

describe('eventsService', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it('creates an event', async () => {
    const dbEvent = {
      id: 1,
      title: 'Test',
      event_type: 'appel_telephonique',
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: '2024-01-01T01:00:00.000Z',
    } as any;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => dbEvent,
    });

    const result = await createEvent({ ...dbEvent, id: undefined });
    expect(fetch).toHaveBeenCalled();
    expect(result).toEqual(mapDbEventToAppEvent(dbEvent));
  });

  it('updateEvent returns false on error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    const res = await updateEvent('1', { title: 'X' });
    expect(res).toBe(false);
  });
});
