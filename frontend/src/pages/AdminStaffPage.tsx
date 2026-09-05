import {
  IdcardOutlined,
  LockOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api/admin';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { formatDate } from '../lib/datetime';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
import { initials } from '../lib/user';
import type {
  CreateDoctorRequest,
  CreateReceptionistRequest,
  Role,
  Staff,
  StaffQuery,
  UserStatus,
} from '../types/api';

const ROLE_LABEL: Record<string, string> = {
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
};

/** The staff endpoint only ever returns these two roles. */
const ROLE_OPTIONS = [
  { value: 'DOCTOR' as Role, label: 'Bác sĩ' },
  { value: 'RECEPTIONIST' as Role, label: 'Lễ tân' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE' as UserStatus, label: 'Đang hoạt động' },
  { value: 'INACTIVE' as UserStatus, label: 'Đã khóa' },
];

type CreateMode = 'DOCTOR' | 'RECEPTIONIST' | null;

export function AdminStaffPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  const [filters, setFilters] = useState<{ role?: Role; status?: UserStatus }>({});
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [doctorForm] = Form.useForm<CreateDoctorRequest>();
  const [receptionistForm] = Form.useForm<CreateReceptionistRequest>();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();

  const query: StaffQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['admin-staff', query],
    queryFn: () => adminApi.staff(query),
    placeholderData: keepPreviousData,
  });

  /* Headline numbers, each the cheapest count the API allows: one row, totalElements only. */
  const [totalStaff, activeDoctors, allDoctors, activeDesk, allDesk, locked] = useQueries({
    queries: (
      [
        {},
        { role: 'DOCTOR', status: 'ACTIVE' },
        { role: 'DOCTOR' },
        { role: 'RECEPTIONIST', status: 'ACTIVE' },
        { role: 'RECEPTIONIST' },
        { status: 'INACTIVE' },
      ] as Partial<StaffQuery>[]
    ).map((stat) => ({
      queryKey: ['admin-staff-count', stat],
      queryFn: () => adminApi.staff({ page: 0, size: 1, ...stat }),
      select: (page: { totalElements: number }) => page.totalElements,
    })),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-staff-count'] }),
    ]);

  const applyFilter = (next: Partial<typeof filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const closeModal = () => {
    setCreateMode(null);
    doctorForm.resetFields();
    receptionistForm.resetFields();
  };

  const createDoctorMutation = useMutation({
    mutationFn: (values: CreateDoctorRequest) => adminApi.createDoctor(values),
    onSuccess: async (doctor) => {
      message.success(`Đã tạo bác sĩ ${doctor.fullName}.`);
      closeModal();
      await invalidate();
    },
    onError: (createError) => {
      // Duplicate email or licence number arrives as a 409 without field errors.
      if (!applyFieldErrors(doctorForm, createError)) {
        message.error(errorMessage(createError));
      }
    },
  });

  const createReceptionistMutation = useMutation({
    mutationFn: (values: CreateReceptionistRequest) => adminApi.createReceptionist(values),
    onSuccess: async (staff) => {
      message.success(`Đã tạo lễ tân ${staff.email}.`);
      closeModal();
      await invalidate();
    },
    onError: (createError) => {
      if (!applyFieldErrors(receptionistForm, createError)) {
        message.error(errorMessage(createError));
      }
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, activate }: { userId: number; activate: boolean }) =>
      activate ? adminApi.activate(userId) : adminApi.deactivate(userId),
    onSuccess: async (staff) => {
      message.success(staff.status === 'ACTIVE' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      await invalidate();
    },
    onError: (statusError) => message.error(errorMessage(statusError)),
  });

  const columns: ColumnsType<Staff> = [
    {
      title: 'NHÂN VIÊN & EMAIL ĐĂNG NHẬP',
      key: 'identity',
      render: (_, staff) => {
        const locked = staff.status !== 'ACTIVE';
        return (
          <Space size={10}>
            <Avatar style={{ background: locked ? '#f2f4f7' : '#e0edff', color: '#1677ff' }}>
              {initials(staff.fullName ?? staff.email)}
            </Avatar>
            <Space direction="vertical" size={0}>
              {/* A receptionist has no profile row, so only the account email exists. */}
              <Typography.Text strong delete={locked}>
                {staff.fullName ?? staff.email}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                {staff.fullName ? staff.email : 'Tài khoản lễ tân (không có hồ sơ riêng)'}
              </Typography.Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'VAI TRÒ',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: Role) => (
        <Tag color="blue" style={{ marginInlineEnd: 0 }}>
          {ROLE_LABEL[role] ?? role}
        </Tag>
      ),
    },
    {
      title: 'CHUYÊN KHOA / CCHN',
      key: 'profile',
      width: 220,
      render: (_, staff) =>
        staff.specialty ? (
          <Space direction="vertical" size={0}>
            <span>{staff.specialty}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              CCHN: {staff.licenseNumber}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: UserStatus) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'} style={{ marginInlineEnd: 0 }}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
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
      title: 'THAO TÁC QUẢN TRỊ',
      key: 'actions',
      width: 160,
      render: (_, staff) => {
        const activate = staff.status !== 'ACTIVE';
        return (
          <Popconfirm
            title={activate ? 'Mở khóa tài khoản này?' : 'Khóa tài khoản này?'}
            description={
              activate
                ? undefined
                : 'Tài khoản bị khóa không đăng nhập được, nhưng dữ liệu lịch sử vẫn giữ nguyên.'
            }
            okText="Xác nhận"
            cancelText="Đóng"
            onConfirm={() => statusMutation.mutate({ userId: staff.userId, activate })}
          >
            <Button danger={!activate} icon={activate ? <UnlockOutlined /> : <LockOutlined />}>
              {activate ? 'Mở khóa' : 'Khóa'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: 'Quản trị hệ thống' }, { title: 'Quản lý tài khoản nhân viên' }]} />

      <PageHeader
        title="Quản lý tài khoản nhân viên"
        description="Tạo tài khoản bác sĩ, lễ tân và khóa hoặc mở khóa quyền truy cập."
        extra={
          <>
            <Button icon={<UserAddOutlined />} onClick={() => setCreateMode('RECEPTIONIST')}>
              Thêm lễ tân
            </Button>
            <Button
              type="primary"
              icon={<MedicineBoxOutlined />}
              onClick={() => setCreateMode('DOCTOR')}
            >
              Thêm bác sĩ
            </Button>
          </>
        }
      />

      {/* The reason there is no delete button anywhere on this screen. */}
      <Alert
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        message="Khóa tài khoản thay vì xóa"
        description="Hệ thống không xóa tài khoản nhân sự. Tài khoản bị khóa mất quyền đăng nhập nhưng toàn bộ lịch hẹn, bệnh án và đơn thuốc đã ký vẫn giữ nguyên để đối soát."
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Tổng số nhân sự"
            value={totalStaff.data ?? 0}
            loading={totalStaff.isPending}
            icon={<TeamOutlined />}
            footer="Bác sĩ và lễ tân"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Bác sĩ đang hoạt động"
            value={activeDoctors.data ?? 0}
            loading={activeDoctors.isPending}
            icon={<MedicineBoxOutlined />}
            footer={`trên ${allDoctors.data ?? 0} tài khoản bác sĩ`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Lễ tân đang hoạt động"
            value={activeDesk.data ?? 0}
            loading={activeDesk.isPending}
            icon={<IdcardOutlined />}
            footer={`trên ${allDesk.data ?? 0} tài khoản lễ tân`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Tài khoản đang khóa"
            value={locked.data ?? 0}
            loading={locked.isPending}
            icon={<LockOutlined />}
            highlight={(locked.data ?? 0) > 0}
            footer="Không đăng nhập được"
          />
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Vai trò
            </Typography.Text>
            <Select
              allowClear
              placeholder="Tất cả vai trò"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.role}
              options={ROLE_OPTIONS}
              onChange={(role?: Role) => applyFilter({ role })}
            />
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Trạng thái
            </Typography.Text>
            <Select
              allowClear
              placeholder="Tất cả trạng thái"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(status?: UserStatus) => applyFilter({ status })}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              block
              onClick={() => {
                setFilters({});
                setPageQuery((current) => ({ ...current, page: 0 }));
              }}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>
      </Card>

      <Table<Staff>
        rowKey="userId"
        columns={columns}
        dataSource={error ? [] : data?.content}
        loading={isFetching}
        scroll={{ x: 1000 }}
        pagination={{
          ...toTablePagination(data, pageQuery),
          pageSizeOptions: [10, 20, 50],
          showTotal: (count, range) =>
            `Hiển thị ${range[0]} – ${range[1]} trong tổng số ${count} tài khoản nhân sự`,
        }}
        onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
        locale={{ emptyText: error ? 'Không tải được danh sách' : 'Chưa có nhân sự nào' }}
      />

      <Modal
        open={createMode === 'DOCTOR'}
        title="Thêm bác sĩ"
        okText="Tạo"
        cancelText="Đóng"
        confirmLoading={createDoctorMutation.isPending}
        onCancel={closeModal}
        onOk={() => doctorForm.submit()}
        width={560}
      >
        <Form
          form={doctorForm}
          layout="vertical"
          onFinish={(values) => createDoctorMutation.mutate(values)}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email.' },
              { type: 'email', message: 'Email không hợp lệ.' },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="temporaryPassword"
            label="Mật khẩu tạm"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu tạm.' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự.' },
            ]}
            extra="Bác sĩ dùng mật khẩu này để đăng nhập lần đầu."
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item
            name="specialty"
            label="Chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa.' }]}
          >
            <Input placeholder="Nội tổng quát" />
          </Form.Item>

          <Form.Item
            name="licenseNumber"
            label="Số chứng chỉ hành nghề"
            rules={[{ required: true, message: 'Vui lòng nhập số chứng chỉ.' }]}
            extra="Không được trùng với bác sĩ khác."
          >
            <Input placeholder="LIC-0001" />
          </Form.Item>

          <Form.Item name="bio" label="Giới thiệu">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={createMode === 'RECEPTIONIST'}
        title="Thêm lễ tân"
        okText="Tạo"
        cancelText="Đóng"
        confirmLoading={createReceptionistMutation.isPending}
        onCancel={closeModal}
        onOk={() => receptionistForm.submit()}
      >
        <Form
          form={receptionistForm}
          layout="vertical"
          onFinish={(values) => createReceptionistMutation.mutate(values)}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Lễ tân chỉ cần tài khoản đăng nhập"
            description="Vai trò này không có hồ sơ riêng trong MVP, nên không nhập họ tên."
          />

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email.' },
              { type: 'email', message: 'Email không hợp lệ.' },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="temporaryPassword"
            label="Mật khẩu tạm"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu tạm.' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự.' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
