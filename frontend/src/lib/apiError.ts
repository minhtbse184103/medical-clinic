import axios from 'axios';

import type { ApiErrorResponse } from '../types/api';

/**
 * Narrows any thrown value to the backend error shape.
 *
 * The backend answers every failure with ApiErrorResponse, business and technical alike,
 * so one parser covers the whole API.
 */
export function toApiError(error: unknown): ApiErrorResponse | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data as Partial<ApiErrorResponse> | undefined;
  if (typeof data?.code === 'string' && typeof data.message === 'string') {
    return data as ApiErrorResponse;
  }

  return null;
}

/** Stable error code (for example APPOINTMENT_SLOT_ALREADY_BOOKED), or null. */
export function errorCode(error: unknown): string | null {
  return toApiError(error)?.code ?? null;
}

/** Message safe to display. Falls back when the server is unreachable. */
export function errorMessage(
  error: unknown,
  fallback = 'Không kết nối được máy chủ. Vui lòng thử lại.',
): string {
  return toApiError(error)?.message ?? fallback;
}
