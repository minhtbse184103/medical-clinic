import { apiClient } from './client';
import type {
  Appointment,
  CreateAppointmentRequest,
  PageResponse,
  PatientAppointment,
  PatientAppointmentQuery,
} from '../types/api';

export const appointmentsApi = {
  /** The patient identity comes from the JWT; the request never carries a patientId. */
  async book(request: CreateAppointmentRequest): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>('/api/v1/appointments', request);
    return data;
  },

  async mine(query: PatientAppointmentQuery): Promise<PageResponse<PatientAppointment>> {
    const { data } = await apiClient.get<PageResponse<PatientAppointment>>(
      '/api/v1/appointments/me',
      {
        params: {
          page: query.page,
          size: query.size,
          status: query.status || undefined,
          fromDate: query.fromDate || undefined,
          toDate: query.toDate || undefined,
          sort: query.sort ?? 'appointmentDate,desc',
        },
      },
    );
    return data;
  },

  /** Returns 200 with no body. Allowed for PENDING/CONFIRMED, at least 2 hours before the appointment. */
  async cancel(appointmentId: number, reason: string): Promise<void> {
    await apiClient.post(`/api/v1/appointments/${appointmentId}/cancel`, { reason });
  },
};
