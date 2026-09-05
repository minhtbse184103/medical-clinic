import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api/admin';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { formatDateTime } from '../lib/datetime';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
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
  const [pageQuery, setPageQuery] = useState<PageQuery>(DEFAULT_PAGE_QUERY);
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-staff'] });

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
      message.success(
        staff.status === 'ACTIVE' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.',
      );
      await invalidate();
    },
    onError: (statusError) => message.error(errorMessage(statusError)),
  });

  const columns: ColumnsType<Staff> = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => <Tag color="blue">{ROLE_LABEL[role] ?? role}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
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
            <Button danger={!activate}>{activate ? 'Mở khóa' : 'Khóa'}</Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between" wrap gap={12}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý nhân sự
        </Typography.Title>
        <Space>
          <Button type="primary" onClick={() => setCreateMode('DOCTOR')}>
            Thêm bác sĩ
          </Button>
          <Button onClick={() => setCreateMode('RECEPTIONIST')}>Thêm lễ tân</Button>
        </Space>
      </Flex>

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Flex gap={16} wrap>
          <Select
            allowClear
            placeholder="Vai trò"
            style={{ minWidth: 180 }}
            options={ROLE_OPTIONS}
            onChange={(role?: Role) => applyFilter({ role })}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ minWidth: 180 }}
            options={STATUS_OPTIONS}
            onChange={(status?: UserStatus) => applyFilter({ status })}
          />
        </Flex>
      </Card>

      <Table<Staff>
        rowKey="userId"
        columns={columns}
        dataSource={error ? [] : data?.content}
        loading={isFetching}
        pagination={toTablePagination(data, pageQuery)}
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
            label="Số giấy phép hành nghề"
            rules={[{ required: true, message: 'Vui lòng nhập số giấy phép.' }]}
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
