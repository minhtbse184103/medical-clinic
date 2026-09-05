import { LockOutlined, SolutionOutlined, TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, List, Row, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { adminApi } from '../../api/admin';
import { StatCard } from '../../components/StatCard';
import { errorMessage } from '../../lib/apiError';
import { formatDateTime } from '../../lib/datetime';
import type { Role, StaffQuery, UserStatus } from '../../types/api';

const ROLE_LABEL: Record<string, string> = { DOCTOR: 'Bác sĩ', RECEPTIONIST: 'Lễ tân' };

function useStaffCount(params: { role?: Role; status?: UserStatus }) {
  return useQuery({
    queryKey: ['admin-staff-count', params],
    queryFn: () => adminApi.staff({ page: 0, size: 1, ...params } as StaffQuery),
    select: (page) => page.totalElements,
  });
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const doctors = useStaffCount({ role: 'DOCTOR' });
  const receptionists = useStaffCount({ role: 'RECEPTIONIST' });
  const locked = useStaffCount({ status: 'INACTIVE' });

  const recentStaff = useQuery({
    queryKey: ['admin-staff', { page: 0, size: 5 }],
    queryFn: () => adminApi.staff({ page: 0, size: 5 }),
  });

  const lockedCount = locked.data ?? 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {recentStaff.isError && (
        <Alert type="error" showIcon message={errorMessage(recentStaff.error)} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Bác sĩ"
            value={doctors.data ?? 0}
            icon={<SolutionOutlined />}
            loading={doctors.isPending}
            onClick={() => navigate('/admin/staff')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Lễ tân"
            value={receptionists.data ?? 0}
            icon={<TeamOutlined />}
            loading={receptionists.isPending}
            onClick={() => navigate('/admin/staff')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Tài khoản bị khóa"
            value={lockedCount}
            icon={<LockOutlined />}
            loading={locked.isPending}
            highlight={lockedCount > 0}
            onClick={() => navigate('/admin/staff')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Nhân sự"
            loading={recentStaff.isPending}
            extra={
              <Button type="link" onClick={() => navigate('/admin/staff')}>
                Quản lý nhân sự
              </Button>
            }
          >
            {recentStaff.data && recentStaff.data.content.length > 0 ? (
              <List
                dataSource={recentStaff.data.content}
                renderItem={(staff) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Typography.Text strong>{staff.email}</Typography.Text>
                          <Tag color="blue">{ROLE_LABEL[staff.role] ?? staff.role}</Tag>
                          <Tag color={staff.status === 'ACTIVE' ? 'green' : 'red'}>
                            {staff.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                          </Tag>
                        </Space>
                      }
                      description={`Tạo ngày ${formatDateTime(staff.createdAt)}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nhân sự nào" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text strong>Thêm nhân sự</Typography.Text>
                <Typography.Text type="secondary">
                  Tạo tài khoản bác sĩ hoặc lễ tân với mật khẩu tạm.
                </Typography.Text>
                <Button type="primary" block onClick={() => navigate('/admin/staff')}>
                  Quản lý nhân sự
                </Button>
                <Button block onClick={() => navigate('/admin/schedules')}>
                  Xếp lịch làm việc
                </Button>
              </Space>
            </Card>

            {/*
              The API gives ADMIN no view of appointments: /receptionist/appointments and
              /doctor/appointments are restricted to those roles. In this MVP an Admin
              manages accounts and schedules rather than daily clinic operations.
            */}
            <Alert
              type="info"
              showIcon
              message="Không có số liệu lịch hẹn"
              description="Quản trị viên phụ trách tài khoản và lịch làm việc. Số liệu khám chữa bệnh thuộc về lễ tân và bác sĩ."
            />
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
