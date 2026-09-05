import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  PhoneOutlined,
  ReloadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
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
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorsApi } from '../api/doctors';
import { receptionistApi } from '../api/receptionist';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
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

const TODAY = toApiDate(dayjs());

interface Filters {
  date?: string;
  doctorId?: number;
  status?: AppointmentStatus;
}

export function ReceptionistAppointmentsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  // The desk works a day at a time, so the screen opens on today.
  const [filters, setFilters] = useState<Filters>({ date: TODAY });
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

  /*
   * The appointment response carries no phone number, so it comes from the patient search,
   * which the desk already uses to book. Suspended patients are absent from that list, so a
   * few rows can legitimately end up without a number.
   */
  const patientsQuery = useQuery({
    queryKey: ['receptionist-patients', { page: 0, size: 100 }],
    queryFn: () => receptionistApi.searchPatients({ page: 0, size: 100 }),
  });

  const phoneByPatient = useMemo(() => {
    const index = new Map<number, string | null>();
    for (const patient of patientsQuery.data?.content ?? []) {
      index.set(patient.patientId, patient.phone);
    }
    return index;
  }, [patientsQuery.data]);

  /*
   * The counters for the day being viewed. Each is the cheapest count the API allows:
   * one row asked for, and only totalElements read.
   */
  const statDate = filters.date ?? TODAY;
  const previousDate = toApiDate(dayjs(statDate).subtract(1, 'day'));

  const [total, previousTotal, pending, confirmed, completed] = useQueries({
    queries: (
      [
        { date: statDate },
        { date: previousDate },
        { date: statDate, status: 'PENDING' as AppointmentStatus },
        { date: statDate, status: 'CONFIRMED' as AppointmentStatus },
        { date: statDate, status: 'COMPLETED' as AppointmentStatus },
      ] as const
    ).map((stat) => ({
      queryKey: ['receptionist-appointment-count', stat],
      queryFn: () => receptionistApi.appointments({ page: 0, size: 1, ...stat }),
      select: (page: { totalElements: number }) => page.totalElements,
    })),
  });

  const delta =
    total.data !== undefined && previousTotal.data !== undefined
      ? total.data - previousTotal.data
      : undefined;

  const applyFilter = (next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['receptionist-appointment-count'] }),
    ]);

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
      title: 'NGÀY & KHUNG GIỜ',
      key: 'when',
      width: 170,
      render: (_, appointment) => {
        const struck = appointment.status === 'CANCELLED';
        return (
          <Space direction="vertical" size={2}>
            <span style={{ textDecoration: struck ? 'line-through' : undefined }}>
              {formatDate(appointment.appointmentDate)}
            </span>
            <Space size={4} style={{ color: struck ? '#98a2b3' : '#1677ff', fontSize: 13 }}>
              <ClockCircleOutlined />
              <span style={{ textDecoration: struck ? 'line-through' : undefined }}>
                {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
              </span>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'BỆNH NHÂN',
      key: 'patient',
      width: 220,
      render: (_, appointment) => {
        const phone = phoneByPatient.get(appointment.patientId);
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text
              strong
              delete={appointment.status === 'CANCELLED'}
              type={appointment.status === 'CANCELLED' ? 'secondary' : undefined}
            >
              {appointment.patientFullName}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Mã BN #{appointment.patientId}
            </Typography.Text>
            {phone && (
              <Space size={4} style={{ color: '#475467', fontSize: 12.5 }}>
                <PhoneOutlined />
                <span>{phone}</span>
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: 'BÁC SĨ PHỤ TRÁCH',
      key: 'doctor',
      width: 200,
      render: (_, appointment) => (
        <Space direction="vertical" size={2}>
          <span>BS. {appointment.doctorFullName}</span>
          <Typography.Text style={{ color: '#1677ff', fontSize: 12.5 }}>
            {appointment.doctorSpecialty}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'LÝ DO KHÁM',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Typography.Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 3, tooltip: reason }}>
          {reason}
        </Typography.Paragraph>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: AppointmentStatus) => (
        <Tag color={APPOINTMENT_STATUS_COLOR[status]} style={{ marginInlineEnd: 0 }}>
          {APPOINTMENT_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: 'THAO TÁC NGHIỆP VỤ',
      key: 'actions',
      width: 190,
      render: (_, appointment) => {
        const canCancel = CANCELLABLE_STATUSES.includes(appointment.status);

        // COMPLETED and CANCELLED are terminal; nothing is left for the desk to do.
        if (appointment.status !== 'PENDING' && !canCancel) {
          return <Typography.Text type="secondary">Đã đóng ca</Typography.Text>;
        }

        return (
          <Space wrap>
            {/* Only PENDING can move to CONFIRMED; the other transitions are terminal. */}
            {appointment.status === 'PENDING' && (
              <Popconfirm
                title="Xác nhận lịch hẹn này?"
                okText="Xác nhận"
                cancelText="Đóng"
                onConfirm={() => confirmMutation.mutate(appointment.appointmentId)}
              >
                <Button type="primary" icon={<CheckCircleOutlined />}>
                  Xác nhận
                </Button>
              </Popconfirm>
            )}
            {canCancel && (
              <Button danger onClick={() => setCancelTarget(appointment)}>
                Hủy lịch tại quầy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const isToday = statDate === TODAY;
  const dayLabel = isToday ? 'hôm nay' : `ngày ${formatDate(statDate)}`;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: 'Điều phối ngoại trú' }, { title: 'Quản lý lịch hẹn' }]} />

      <PageHeader
        title="Quản lý lịch hẹn khám bệnh"
        description="Tiếp đón người bệnh, xác nhận lịch hẹn và điều phối lịch khám tại quầy."
        extra={
          <>
            <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => invalidate()}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate('/receptionist/book')}
            >
              Đặt lịch hộ bệnh nhân
            </Button>
          </>
        }
      />

      {/* The one rule that makes the desk different from the patient app. */}
      <Alert
        type="info"
        showIcon
        message="Đặc quyền điều phối tại quầy"
        description="Lễ tân được hủy lịch hẹn kể cả sát giờ khám. Quy định phải hủy trước 2 tiếng chỉ áp dụng cho bệnh nhân tự hủy trên ứng dụng."
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title={`Tổng lịch khám ${dayLabel}`}
            value={total.data ?? 0}
            loading={total.isPending}
            icon={<CalendarOutlined />}
            footer={
              delta === undefined ? undefined : delta === 0 ? (
                'Bằng hôm trước'
              ) : (
                <span style={{ color: delta > 0 ? '#0d9488' : '#d46b08' }}>
                  {delta > 0 ? `+${delta}` : delta} ca so với hôm trước
                </span>
              )
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Chờ xác nhận"
            value={pending.data ?? 0}
            loading={pending.isPending}
            icon={<ClockCircleOutlined />}
            highlight={(pending.data ?? 0) > 0}
            footer="Cần lễ tân duyệt"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Đã xác nhận"
            value={confirmed.data ?? 0}
            loading={confirmed.isPending}
            icon={<CheckCircleOutlined />}
            footer="Chờ bác sĩ khám"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Đã khám xong"
            value={completed.data ?? 0}
            loading={completed.isPending}
            icon={<FileDoneOutlined />}
            footer="Đã có bệnh án"
          />
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={6}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Ngày khám
            </Typography.Text>
            <DatePicker
              style={{ width: '100%', marginTop: 4 }}
              format="DD/MM/YYYY"
              placeholder="Tất cả các ngày"
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(value: Dayjs | null) =>
                applyFilter({ date: value ? toApiDate(value) : undefined })
              }
            />
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Bác sĩ chuyên khoa
            </Typography.Text>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả bác sĩ"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.doctorId}
              loading={doctorsQuery.isFetching}
              options={(doctorsQuery.data?.content ?? []).map((doctor) => ({
                value: doctor.doctorId,
                label: `${doctor.fullName} — ${doctor.specialty}`,
              }))}
              onChange={(doctorId?: number) => applyFilter({ doctorId })}
            />
          </Col>
          <Col xs={24} md={6}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Trạng thái lịch hẹn
            </Typography.Text>
            <Select
              allowClear
              placeholder="Tất cả trạng thái"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(status?: AppointmentStatus) => applyFilter({ status })}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              block
              onClick={() => {
                setFilters({ date: TODAY });
                setPageQuery((current) => ({ ...current, page: 0 }));
              }}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>
      </Card>

      <Table<ReceptionistAppointment>
        rowKey="appointmentId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        scroll={{ x: 1100 }}
        locale={{
          // The screen opens on today, which can genuinely be an empty day; say so and
          // offer the way out instead of a bare "no data".
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={`Không có lịch hẹn nào ${dayLabel}`}
            >
              {filters.date && (
                <Button onClick={() => applyFilter({ date: undefined })}>
                  Xem tất cả các ngày
                </Button>
              )}
            </Empty>
          ),
        }}
        pagination={{
          ...toTablePagination(data, pageQuery),
          pageSizeOptions: [10, 20, 50],
          showTotal: (count, range) =>
            `Hiển thị ${range[0]} – ${range[1]} trong tổng số ${count} lịch hẹn`,
        }}
        onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
      />

      <Modal
        open={cancelTarget !== null}
        title="Hủy lịch hẹn tại quầy"
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
          {cancelTarget && (
            <Typography.Text>
              {cancelTarget.patientFullName} · {formatDate(cancelTarget.appointmentDate)}{' '}
              {formatTime(cancelTarget.startTime)}
            </Typography.Text>
          )}
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
