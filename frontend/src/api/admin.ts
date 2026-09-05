import { apiClient } from './client';
import type {
  CreateDoctorRequest,
  CreateDoctorResponse,
  CreateReceptionistRequest,
  DoctorSchedule,
  DoctorScheduleRequest,
  PageResponse,
  Staff,
  StaffQuery,
} from '../types/api';

export const adminApi = {
  /** Creates the User and the Doctor profile in one transaction. */
  async createDoctor(request: CreateDoctorRequest): Promise<CreateDoctorResponse> {
    const { data } = await apiClient.post<CreateDoctorResponse>('/api/v1/admin/doctors', request);
    return data;
  },

  /** A Receptionist is only a User; the role needs no profile table in the MVP. */
  async createReceptionist(request: CreateReceptionistRequest): Promise<Staff> {
    const { data } = await apiClient.post<Staff>('/api/v1/admin/receptionists', request);
    return data;
  },

  /** Lists DOCTOR and RECEPTIONIST users only; patients and admins are never returned. */
  async staff(query: StaffQuery): Promise<PageResponse<Staff>> {
    const { data } = await apiClient.get<PageResponse<Staff>>('/api/v1/admin/staff', {
      params: {
        page: query.page,
        size: query.size,
        role: query.role || undefined,
        status: query.status || undefined,
      },
    });
    return data;
  },

  /** Status changes instead of deletion, so historical records stay intact. */
  async activate(userId: number): Promise<Staff> {
    const { data } = await apiClient.post<Staff>(`/api/v1/admin/users/${userId}/activate`);
    return data;
  },

  async deactivate(userId: number): Promise<Staff> {
    const { data } = await apiClient.post<Staff>(`/api/v1/admin/users/${userId}/deactivate`);
    return data;
  },

  async createSchedule(doctorId: number, request: DoctorScheduleRequest): Promise<DoctorSchedule> {
    const { data } = await apiClient.post<DoctorSchedule>(
      `/api/v1/doctors/${doctorId}/schedules`,
      request,
    );
    return data;
  },

  async updateSchedule(
    doctorId: number,
    scheduleId: number,
    request: DoctorScheduleRequest,
  ): Promise<DoctorSchedule> {
    const { data } = await apiClient.put<DoctorSchedule>(
      `/api/v1/doctors/${doctorId}/schedules/${scheduleId}`,
      request,
    );
    return data;
  },

  /**
   * Hard-deletes the weekly schedule, which is future configuration rather than history.
   * Rejected with 409 when the slot still covers a PENDING or CONFIRMED appointment.
   */
  async deleteSchedule(doctorId: number, scheduleId: number): Promise<void> {
    await apiClient.delete(`/api/v1/doctors/${doctorId}/schedules/${scheduleId}`);
  },
};
