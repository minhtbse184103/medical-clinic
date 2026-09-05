import dayjs from 'dayjs';

import type { AppointmentStatus, DayOfWeek } from '../types/api';

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã khám',
  CANCELLED: 'Đã hủy',
};

export const APPOINTMENT_STATUS_COLOR: Record<AppointmentStatus, string> = {
  PENDING: 'gold',
  CONFIRMED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

/** COMPLETED and CANCELLED are terminal states, so only these two can still be cancelled. */
export const CANCELLABLE_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED'];

export const DAY_OF_WEEK_LABEL: Record<DayOfWeek, string> = {
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật',
};

/** Day.js day(): 0 = Sunday. Maps to the backend's java.time.DayOfWeek names. */
const DAY_BY_INDEX: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const dayOfWeekFromIndex = (index: number): DayOfWeek => DAY_BY_INDEX[index];

/**
 * A visit can be examined once it is CONFIRMED and its start time has passed, which is
 * exactly what MedicalRecordService requires. Checking it keeps the button off rows the
 * backend would refuse.
 */
export function isReadyToExamine(appointment: {
  status: AppointmentStatus;
  appointmentDate: string;
  startTime: string;
}): boolean {
  if (appointment.status !== 'CONFIRMED') {
    return false;
  }
  return !dayjs(`${appointment.appointmentDate}T${appointment.startTime}`).isAfter(dayjs());
}
