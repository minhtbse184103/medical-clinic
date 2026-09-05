import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Flex,
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
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorsApi } from '../api/doctors';
import { receptionistApi } from '../api/receptionist';
import { PageHeader } from '../components/PageHeader';
import { errorMessage } from '../lib/apiError';
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_LABEL,
  CANCELLABLE_STATUSES,
} from '../lib/appointmentStatus';
import { formatDate, formatTime, toApiDate } from '../lib/datetime';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
import type {
  AppointmentStatus,
  ReceptionistAppointment,
  ReceptionistAppointmentQuery,
} from '../types/api';

const STATUS_OPTIONS = (Object.keys(APPOINTMENT_STATUS_LABEL) as AppointmentStatus[]).map(
  (status) => ({ value: status, label: APPOINTMENT_STATUS_LABEL[status] }),
);

interface Filters {
  date?: string;
  doctorId?: number;
  status?: AppointmentStatus;
}

export function ReceptionistAppointmentsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>(DEFAULT_PAGE_QUERY);
  const [filters, setFilters] = useState<Filters>({});
  const [cancelTarget, setCancelTarget] = useState<ReceptionistAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const query: ReceptionistAppointmentQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['receptionist-appointments', query],
    queryFn: () => receptionistApi.appointments(query),
    placeholderData: keepPreviousData,
  });

  // The doctor filter needs names, and GET /doctors is open to every signed-in role.
  const doctorsQuery = useQuery({
    queryKey: ['doctors', { page: 0, size: 100 }],
    queryFn: () => doctorsApi.list({ page: 0, size: 100 }),
  });

  const applyFilter = (next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] });

  const confirmMutation = useMutation({
    mutationFn: (appointmentId: number) => receptionistApi.confirm(appointmentId),
    onSuccess: async () => {
      message.success('Đã xác nhận lịch hẹn.');
      await invalidate();
    },
    // Typically INVALID_APPOINTMENT_STATUS_TRANSITION when the row is already confirmed.
    onError: (confirmError) => message.error(errorMessage(confirmError)),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: number; reason: string }) =>
      receptionistApi.cancel(appointmentId, reason),
    onSuccess: async () => {
      message.success('Đã hủy lịch hẹn.');
      closeCancelModal();
      await invalidate();
    },
    onError: (cancelError) => message.error(errorMessage(cancelError)),
  });

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  const columns: ColumnsType<ReceptionistAppointment> = [
    {
      title: 'Ngày giờ',
      key: 'when',
      render: (_, appointment) => (
        <Space direction="vertical" size={0}>
          <span>{formatDate(appointment.appointmentDate)}</span>
          <Typography.Text type="secondary">
            {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, appointment) => (
        <Typography.Text strong>{appointment.patientFullName}</Typography.Text>
      ),
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_, appointment) => (
        <Space direction="vertical" size={0}>
          <span>{appointment.doctorFullName}</span>
          <Typography.Text type="secondary">{appointment.doctorSpecialty}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Lý do khám', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: AppointmentStatus) => (
        <Tag color={APPOINTMENT_STATUS_COLOR[status]}>{APPOINTMENT_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, appointment) => (
        <Space>
          {/* Only PENDING can move to CONFIRMED; the other transitions are terminal. */}
          {appointment.status === 'PENDING' && (
            <Popconfirm
              title="Xác nhận lịch hẹn này?"
              okText="Xác nhận"
              cancelText="Đóng"
              onConfirm={() => confirmMutation.mutate(appointment.appointmentId)}
            >
              <Button type="primary">Xác nhận</Button>
            </Popconfirm>
          )}
          {CANCELLABLE_STATUSES.includes(appointment.status) && (
            <Button danger onClick={() => setCancelTarget(appointment)}>
              Hủy
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Quản lý lịch hẹn"
        description="Lễ tân được hủy kể cả sát giờ khám, khác với bệnh nhân bị giới hạn 2 tiếng."
        extra={
          <Button type="primary" onClick={() => navigate('/receptionist/book')}>
            Đặt lịch hộ bệnh nhân
          </Button>
        }
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Flex gap={16} wrap>
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="Ngày khám"
            onChange={(value: Dayjs | null) =>
              applyFilter({ date: value ? toApiDate(value) : undefined })
            }
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Bác sĩ"
            style={{ minWidth: 220 }}
            loading={doctorsQuery.isFetching}
            options={(doctorsQuery.data?.content ?? []).map((doctor) => ({
              value: doctor.doctorId,
              label: `${doctor.fullName} — ${doctor.specialty}`,
            }))}
            onChange={(doctorId?: number) => applyFilter({ doctorId })}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ minWidth: 180 }}
            options={STATUS_OPTIONS}
            onChange={(status?: AppointmentStatus) => applyFilter({ status })}
          />
        </Flex>
      </Card>

      <Table<ReceptionistAppointment>
        rowKey="appointmentId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        pagination={toTablePagination(data, pageQuery)}
        onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
      />

      <Modal
        open={cancelTarget !== null}
        title="Hủy lịch hẹn"
        okText="Xác nhận hủy"
        cancelText="Đóng"
        okButtonProps={{ danger: true, disabled: cancelReason.trim().length === 0 }}
        confirmLoading={cancelMutation.isPending}
        onCancel={closeCancelModal}
        onOk={() => {
          if (cancelTarget) {
            cancelMutation.mutate({
              appointmentId: cancelTarget.appointmentId,
              reason: cancelReason.trim(),
            });
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Lễ tân được hủy kể cả sát giờ khám, khác với bệnh nhân bị giới hạn 2 tiếng.
          </Typography.Paragraph>
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder="Lý do hủy"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
        </Space>
      </Modal>
    </Space>
  );
}
