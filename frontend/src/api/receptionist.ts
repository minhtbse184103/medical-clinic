import { apiClient } from './client';
import type {
  Appointment,
  ConfirmAppointmentResponse,
  CreateReceptionistAppointmentRequest,
  PageResponse,
  ReceptionistAppointment,
  ReceptionistAppointmentQuery,
  ReceptionistPatient,
  ReceptionistPatientQuery,
} from '../types/api';

export const receptionistApi = {
  async appointments(
    query: ReceptionistAppointmentQuery,
  ): Promise<PageResponse<ReceptionistAppointment>> {
    const { data } = await apiClient.get<PageResponse<ReceptionistAppointment>>(
      '/api/v1/receptionist/appointments',
      {
        params: {
          page: query.page,
          size: query.size,
          date: query.date || undefined,
          doctorId: query.doctorId ?? undefined,
          patientId: query.patientId ?? undefined,
          status: query.status || undefined,
        },
      },
    );
    return data;
  },

  /** Only PENDING appointments can be confirmed; anything else is a 409. */
  async confirm(appointmentId: number): Promise<ConfirmAppointmentResponse> {
    const { data } = await apiClient.post<ConfirmAppointmentResponse>(
      `/api/v1/appointments/${appointmentId}/confirm`,
    );
    return data;
  },

  /** Same cancellable statuses as the patient flow, but without the 2-hour deadline. */
  async cancel(appointmentId: number, reason: string): Promise<void> {
    await apiClient.post(`/api/v1/receptionist/appointments/${appointmentId}/cancel`, { reason });
  },

  async searchPatients(
    query: ReceptionistPatientQuery,
  ): Promise<PageResponse<ReceptionistPatient>> {
    const { data } = await apiClient.get<PageResponse<ReceptionistPatient>>(
      '/api/v1/receptionist/patients',
      {
        params: {
          page: query.page,
          size: query.size,
          name: query.name || undefined,
          phone: query.phone || undefined,
        },
      },
    );
    return data;
  },

  async bookForPatient(request: CreateReceptionistAppointmentRequest): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>(
      '/api/v1/receptionist/appointments',
      request,
    );
    return data;
  },
};
