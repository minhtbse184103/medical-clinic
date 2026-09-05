import { describe, expect, it, vi, afterEach } from 'vitest';

import { buildSessions, sessionCapacity, slotStartsWithin } from './slots';
import type { AvailableSlot, DoctorSchedule } from '../types/api';

function schedule(startTime: string, endTime: string, scheduleId = 1): DoctorSchedule {
  return {
    scheduleId,
    doctorId: 1,
    dayOfWeek: 'MONDAY',
    startTime,
    endTime,
    createdAt: '2026-09-05T00:00:00',
  };
}

const free = (...times: string[]): AvailableSlot[] =>
  times.map((startTime) => ({ startTime, endTime: startTime }));

afterEach(() => {
  vi.useRealTimers();
});

describe('slotStartsWithin', () => {
  /** Matches what the backend generates: 08:00-15:30 is fifteen 30-minute visits. */
  it('divides a window into 30-minute starts', () => {
    expect(slotStartsWithin('08:00:00', '15:30:00')).toHaveLength(15);
    expect(slotStartsWithin('08:00:00', '15:30:00')[0]).toBe('08:00:00');
    expect(slotStartsWithin('08:00:00', '15:30:00').at(-1)).toBe('15:00:00');
  });

  it('never produces a slot that would end after the window', () => {
    // 08:00-09:20 is 80 minutes: two full visits, and the leftover 20 minutes is not a slot.
    expect(slotStartsWithin('08:00:00', '09:20:00')).toEqual(['08:00:00', '08:30:00']);
  });

  it('returns nothing for a window shorter than one visit', () => {
    expect(slotStartsWithin('08:00:00', '08:20:00')).toEqual([]);
  });
});

describe('sessionCapacity', () => {
  it('counts the visits a shift holds', () => {
    expect(sessionCapacity(schedule('08:00:00', '11:30:00'))).toBe(7);
    expect(sessionCapacity(schedule('13:30:00', '17:00:00'))).toBe(7);
  });
});

describe('buildSessions', () => {
  it('keeps a booked slot visible instead of dropping it', () => {
    const sessions = buildSessions(
      [schedule('08:00:00', '10:00:00')],
      free('08:00:00', '09:00:00', '09:30:00'),
      '2026-09-07',
    );

    // The API returns only free slots; 08:30 is missing, so it is taken.
    expect(sessions[0].slots).toEqual([
      { startTime: '08:00:00', state: 'available' },
      { startTime: '08:30:00', state: 'taken' },
      { startTime: '09:00:00', state: 'available' },
      { startTime: '09:30:00', state: 'available' },
    ]);
  });

  /**
   * On today the API also omits slots whose time has passed. Marking those as taken would
   * tell the patient someone booked them, which is a different thing entirely.
   */
  it('separates slots already gone by today from slots someone booked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T09:10:00'));

    const sessions = buildSessions(
      [schedule('08:00:00', '11:00:00')],
      free('09:30:00', '10:30:00'),
      '2026-09-07',
    );

    expect(sessions[0].slots.map((slot) => slot.state)).toEqual([
      'past', // 08:00, its time has gone
      'past', // 08:30, its time has gone
      'past', // 09:00, started ten minutes ago
      'available', // 09:30
      'taken', // 10:00 is still ahead yet absent, so someone booked it
      'available', // 10:30
    ]);
  });

  it('treats a future date as having no past slots', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T09:10:00'));

    const sessions = buildSessions([schedule('08:00:00', '09:00:00')], [], '2026-09-14');

    expect(sessions[0].slots.every((slot) => slot.state === 'taken')).toBe(true);
  });

  it('orders the sessions of a day by start time', () => {
    const sessions = buildSessions(
      [schedule('13:30:00', '17:00:00', 2), schedule('08:00:00', '11:30:00', 1)],
      [],
      '2026-09-07',
    );

    expect(sessions.map((session) => session.scheduleId)).toEqual([1, 2]);
    expect(sessions.map((session) => session.capacity)).toEqual([7, 7]);
  });

  it('returns nothing when the doctor does not work that day', () => {
    expect(buildSessions([], [], '2026-09-07')).toEqual([]);
  });
});
