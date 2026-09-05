import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { errorCode, errorMessage, toApiError } from './apiError';
import type { ApiErrorResponse } from '../types/api';

function axiosErrorWith(data: unknown, status = 400): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    data,
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

const apiError: ApiErrorResponse = {
  timestamp: '2026-09-05T10:00:00',
  status: 409,
  error: 'Conflict',
  code: 'APPOINTMENT_SLOT_ALREADY_BOOKED',
  message: 'Khung giờ đã có người đặt.',
  path: '/api/v1/appointments',
  fieldErrors: null,
};

describe('toApiError', () => {
  it('recognises the backend error shape', () => {
    expect(toApiError(axiosErrorWith(apiError, 409))).toEqual(apiError);
  });

  it('ignores a response body that is not an ApiErrorResponse', () => {
    expect(toApiError(axiosErrorWith({ something: 'else' }))).toBeNull();
    expect(toApiError(axiosErrorWith('<html>502 Bad Gateway</html>'))).toBeNull();
  });

  it('returns null for a network failure, which carries no response', () => {
    expect(toApiError(new AxiosError('Network Error'))).toBeNull();
  });

  it('returns null for anything that is not an axios error', () => {
    expect(toApiError(new Error('boom'))).toBeNull();
    expect(toApiError('boom')).toBeNull();
  });
});

describe('errorCode', () => {
  it('exposes the stable code so callers can branch on it', () => {
    expect(errorCode(axiosErrorWith(apiError, 409))).toBe('APPOINTMENT_SLOT_ALREADY_BOOKED');
  });

  it('is null when there is no API error to read', () => {
    expect(errorCode(new AxiosError('Network Error'))).toBeNull();
  });
});

describe('errorMessage', () => {
  it('prefers the message the backend sent', () => {
    expect(errorMessage(axiosErrorWith(apiError, 409))).toBe('Khung giờ đã có người đặt.');
  });

  /**
   * A CORS block or a stopped server produces no response, and the fallback is what the
   * user sees; it must not read as though the request was understood and rejected.
   */
  it('falls back when the server could not be reached', () => {
    expect(errorMessage(new AxiosError('Network Error'))).toContain('Không kết nối được máy chủ');
  });

  it('accepts a caller-supplied fallback', () => {
    expect(errorMessage(new AxiosError('Network Error'), 'Tùy chỉnh')).toBe('Tùy chỉnh');
  });
});
