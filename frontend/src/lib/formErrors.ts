import type { FormInstance } from 'antd';

import { toApiError } from './apiError';

/**
 * Pushes server-side validation errors onto the matching Form fields.
 *
 * The backend returns `fieldErrors` keyed by DTO field name, which matches the
 * `name` of the corresponding Form.Item, so the mapping is direct and the message
 * appears under the offending input instead of in a toast.
 *
 * Returns true when the error was consumed, so the caller can decide whether it
 * still needs to show a general message.
 */
export function applyFieldErrors(form: FormInstance, error: unknown): boolean {
  const fieldErrors = toApiError(error)?.fieldErrors;
  if (!fieldErrors) {
    return false;
  }

  const fields = Object.entries(fieldErrors).map(([name, message]) => ({
    name,
    errors: [message],
  }));

  if (fields.length === 0) {
    return false;
  }

  form.setFields(fields);
  return true;
}
