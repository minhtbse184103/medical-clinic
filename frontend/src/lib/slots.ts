import dayjs from 'dayjs';

import type { AvailableSlot, DoctorSchedule } from '../types/api';

export const SLOT_MINUTES = 30;

export interface SlotView {
  /** HH:mm:ss, exactly as the API expects it back. */
  startTime: string;
  state: 'available' | 'taken' | 'past';
}

export interface SessionView {
  scheduleId: number;
  startTime: string;
  endTime: string;
  /** How many 30-minute visits the session holds. */
  capacity: number;
  slots: SlotView[];
}

/** Every 30-minute start time a schedule window contains. */
export function slotStartsWithin(startTime: string, endTime: string): string[] {
  const starts: string[] = [];
  let cursor = dayjs(`2000-01-01T${startTime}`);
  const end = dayjs(`2000-01-01T${endTime}`);

  while (cursor.add(SLOT_MINUTES, 'minute').isBefore(end.add(1, 'second'))) {
    starts.push(cursor.format('HH:mm:ss'));
    cursor = cursor.add(SLOT_MINUTES, 'minute');
  }

  return starts;
}

export const sessionCapacity = (schedule: DoctorSchedule): number =>
  slotStartsWithin(schedule.startTime, schedule.endTime).length;

/**
 * Builds the full grid for a day and marks each slot.
 *
 * The API returns only what is free, so a booked slot would otherwise be invisible and the
 * day would look emptier than it is. Anything in the schedule but missing from the response
 * is taken, except on today, where the API also drops slots whose time has passed.
 */
export function buildSessions(
  schedules: DoctorSchedule[],
  available: AvailableSlot[],
  date: string,
): SessionView[] {
  const free = new Set(available.map((slot) => slot.startTime));
  const isToday = date === dayjs().format('YYYY-MM-DD');
  const now = dayjs().format('HH:mm:ss');

  return [...schedules]
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((schedule) => ({
      scheduleId: schedule.scheduleId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      capacity: sessionCapacity(schedule),
      slots: slotStartsWithin(schedule.startTime, schedule.endTime).map((startTime) => ({
        startTime,
        state: free.has(startTime)
          ? ('available' as const)
          : isToday && startTime <= now
            ? ('past' as const)
            : ('taken' as const),
      })),
    }));
}
