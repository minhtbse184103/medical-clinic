import {
  CalendarOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { adminApi } from '../../api/admin';
import { SummaryTile } from '../../components/SummaryTile';
import { errorMessage } from '../../lib/apiError';
import { formatDate } from '../../lib/datetime';
import { ROLE_LABEL } from '../../lib/user';
import type { Role, Staff, UserStatus } from '../../types/api';

/** Staff rows carry no name, only an email, so the avatar is built from the local part. */
function emailInitials(email: string): string {
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function useStaffCount(params: { role?: Role; status?: UserStatus }) {
  return useQuery({
    queryKey: ['admin-staff-count', params],
    queryFn: () => adminApi.staff({ page: 0, size: 1, ...params }),
    select: (page) => page.totalElements,
  });
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const doctors = useStaffCount({ role: 'DOCTOR' });
  const activeDoctors = useStaffCount({ role: 'DOCTOR', status: 'ACTIVE' });
  const receptionists = useStaffCount({ role: 'RECEPTIONIST' });
  const locked = useStaffCount({ status: 'INACTIVE' });

  const staffList = useQuery({
    queryKey: ['admin-staff', { page: 0, size: 6 }],
    queryFn: () => adminApi.staff({ page: 0, size: 6 }),
  });

  const lockedCount = locked.data ?? 0;
  const doctorTotal = doctors.data ?? 0;
  const doctorActive = activeDoctors.data ?? 0;
  const activeShare = doctorTotal > 0 ? Math.round((doctorActive / doctorTotal) * 100) : null;

  const columns: ColumnsType<Staff> = [
    {
      title: 'NHÂN SỰ',
      key: 'staff',
      render: (_, staff) => (
        <Space size={12}>
          <Avatar
            style={{
              background: staff.status === 'ACTIVE' ? '#e6f4ff' : '#fff1f0',
              color: staff.status === 'ACTIVE' ? '#1677ff' : '#cf1322',
              fontWeight: 600,
            }}
          >
            {emailInitials(staff.email)}
          </Avatar>
          {/* The staff endpoint returns no display name; the email is the identity here. */}
          <Typography.Text strong>{staff.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'VAI TRÒ',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: Role) => <Tag color="blue">{ROLE_LABEL[role]}</Tag>,
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: UserStatus) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
        </Tag>
      ),
    },
    {
      title: 'NGÀY TẠO',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: () => (
        <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate('/admin/staff')}>
          Xử lý
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {staffList.isError && (
        <Alert type="error" showIcon message={errorMessage(staffList.error)} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Số lượng bác sĩ"
            value={`${doctorTotal} nhân sự`}
            sub={
              activeShare === null
                ? 'Chưa có bác sĩ nào'
                : `${activeShare}% tài khoản đang hoạt động`
            }
            icon={<MedicineBoxOutlined />}
            loading={doctors.isPending}
            onClick={() => navigate('/admin/staff')}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Số lượng lễ tân"
            value={`${receptionists.data ?? 0} nhân sự`}
            sub="Phụ trách xác nhận và đặt lịch hộ"
            icon={<IdcardOutlined />}
            iconColor="#0d9488"
            iconBg="#e6fffb"
            loading={receptionists.isPending}
            onClick={() => navigate('/admin/staff')}
          />
        </Col>
        <Col xs={24} lg={8}>
          {/* Turns red only when there is something to look at. */}
          <Card
            styles={{ body: { padding: 20 } }}
            style={
              lockedCount > 0
                ? { height: '100%', background: '#fff1f0', borderColor: '#ffccc7' }
                : { height: '100%' }
            }
            loading={locked.isPending}
            hoverable
            onClick={() => navigate('/admin/staff')}
          >
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: lockedCount > 0 ? '#cf1322' : '#667085',
                  }}
                >
                  Tài khoản bị khóa
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginTop: 8,
                    color: lockedCount > 0 ? '#cf1322' : '#101828',
                  }}
                >
                  {lockedCount} tài khoản
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6, color: '#667085' }}>
                  {lockedCount > 0 ? (
                    <Space size={6}>
                      <WarningOutlined />
                      <span>Cần xem xét mở khóa hoặc giữ khóa</span>
                    </Space>
                  ) : (
                    'Toàn bộ tài khoản đang hoạt động'
                  )}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  background: lockedCount > 0 ? '#ffe7e5' : '#f2f4f7',
                  color: lockedCount > 0 ? '#cf1322' : '#667085',
                }}
              >
                <LockOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title={
              <Space size={10}>
                <TeamOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Nhân sự phòng khám</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/admin/staff')}>
                Quản lý nhân sự
              </Button>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table<Staff>
              rowKey="userId"
              columns={columns}
              dataSource={staffList.data?.content}
              loading={staffList.isPending}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nhân sự nào" />
                ),
              }}
            />
            {staffList.data && staffList.data.totalElements > 0 && (
              <div style={{ padding: '12px 16px', color: '#667085', fontSize: 13 }}>
                Hiển thị {staffList.data.content.length} trên {staffList.data.totalElements} nhân sự
                toàn hệ thống
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <Space size={10}>
                  <SettingOutlined style={{ color: '#1677ff' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Thao tác quản trị</span>
                </Space>
              }
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/admin/staff')}
                >
                  Quản lý nhân sự
                </Button>
                <Button
                  block
                  size="large"
                  icon={<CalendarOutlined />}
                  onClick={() => navigate('/admin/schedules')}
                >
                  Xếp lịch làm việc
                </Button>
              </Space>
            </Card>

            {/*
              The one note from the design that the system can back: an ADMIN really has no
              endpoint for appointments or medical records, so the absence is deliberate.
            */}
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="Lưu ý dữ liệu phân quyền"
              description="Quản trị viên không xem được số liệu lịch hẹn hay bệnh án của bệnh nhân. Dữ liệu tiếp nhận thuộc thẩm quyền của Lễ tân, dữ liệu khám chữa bệnh thuộc Bác sĩ."
            />
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
