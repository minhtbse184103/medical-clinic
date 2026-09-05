import { apiClient } from './client';
import type {
  AvailableSlots,
  Doctor,
  DoctorQuery,
  DoctorSchedule,
  PageResponse,
} from '../types/api';

export const doctorsApi = {
  async list(query: DoctorQuery): Promise<PageResponse<Doctor>> {
    const { data } = await apiClient.get<PageResponse<Doctor>>('/api/v1/doctors', {
      // Axios drops undefined params, so blank filters are simply not sent.
      params: {
        page: query.page,
        size: query.size,
        specialty: query.specialty || undefined,
        name: query.name || undefined,
      },
    });
    return data;
  },

  async get(doctorId: number): Promise<Doctor> {
    const { data } = await apiClient.get<Doctor>(`/api/v1/doctors/${doctorId}`);
    return data;
  },

  async schedules(doctorId: number): Promise<DoctorSchedule[]> {
    const { data } = await apiClient.get<DoctorSchedule[]>(
      `/api/v1/doctors/${doctorId}/schedules`,
    );
    return data;
  },

  /** `date` must be yyyy-MM-dd. A past date returns an empty slot list. */
  async availableSlots(doctorId: number, date: string): Promise<AvailableSlots> {
    const { data } = await apiClient.get<AvailableSlots>(
      `/api/v1/doctors/${doctorId}/available-slots`,
      { params: { date } },
    );
    return data;
  },
};
