import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { AdminSchedulesPage } from './pages/AdminSchedulesPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorAppointmentsPage } from './pages/DoctorAppointmentsPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import { DoctorExaminationPage } from './pages/DoctorExaminationPage';
import { DoctorListPage } from './pages/DoctorListPage';
import { DoctorPatientHistoryPage } from './pages/DoctorPatientHistoryPage';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { LoginPage } from './pages/LoginPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PatientMedicalRecordsPage } from './pages/PatientMedicalRecordsPage';
import { PatientPrescriptionsPage } from './pages/PatientPrescriptionsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { ReceptionistAppointmentsPage } from './pages/ReceptionistAppointmentsPage';
import { ReceptionistBookingPage } from './pages/ReceptionistBookingPage';
import { RegisterPage } from './pages/RegisterPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
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
  { path: '*', element: <NotFoundPage /> },
]);
