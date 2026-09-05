import { Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAuth } from '../auth/useAuth';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { DoctorDashboard } from './dashboard/DoctorDashboard';
import { PatientDashboard } from './dashboard/PatientDashboard';
import { ReceptionistDashboard } from './dashboard/ReceptionistDashboard';
import type { Role } from '../types/api';

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  PATIENT: 'Bệnh nhân',
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN: 'purple',
  DOCTOR: 'blue',
  RECEPTIONIST: 'orange',
  PATIENT: 'green',
};

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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {greeting(dayjs().hour())}, {displayName}
          </Typography.Title>
          <Tag color={ROLE_COLOR[user.role]}>{ROLE_LABEL[user.role]}</Tag>
        </Space>
        <Typography.Text type="secondary">
          Hôm nay là {dayjs().format('dddd, DD/MM/YYYY')}
        </Typography.Text>
      </div>

      {user.role === 'PATIENT' && <PatientDashboard />}
      {user.role === 'DOCTOR' && <DoctorDashboard />}
      {user.role === 'RECEPTIONIST' && <ReceptionistDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </Space>
  );
}
