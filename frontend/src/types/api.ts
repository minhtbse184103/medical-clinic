/**
 * Types mirroring the backend DTOs used by the foundation layer.
 *
 * For the full contract, generate types from the live OpenAPI document instead of
 * writing them by hand: `npm run gen:api-types` (the backend must be running).
 */

export type Role = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** Every backend error, business or technical, uses this shape. */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  fieldErrors: Record<string, string> | null;
}

/** Shared shape of every paginated endpoint. `page` is 0-based, as Spring returns it. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/** Response of GET /api/v1/auth/me. fullName is null for ADMIN and RECEPTIONIST. */
export interface CurrentUser {
  userId: number;
  email: string;
  role: Role;
  status: UserStatus;
  fullName: string | null;
}

export interface RegisterPatientRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  /** ISO date, yyyy-MM-dd. */
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
}

export interface RegisterPatientResponse {
  patientId: number;
  userId: number;
  email: string;
  fullName: string;
  status: UserStatus;
}

/** Public doctor fields only: no email, license number or internal user data. */
export interface Doctor {
  doctorId: number;
  fullName: string;
  phone: string | null;
  specialty: string;
  bio: string | null;
}

/** A doctor's own profile: includes email and licence number, unlike the directory view. */
export interface DoctorProfile {
  doctorId: number;
  userId: number;
  email: string;
  fullName: string;
  phone: string | null;
  specialty: string;
  licenseNumber: string;
  bio: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Only what a doctor may maintain about themselves. Specialty and licence number are
 * practising credentials under ADMIN control and are not part of this request.
 */
export interface UpdateDoctorProfileRequest {
  fullName: string;
  phone?: string;
  bio?: string;
}

export interface DoctorQuery {
  page: number;
  size: number;
  specialty?: string;
  name?: string;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface DoctorSchedule {
  scheduleId: number;
  doctorId: number;
  dayOfWeek: DayOfWeek;
  /** HH:mm:ss */
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AvailableSlot {
  /** HH:mm:ss */
  startTime: string;
  endTime: string;
}

export interface AvailableSlots {
  doctorId: number;
  date: string;
  slotDurationMinutes: number;
  slots: AvailableSlot[];
}

export interface CreateAppointmentRequest {
  doctorId: number;
  /** yyyy-MM-dd */
  appointmentDate: string;
  /** HH:mm:ss, taken verbatim from an available slot. */
  startTime: string;
  reason: string;
}

export interface Appointment {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

/** GET /appointments/me exposes public doctor display fields alongside the appointment. */
export interface PatientAppointment {
  appointmentId: number;
  doctorId: number;
  doctorFullName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

/** Staff rows carry no name: `users` has none, and only DOCTOR has a profile table. */
export interface Staff {
  userId: number;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface StaffQuery {
  page: number;
  size: number;
  role?: Role;
  status?: UserStatus;
}

export interface CreateDoctorRequest {
  email: string;
  temporaryPassword: string;
  fullName: string;
  phone?: string;
  specialty: string;
  licenseNumber: string;
  bio?: string;
}

export interface CreateDoctorResponse {
  userId: number;
  doctorId: number;
  email: string;
  fullName: string;
  phone: string | null;
  specialty: string;
  licenseNumber: string;
  bio: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface CreateReceptionistRequest {
  email: string;
  temporaryPassword: string;
}

export interface DoctorScheduleRequest {
  dayOfWeek: DayOfWeek;
  /** HH:mm:ss, and startTime must be before endTime. */
  startTime: string;
  endTime: string;
}

export interface PatientProfile {
  patientId: number;
  userId: number;
  email: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePatientProfileRequest {
  fullName: string;
  phone?: string;
  /** yyyy-MM-dd, must not be in the future. */
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
}

/** The backend only accepts `createdAt` as the sort property for medical records. */
export type MedicalRecordSort = 'createdAt,asc' | 'createdAt,desc';

export interface PatientMedicalRecordQuery {
  page: number;
  size: number;
  sort?: MedicalRecordSort;
}

/** Same shape as PrescriptionView: medicine names are included for direct display. */
export interface PatientPrescription {
  prescriptionId: number;
  medicalRecordId: number;
  appointmentId: number;
  notes: string | null;
  details: PrescriptionMedicine[];
  createdAt: string;
}

/** GET /doctor/appointments exposes only what identifies the patient clinically. */
export interface DoctorAppointment {
  appointmentId: number;
  patientId: number;
  patientFullName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

export interface DoctorAppointmentQuery {
  page: number;
  size: number;
  date?: string;
  status?: AppointmentStatus;
}

export interface CreateMedicalRecordRequest {
  symptoms?: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
}

export interface MedicalRecord {
  medicalRecordId: number;
  appointmentId: number;
  symptoms: string | null;
  diagnosis: string;
  treatment: string | null;
  notes: string | null;
  createdAt: string;
}

/** GET /doctor/patients/{id}/medical-records wraps the page with the patient id. */
export interface DoctorPatientMedicalRecordPage {
  patientId: number;
  content: MedicalRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Medicine {
  medicineId: number;
  name: string;
  unit: string | null;
  description: string | null;
  active: boolean;
}

export interface MedicineQuery {
  page: number;
  size: number;
  name?: string;
  active?: boolean;
}

export interface CreatePrescriptionDetailRequest {
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instruction?: string;
}

export interface CreatePrescriptionRequest {
  notes?: string;
  items: CreatePrescriptionDetailRequest[];
}

export interface PrescriptionDetail {
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instruction: string | null;
}

export interface Prescription {
  prescriptionId: number;
  medicalRecordId: number;
  notes: string | null;
  details: PrescriptionDetail[];
  createdAt: string;
}

/** The read endpoint adds medicine names so a prescription renders without extra lookups. */
export interface PrescriptionMedicine {
  medicineId: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instruction: string | null;
}

export interface PrescriptionView {
  prescriptionId: number;
  medicalRecordId: number;
  appointmentId: number;
  notes: string | null;
  details: PrescriptionMedicine[];
  createdAt: string;
}

/** GET /receptionist/appointments carries both party names for the operations desk. */
export interface ReceptionistAppointment {
  appointmentId: number;
  patientId: number;
  patientFullName: string;
  doctorId: number;
  doctorFullName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

export interface ReceptionistAppointmentQuery {
  page: number;
  size: number;
  date?: string;
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
}

export interface ConfirmAppointmentResponse {
  appointmentId: number;
  status: AppointmentStatus;
  confirmedAt: string;
}

/** Enough to tell two similarly named patients apart; no email or internal User fields. */
export interface ReceptionistPatient {
  patientId: number;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
}

export interface ReceptionistPatientQuery {
  page: number;
  size: number;
  name?: string;
  phone?: string;
}

/** Unlike the patient booking request, this one names the patient explicitly. */
export interface CreateReceptionistAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  reason: string;
}

/** The backend only accepts `appointmentDate` as the sort property. */
export type AppointmentSort = 'appointmentDate,asc' | 'appointmentDate,desc';

export interface PatientAppointmentQuery {
  page: number;
  size: number;
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
  sort?: AppointmentSort;
}
