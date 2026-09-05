import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import type { FormInstance } from 'antd';

import { applyFieldErrors } from './formErrors';
import type { ApiErrorResponse } from '../types/api';

function validationError(fieldErrors: Record<string, string> | null): AxiosError {
  const body: ApiErrorResponse = {
    timestamp: '2026-09-05T10:00:00',
    status: 400,
    error: 'Bad Request',
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu không hợp lệ.',
    path: '/api/v1/auth/register',
    fieldErrors,
  };

  const error = new AxiosError('Request failed');
  error.response = {
    data: body,
    status: 400,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

function fakeForm() {
  return { setFields: vi.fn() } as unknown as FormInstance & { setFields: ReturnType<typeof vi.fn> };
}

describe('applyFieldErrors', () => {
  /**
   * The backend keys fieldErrors by DTO field name, which matches the Form.Item name,
   * so each message lands under the offending input instead of in a toast.
   */
  it('maps every field error onto its matching form field', () => {
    const form = fakeForm();

    const handled = applyFieldErrors(
      form,
      validationError({ email: 'Email không hợp lệ.', password: 'Mật khẩu tối thiểu 8 ký tự.' }),
    );

    expect(handled).toBe(true);
    expect(form.setFields).toHaveBeenCalledWith([
      { name: 'email', errors: ['Email không hợp lệ.'] },
      { name: 'password', errors: ['Mật khẩu tối thiểu 8 ký tự.'] },
    ]);
  });

  it('reports the error as unhandled when there are no field errors', () => {
    const form = fakeForm();

    // A 409 conflict, for example, has a message but nothing to attach to a field.
    expect(applyFieldErrors(form, validationError(null))).toBe(false);
    expect(form.setFields).not.toHaveBeenCalled();
  });

  it('reports an empty field error map as unhandled', () => {
    const form = fakeForm();

    expect(applyFieldErrors(form, validationError({}))).toBe(false);
    expect(form.setFields).not.toHaveBeenCalled();
  });

  it('reports a network failure as unhandled so the caller shows a banner', () => {
    const form = fakeForm();

    expect(applyFieldErrors(form, new AxiosError('Network Error'))).toBe(false);
    expect(form.setFields).not.toHaveBeenCalled();
  });
});
