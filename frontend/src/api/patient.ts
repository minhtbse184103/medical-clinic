import { apiClient } from './client';
import type {
  MedicalRecord,
  PageResponse,
  PatientMedicalRecordQuery,
  PatientPrescription,
  PatientProfile,
  PrescriptionView,
  UpdatePatientProfileRequest,
} from '../types/api';

/**
 * Every endpoint here derives the patient from the JWT. None of them accepts a patient id,
 * so one patient can never read another patient's data by changing a parameter.
 */
export const patientApi = {
  async profile(): Promise<PatientProfile> {
    const { data } = await apiClient.get<PatientProfile>('/api/v1/patients/me');
    return data;
  },

  async updateProfile(request: UpdatePatientProfileRequest): Promise<PatientProfile> {
    const { data } = await apiClient.put<PatientProfile>('/api/v1/patients/me', request);
    return data;
  },

  async medicalRecords(query: PatientMedicalRecordQuery): Promise<PageResponse<MedicalRecord>> {
    const { data } = await apiClient.get<PageResponse<MedicalRecord>>(
      '/api/v1/patients/me/medical-records',
      {
        params: {
          page: query.page,
          size: query.size,
          sort: query.sort ?? 'createdAt,desc',
        },
      },
    );
    return data;
  },

  async prescriptions(page: number, size: number): Promise<PageResponse<PatientPrescription>> {
    const { data } = await apiClient.get<PageResponse<PatientPrescription>>(
      '/api/v1/patients/me/prescriptions',
      { params: { page, size } },
    );
    return data;
  },

  /** Answers 404 when the visit produced no prescription, which is a normal outcome. */
  async prescriptionForRecord(medicalRecordId: number): Promise<PrescriptionView> {
    const { data } = await apiClient.get<PrescriptionView>(
      `/api/v1/medical-records/${medicalRecordId}/prescription`,
    );
    return data;
  },
};
