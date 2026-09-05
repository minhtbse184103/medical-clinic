import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { SuspendedPage } from './components/SuspendedPage';
import {
  AdminSchedulesPage,
  AdminStaffPage,
  DashboardPage,
  DoctorAppointmentsPage,
  DoctorDetailPage,
  DoctorExaminationPage,
  DoctorListPage,
  DoctorPatientHistoryPage,
  DoctorProfilePage,
  LoginPage,
  MyAppointmentsPage,
  NotFoundPage,
  PatientMedicalRecordsPage,
  PatientPrescriptionsPage,
  PatientProfilePage,
  ReceptionistAppointmentsPage,
  ReceptionistBookingPage,
  RegisterPage,
} from './pages/lazyPages';

/*
 * Every page is lazily loaded. AppLayout and ProtectedRoute stay eager: they render on
 * every route, so deferring them would only add a round trip before anything appears.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <SuspendedPage element={<LoginPage />} /> },
  { path: '/register', element: <SuspendedPage element={<RegisterPage />} /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        // AppLayout wraps its Outlet in Suspense, so nested pages need no wrapper here.
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },

          // Doctor discovery is open to every signed-in role, but booking and the
          // personal appointment list belong to PATIENT alone, matching the backend.
          { path: '/doctors', element: <DoctorListPage /> },
          { path: '/doctors/:doctorId', element: <DoctorDetailPage /> },
          {
            element: <ProtectedRoute allowedRoles={['PATIENT']} />,
            children: [
              { path: '/appointments', element: <MyAppointmentsPage /> },
              { path: '/medical-records', element: <PatientMedicalRecordsPage /> },
              { path: '/prescriptions', element: <PatientPrescriptionsPage /> },
              { path: '/profile', element: <PatientProfilePage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: '/admin/staff', element: <AdminStaffPage /> },
              { path: '/admin/schedules', element: <AdminSchedulesPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['DOCTOR']} />,
            children: [
              { path: '/doctor/appointments', element: <DoctorAppointmentsPage /> },
              {
                path: '/doctor/appointments/:appointmentId/examine',
                element: <DoctorExaminationPage />,
              },
              { path: '/doctor/patients/:patientId', element: <DoctorPatientHistoryPage /> },
              { path: '/doctor/profile', element: <DoctorProfilePage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['RECEPTIONIST']} />,
            children: [
              { path: '/receptionist/appointments', element: <ReceptionistAppointmentsPage /> },
              { path: '/receptionist/book', element: <ReceptionistBookingPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <SuspendedPage element={<NotFoundPage />} /> },
]);
