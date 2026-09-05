import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Input,
  Modal,
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

import { appointmentsApi } from '../api/appointments';
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
  AppointmentSort,
  AppointmentStatus,
  PatientAppointment,
  PatientAppointmentQuery,
} from '../types/api';

const STATUS_OPTIONS = (Object.keys(APPOINTMENT_STATUS_LABEL) as AppointmentStatus[]).map(
  (status) => ({ value: status, label: APPOINTMENT_STATUS_LABEL[status] }),
);

const SORT_OPTIONS: { value: AppointmentSort; label: string }[] = [
  { value: 'appointmentDate,desc', label: 'Mới nhất trước' },
  { value: 'appointmentDate,asc', label: 'Cũ nhất trước' },
];

interface Filters {
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
  sort: AppointmentSort;
}

export function MyAppointmentsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>(DEFAULT_PAGE_QUERY);
  const [filters, setFilters] = useState<Filters>({ sort: 'appointmentDate,desc' });
  const [cancelTarget, setCancelTarget] = useState<PatientAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const query: PatientAppointmentQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['my-appointments', query],
    queryFn: () => appointmentsApi.mine(query),
    placeholderData: keepPreviousData,
  });

  const applyFilter = (next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const cancelMutation = useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: number; reason: string }) =>
      appointmentsApi.cancel(appointmentId, reason),
    onSuccess: async () => {
      message.success('Đã hủy lịch hẹn.');
      closeCancelModal();
      await queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (cancelError) => {
      // Typically APPOINTMENT_CANCELLATION_DEADLINE_PASSED: the 2-hour window has closed.
      message.error(errorMessage(cancelError));
    },
  });

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  const columns: ColumnsType<PatientAppointment> = [
    {
      title: 'Ngày khám',
      key: 'appointmentDate',
      render: (_, appointment) => formatDate(appointment.appointmentDate),
    },
    {
      title: 'Giờ',
      key: 'time',
      render: (_, appointment) =>
        `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`,
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_, appointment) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{appointment.doctorFullName}</Typography.Text>
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
      width: 100,
      render: (_, appointment) =>
        CANCELLABLE_STATUSES.includes(appointment.status) ? (
          <Button danger onClick={() => setCancelTarget(appointment)}>
            Hủy
          </Button>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Lịch hẹn của tôi"
        description="Chỉ hủy được trước giờ khám ít nhất 2 tiếng. Muộn hơn, vui lòng liên hệ lễ tân."
        extra={
          <Button type="primary" onClick={() => navigate('/doctors')}>
            Đặt lịch khám
          </Button>
        }
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Flex gap={16} wrap>
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ minWidth: 180 }}
            options={STATUS_OPTIONS}
            onChange={(status?: AppointmentStatus) => applyFilter({ status })}
          />
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={(range) => {
              const [from, to] = (range ?? [null, null]) as [Dayjs | null, Dayjs | null];
              applyFilter({
                fromDate: from ? toApiDate(from) : undefined,
                toDate: to ? toApiDate(to) : undefined,
              });
            }}
          />
          <Select
            value={filters.sort}
            style={{ minWidth: 180 }}
            options={SORT_OPTIONS}
            onChange={(sort: AppointmentSort) => applyFilter({ sort })}
          />
        </Flex>
      </Card>

      <Table<PatientAppointment>
        rowKey="appointmentId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        pagination={toTablePagination(data, pageQuery)}
        onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch hẹn nào">
              <Button type="primary" onClick={() => navigate('/doctors')}>
                Đặt lịch khám
              </Button>
            </Empty>
          ),
        }}
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
            Chỉ được hủy trước giờ khám ít nhất 2 tiếng. Muộn hơn, vui lòng liên hệ lễ tân.
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
