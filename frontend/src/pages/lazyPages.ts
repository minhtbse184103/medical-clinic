import { lazy } from 'react';

/*
 * Pages are loaded on demand, so a signed-in user downloads only the screens their role
 * can reach. The pages use named exports, hence the mapping to `default` that lazy() wants.
 *
 * They live here rather than in router.tsx so that file exports only the route tree, and
 * this one exports only components.
 */

export const LoginPage = lazy(() =>
  import('./LoginPage').then((m) => ({ default: m.LoginPage })),
);
export const RegisterPage = lazy(() =>
  import('./RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
export const DashboardPage = lazy(() =>
  import('./DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
export const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export const DoctorListPage = lazy(() =>
  import('./DoctorListPage').then((m) => ({ default: m.DoctorListPage })),
);
export const DoctorDetailPage = lazy(() =>
  import('./DoctorDetailPage').then((m) => ({ default: m.DoctorDetailPage })),
);

export const MyAppointmentsPage = lazy(() =>
  import('./MyAppointmentsPage').then((m) => ({ default: m.MyAppointmentsPage })),
);
export const PatientMedicalRecordsPage = lazy(() =>
  import('./PatientMedicalRecordsPage').then((m) => ({ default: m.PatientMedicalRecordsPage })),
);
export const PatientPrescriptionsPage = lazy(() =>
  import('./PatientPrescriptionsPage').then((m) => ({ default: m.PatientPrescriptionsPage })),
);
export const PatientProfilePage = lazy(() =>
  import('./PatientProfilePage').then((m) => ({ default: m.PatientProfilePage })),
);

export const DoctorAppointmentsPage = lazy(() =>
  import('./DoctorAppointmentsPage').then((m) => ({ default: m.DoctorAppointmentsPage })),
);
export const DoctorExaminationPage = lazy(() =>
  import('./DoctorExaminationPage').then((m) => ({ default: m.DoctorExaminationPage })),
);
export const DoctorPatientHistoryPage = lazy(() =>
  import('./DoctorPatientHistoryPage').then((m) => ({ default: m.DoctorPatientHistoryPage })),
);
export const DoctorProfilePage = lazy(() =>
  import('./DoctorProfilePage').then((m) => ({ default: m.DoctorProfilePage })),
);

export const ReceptionistAppointmentsPage = lazy(() =>
  import('./ReceptionistAppointmentsPage').then((m) => ({
    default: m.ReceptionistAppointmentsPage,
  })),
);
export const ReceptionistBookingPage = lazy(() =>
  import('./ReceptionistBookingPage').then((m) => ({ default: m.ReceptionistBookingPage })),
);

export const AdminStaffPage = lazy(() =>
  import('./AdminStaffPage').then((m) => ({ default: m.AdminStaffPage })),
);
export const AdminSchedulesPage = lazy(() =>
  import('./AdminSchedulesPage').then((m) => ({ default: m.AdminSchedulesPage })),
);
