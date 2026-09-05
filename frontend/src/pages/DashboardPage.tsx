import { CalendarOutlined } from '@ant-design/icons';
import { Flex, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAuth } from '../auth/useAuth';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { DoctorDashboard } from './dashboard/DoctorDashboard';
import { PatientDashboard } from './dashboard/PatientDashboard';
import { ReceptionistDashboard } from './dashboard/ReceptionistDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // ADMIN and RECEPTIONIST have no profile table, so fullName is null for them.
  const displayName = user.fullName ?? user.email;
  const greetingName = user.role === 'DOCTOR' && user.fullName ? `BS. ${displayName}` : displayName;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* The name, role and avatar live in the layout header; repeating them here would
          show the same identity twice on the one screen that has its own heading. */}
      <Flex align="flex-start" justify="space-between" gap={16} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Xin chào, {greetingName}
          </Typography.Title>
          <Space size={8} style={{ color: '#667085', marginTop: 4 }}>
            <CalendarOutlined />
            <span>{dayjs().format('dddd, [ngày] DD [tháng] M [năm] YYYY')}</span>
          </Space>
        </div>

        {/* Reads the real account status rather than asserting one. */}
        <Tag
          color={user.status === 'ACTIVE' ? 'blue' : 'red'}
          style={{ marginInlineEnd: 0, borderRadius: 999, paddingInline: 12 }}
        >
          ● {user.status === 'ACTIVE' ? 'Hồ sơ hoạt động' : 'Hồ sơ đã khóa'}
        </Tag>
      </Flex>

      {user.role === 'PATIENT' && <PatientDashboard />}
      {user.role === 'DOCTOR' && <DoctorDashboard />}
      {user.role === 'RECEPTIONIST' && <ReceptionistDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </Space>
  );
}
