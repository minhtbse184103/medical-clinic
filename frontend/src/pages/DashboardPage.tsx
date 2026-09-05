import { Space, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAuth } from '../auth/useAuth';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { DoctorDashboard } from './dashboard/DoctorDashboard';
import { PatientDashboard } from './dashboard/PatientDashboard';
import { ReceptionistDashboard } from './dashboard/ReceptionistDashboard';

function greeting(hour: number): string {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // ADMIN and RECEPTIONIST have no profile table, so fullName is null for them.
  const displayName = user.fullName ?? user.email;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* The name, role and avatar live in the layout header; repeating them here would
          show the same identity twice on the one screen that has its own heading. */}
      <div>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          {greeting(dayjs().hour())}, {displayName}
        </Typography.Title>
        <Typography.Text type="secondary">{dayjs().format('dddd, DD/MM/YYYY')}</Typography.Text>
      </div>

      {user.role === 'PATIENT' && <PatientDashboard />}
      {user.role === 'DOCTOR' && <DoctorDashboard />}
      {user.role === 'RECEPTIONIST' && <ReceptionistDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </Space>
  );
}
