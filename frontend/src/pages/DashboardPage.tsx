import { Avatar, Flex, Space, Tag, Typography } from 'antd';
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

/** Two letters from the display name, falling back to the first of an email address. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

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
      <Flex align="center" justify="space-between" gap={16} wrap>
        <div>
          <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            {greeting(dayjs().hour())}
          </Typography.Title>
          <Typography.Text type="secondary">
            {dayjs().format('dddd, DD/MM/YYYY')}
          </Typography.Text>
        </div>

        <Space size={12} align="center">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{displayName}</div>
            <Tag color={ROLE_COLOR[user.role]} style={{ marginInlineEnd: 0 }}>
              {ROLE_LABEL[user.role]}
            </Tag>
          </div>
          <Avatar size={44} style={{ background: '#0d9488', fontWeight: 600 }}>
            {initials(displayName)}
          </Avatar>
        </Space>
      </Flex>

      {user.role === 'PATIENT' && <PatientDashboard />}
      {user.role === 'DOCTOR' && <DoctorDashboard />}
      {user.role === 'RECEPTIONIST' && <ReceptionistDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </Space>
  );
}
