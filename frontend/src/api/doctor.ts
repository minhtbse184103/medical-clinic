import { apiClient } from './client';
import type {
  CreateMedicalRecordRequest,
  CreatePrescriptionRequest,
  DoctorAppointment,
  DoctorAppointmentQuery,
  DoctorPatientMedicalRecordPage,
  DoctorProfile,
  MedicalRecord,
  Medicine,
  MedicineQuery,
  PageResponse,
  Prescription,
  PrescriptionView,
  UpdateDoctorProfileRequest,
} from '../types/api';

export const doctorApi = {
  async profile(): Promise<DoctorProfile> {
    const { data } = await apiClient.get<DoctorProfile>('/api/v1/doctors/me');
    return data;
  },

  /** Specialty and licence number are not editable here; they stay under ADMIN control. */
  async updateProfile(request: UpdateDoctorProfileRequest): Promise<DoctorProfile> {
    const { data } = await apiClient.put<DoctorProfile>('/api/v1/doctors/me', request);
    return data;
  },

  /** The doctor identity comes from the JWT; results are ordered by date and start time. */
  async appointments(query: DoctorAppointmentQuery): Promise<PageResponse<DoctorAppointment>> {
    const { data } = await apiClient.get<PageResponse<DoctorAppointment>>(
      '/api/v1/doctor/appointments',
      {
        params: {
          page: query.page,
          size: query.size,
          date: query.date || undefined,
          status: query.status || undefined,
        },
      },
    );
    return data;
  },

  /**
   * Creates the Medical Record and moves the Appointment to COMPLETED in one transaction.
   * Requires a CONFIRMED appointment whose start time has passed and which has no record yet.
   */
  async createMedicalRecord(
    appointmentId: number,
    request: CreateMedicalRecordRequest,
  ): Promise<MedicalRecord> {
    const { data } = await apiClient.post<MedicalRecord>(
      `/api/v1/appointments/${appointmentId}/medical-record`,
      request,
    );
    return data;
  },

  /** At most one Prescription per Medical Record; a second attempt is a 409. */
  async createPrescription(
    medicalRecordId: number,
    request: CreatePrescriptionRequest,
  ): Promise<Prescription> {
    const { data } = await apiClient.post<Prescription>(
      `/api/v1/medical-records/${medicalRecordId}/prescription`,
      request,
    );
    return data;
  },

  async prescription(medicalRecordId: number): Promise<PrescriptionView> {
    const { data } = await apiClient.get<PrescriptionView>(
      `/api/v1/medical-records/${medicalRecordId}/prescription`,
    );
    return data;
  },

  async medicines(query: MedicineQuery): Promise<PageResponse<Medicine>> {
    const { data } = await apiClient.get<PageResponse<Medicine>>('/api/v1/medicines', {
      params: {
        page: query.page,
        size: query.size,
        name: query.name || undefined,
        active: query.active,
      },
    });
    return data;
  },

  /**
   * Access is granted only when at least one Appointment exists between this Doctor and
   * the Patient; the DOCTOR role on its own is not enough.
   */
  async patientMedicalRecords(
    patientId: number,
    page: number,
    size: number,
  ): Promise<DoctorPatientMedicalRecordPage> {
    const { data } = await apiClient.get<DoctorPatientMedicalRecordPage>(
      `/api/v1/doctor/patients/${patientId}/medical-records`,
      { params: { page, size } },
    );
    return data;
  },
};
