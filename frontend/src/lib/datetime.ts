import dayjs, { type Dayjs } from 'dayjs';

/** The backend serialises LocalDate as yyyy-MM-dd. */
export const API_DATE_FORMAT = 'YYYY-MM-DD';

export const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY';

/** Ant Design pickers hand back a Dayjs; the API expects the plain date string. */
export const toApiDate = (value: Dayjs): string => value.format(API_DATE_FORMAT);

export const formatDate = (value: string): string => dayjs(value).format(DISPLAY_DATE_FORMAT);

export const formatDateTime = (value: string): string =>
  dayjs(value).format(`${DISPLAY_DATE_FORMAT} HH:mm`);

/** LocalTime arrives as "HH:mm:ss"; screens only ever show hours and minutes. */
export const formatTime = (value: string): string => value.slice(0, 5);

/**
 * For DatePicker's `disabledDate`. Booking a past date is rejected by the backend with
 * APPOINTMENT_TIME_PASSED, so the UI blocks it up front rather than showing the error.
 */
export const isPastDate = (value: Dayjs): boolean => value.isBefore(dayjs().startOf('day'));
