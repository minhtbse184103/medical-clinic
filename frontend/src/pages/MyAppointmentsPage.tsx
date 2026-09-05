import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { appointmentsApi } from '../api/appointments';
import { errorMessage } from '../lib/apiError';
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_LABEL,
  CANCELLABLE_STATUSES,
} from '../lib/appointmentStatus';
import { formatTime, toApiDate } from '../lib/datetime';
import { SLOT_MINUTES } from '../lib/slots';
import { initials } from '../lib/user';
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

const DEFAULT_FILTERS: Filters = { sort: 'appointmentDate,desc' };

export function MyAppointmentsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
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

  /** Badge in the heading: bookings still ahead that have not been cancelled or completed. */
  const upcoming = useQuery({
    queryKey: ['my-appointments-upcoming-count'],
    queryFn: () =>
      appointmentsApi.mine({ page: 0, size: 100, fromDate: toApiDate(dayjs()) }),
    select: (page) =>
      page.content.filter((row) => row.status === 'PENDING' || row.status === 'CONFIRMED').length,
  });

  const applyFilters = () => {
    setFilters(draft);
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
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
    // Typically APPOINTMENT_CANCELLATION_DEADLINE_PASSED: the two-hour window has closed.
    onError: (cancelError) => message.error(errorMessage(cancelError)),
  });

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  const columns: ColumnsType<PatientAppointment> = [
    {
      title: 'NGÀY KHÁM',
      key: 'date',
      width: 180,
      render: (_, row) => {
        const cancelled = row.status === 'CANCELLED';
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text
              strong
              delete={cancelled}
              type={cancelled ? 'secondary' : undefined}
            >
              {dayjs(row.appointmentDate).format('dddd, DD/MM/YYYY')}
            </Typography.Text>
            {/* The real appointment id, which is what the desk looks up. */}
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Mã hẹn: #{row.appointmentId}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: 'KHUNG GIỜ',
      key: 'slot',
      width: 160,
      render: (_, row) => {
        const cancelled = row.status === 'CANCELLED';
        return (
          <Space direction="vertical" size={2}>
            <Space size={6}>
              {row.status === 'COMPLETED' ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : cancelled ? (
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              ) : (
                <ClockCircleOutlined style={{ color: '#1677ff' }} />
              )}
              <Typography.Text delete={cancelled} type={cancelled ? 'secondary' : undefined}>
                {formatTime(row.startTime)} – {formatTime(row.endTime)}
              </Typography.Text>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              {row.status === 'COMPLETED' ? 'Hoàn tất khám' : `${SLOT_MINUTES} phút / ca`}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: 'BÁC SĨ PHỤ TRÁCH',
      key: 'doctor',
      render: (_, row) => (
        <Space size={12}>
          <Avatar style={{ background: '#e6f4ff', color: '#1677ff', fontWeight: 600 }}>
            {initials(row.doctorFullName)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Typography.Text strong>BS. {row.doctorFullName}</Typography.Text>
            <Typography.Text style={{ fontSize: 12.5, color: '#1677ff' }}>
              {row.doctorSpecialty}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'LÝ DO KHÁM BỆNH',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string, row) =>
        row.status === 'CANCELLED' ? (
          <Typography.Text type="secondary">{reason}</Typography.Text>
        ) : (
          reason
        ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: AppointmentStatus) => (
        <Tag color={APPOINTMENT_STATUS_COLOR[status]}>{APPOINTMENT_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      render: (_, row) => {
        if (CANCELLABLE_STATUSES.includes(row.status)) {
          return (
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setCancelTarget(row)}>
              Hủy lịch
            </Button>
          );
        }
        if (row.status === 'COMPLETED') {
          return (
            <Button icon={<FileTextOutlined />} onClick={() => navigate('/medical-records')}>
              Xem hồ sơ
            </Button>
          );
        }
        // Cancelled: offer to book the same doctor again.
        return (
          <Button icon={<RedoOutlined />} onClick={() => navigate(`/doctors/${row.doctorId}`)}>
            Đặt lại
          </Button>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/', title: <HomeOutlined />, onClick: () => navigate('/') },
          { title: 'Lịch hẹn của tôi' },
        ]}
      />

      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Space size={10} align="center" wrap>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Lịch hẹn của tôi
            </Typography.Title>
            {upcoming.data !== undefined && upcoming.data > 0 && (
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                {upcoming.data} lịch hẹn sắp tới
              </Tag>
            )}
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            Theo dõi trạng thái và điều chỉnh lịch hẹn đã đặt.
          </Typography.Paragraph>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/doctors')}
          >
            Đặt lịch khám
          </Button>
        </Col>
      </Row>

      {/* The two-hour rule is real; the design's hotline is not, but a receptionist is. */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={
          <span>
            Bạn chỉ hủy được lịch hẹn trước giờ khám ít nhất <b>2 tiếng</b>. Sát giờ hơn, vui lòng
            liên hệ lễ tân để được hỗ trợ hủy.
          </span>
        }
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Form layout="vertical" onFinish={applyFilters}>
          <Row gutter={16} align="bottom">
            <Col xs={24} md={6}>
              <Form.Item label="Trạng thái lịch khám" style={{ marginBottom: 0 }}>
                <Select
                  size="large"
                  allowClear
                  placeholder="Tất cả trạng thái"
                  options={STATUS_OPTIONS}
                  value={draft.status}
                  onChange={(status?: AppointmentStatus) => setDraft((c) => ({ ...c, status }))}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Khoảng thời gian khám" style={{ marginBottom: 0 }}>
                <DatePicker.RangePicker
                  size="large"
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                  onChange={(range) => {
                    const [from, to] = (range ?? [null, null]) as [Dayjs | null, Dayjs | null];
                    setDraft((c) => ({
                      ...c,
                      fromDate: from ? toApiDate(from) : undefined,
                      toDate: to ? toApiDate(to) : undefined,
                    }));
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Thứ tự hiển thị" style={{ marginBottom: 0 }}>
                <Select
                  size="large"
                  options={SORT_OPTIONS}
                  value={draft.sort}
                  onChange={(sort: AppointmentSort) => setDraft((c) => ({ ...c, sort }))}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" size="large" icon={<FilterOutlined />} htmlType="submit">
                  Lọc
                </Button>
                <Button size="large" icon={<ReloadOutlined />} onClick={resetFilters} />
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table<PatientAppointment>
          rowKey="appointmentId"
          columns={columns}
          dataSource={error ? [] : data?.content}
          loading={isFetching}
          pagination={{
            ...toTablePagination(data, pageQuery),
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} – ${range[1]} trong tổng số ${total} lịch khám`,
          }}
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
      </Card>

      {/* Guidance the system can stand behind, rather than reminders it never sends. */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Space align="start" size={12}>
              <Avatar style={{ background: '#eff6ff', color: '#1677ff' }} icon={<FileTextOutlined />} />
              <div>
                <Typography.Text strong>Chuẩn bị trước khi khám</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                  Mang theo giấy tờ tùy thân. Đơn thuốc và bệnh án cũ xem lại được ở mục Đơn thuốc
                  và Bệnh án điện tử.
                </Typography.Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Space align="start" size={12}>
              <Avatar
                style={{ background: '#fffbe6', color: '#d48806' }}
                icon={<ClockCircleOutlined />}
              />
              <div>
                <Typography.Text strong>Chờ lễ tân xác nhận</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                  Lịch mới đặt ở trạng thái Chờ xác nhận. Hãy quay lại trang này để xem lễ tân đã
                  duyệt chưa.
                </Typography.Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Space align="start" size={12}>
              <Avatar
                style={{ background: '#f6ffed', color: '#389e0d' }}
                icon={<CalendarOutlined />}
              />
              <div>
                <Typography.Text strong>Đổi lịch khám</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                  Muốn đổi giờ, hãy hủy lịch cũ rồi đặt lại ca mới trong khung giờ còn trống.
                </Typography.Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

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
          {cancelTarget && (
            <Typography.Text>
              Lịch hẹn #{cancelTarget.appointmentId} với BS. {cancelTarget.doctorFullName},{' '}
              {dayjs(cancelTarget.appointmentDate).format('DD/MM/YYYY')} lúc{' '}
              {formatTime(cancelTarget.startTime)}.
            </Typography.Text>
          )}
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Chỉ hủy được trước giờ khám ít nhất 2 tiếng. Muộn hơn, vui lòng liên hệ lễ tân.
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
