import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorApi } from '../api/doctor';
import { doctorsApi } from '../api/doctors';
import { errorMessage } from '../lib/apiError';
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_LABEL,
  dayOfWeekFromIndex,
  isReadyToExamine,
} from '../lib/appointmentStatus';
import { formatTime, toApiDate } from '../lib/datetime';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
import type { AppointmentStatus, DoctorAppointment, DoctorAppointmentQuery } from '../types/api';

const STATUS_OPTIONS = (Object.keys(APPOINTMENT_STATUS_LABEL) as AppointmentStatus[]).map(
  (status) => ({ value: status, label: APPOINTMENT_STATUS_LABEL[status] }),
);

interface SlotState {
  label: string;
  color: string;
  /** The visit is happening right now, so its row is emphasised. */
  current: boolean;
}

/**
 * What the doctor needs to read off the time column. The stored status alone does not
 * distinguish a confirmed visit still ahead from one whose turn has come, which is exactly
 * when the examine button unlocks.
 */
function slotState(row: DoctorAppointment): SlotState {
  const now = dayjs();
  const start = dayjs(`${row.appointmentDate}T${row.startTime}`);
  const end = dayjs(`${row.appointmentDate}T${row.endTime}`);
  const current = !now.isBefore(start) && now.isBefore(end);

  switch (row.status) {
    case 'CANCELLED':
      return { label: 'Ca đã hủy', color: '#ff4d4f', current: false };
    case 'COMPLETED':
      return { label: 'Đã hoàn tất kết luận', color: '#52c41a', current: false };
    case 'PENDING':
      return { label: 'Chờ lễ tân xác nhận', color: '#faad14', current: false };
    default:
      if (current) {
        return { label: 'Đang trong khung giờ khám', color: '#1677ff', current: true };
      }
      return now.isBefore(start)
        ? { label: 'Chưa tới giờ khám', color: '#667085', current: false }
        : { label: 'Đã quá giờ hẹn', color: '#d48806', current: false };
  }
}

export function DoctorAppointmentsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  const [filters, setFilters] = useState<{ date?: string; status?: AppointmentStatus }>({
    date: toApiDate(dayjs()),
  });
  const [draft, setDraft] = useState<{ date?: Dayjs; status?: AppointmentStatus }>({
    date: dayjs(),
  });
  const navigate = useNavigate();

  const query: DoctorAppointmentQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['doctor-appointments', query],
    queryFn: () => doctorApi.appointments(query),
    placeholderData: keepPreviousData,
  });

  const profile = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorApi.profile(),
  });

  const schedules = useQuery({
    queryKey: ['doctor-schedules', profile.data?.doctorId],
    queryFn: () => doctorsApi.schedules(profile.data!.doctorId),
    enabled: profile.data !== undefined,
  });

  /** Shift covering the day being viewed, so the header says which session this is. */
  const shift = useMemo(() => {
    if (!filters.date) return undefined;
    const weekday = dayOfWeekFromIndex(dayjs(filters.date).day());
    return (schedules.data ?? [])
      .filter((schedule) => schedule.dayOfWeek === weekday)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules.data, filters.date]);

  const rows = data?.content ?? [];
  const active = rows.filter((row) => row.status !== 'CANCELLED');
  const readyNow = active.filter(isReadyToExamine).length;
  const done = active.filter((row) => row.status === 'COMPLETED').length;

  const applyFilters = () => {
    setFilters({
      date: draft.date ? toApiDate(draft.date) : undefined,
      status: draft.status,
    });
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const resetFilters = () => {
    setDraft({ date: dayjs() });
    setFilters({ date: toApiDate(dayjs()) });
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const columns: ColumnsType<DoctorAppointment> = [
    {
      title: 'KHUNG GIỜ',
      key: 'slot',
      width: 210,
      render: (_, row) => {
        const state = slotState(row);
        const cancelled = row.status === 'CANCELLED';
        return (
          <Space direction="vertical" size={4}>
            <Tag
              color={state.current ? 'blue' : 'default'}
              icon={<ClockCircleOutlined />}
              style={{
                marginInlineEnd: 0,
                fontSize: 13,
                padding: '4px 10px',
                textDecoration: cancelled ? 'line-through' : undefined,
              }}
            >
              {formatTime(row.startTime)} – {formatTime(row.endTime)}
            </Tag>
            <Typography.Text style={{ fontSize: 12.5, color: state.color }}>
              {state.label}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: 'BỆNH NHÂN',
      key: 'patient',
      width: 200,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{row.patientFullName}</Typography.Text>
          {/* Age, gender and insurance are not in this response, and no endpoint gives a
              doctor a patient's profile, so the row carries the patient id only. */}
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            Mã BN: #{row.patientId}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'LÝ DO KHÁM / TRIỆU CHỨNG',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string, row) =>
        row.status === 'CANCELLED' ? (
          <Typography.Text type="secondary" italic>
            {reason}
          </Typography.Text>
        ) : (
          <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{reason}</Typography.Text>
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
      title: 'THAO TÁC',
      key: 'actions',
      width: 230,
      render: (_, row) => {
        const ready = isReadyToExamine(row);
        const state = slotState(row);

        return (
          <Space>
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/doctor/patients/${row.patientId}`)}
            >
              Bệnh án cũ
            </Button>

            {row.status === 'COMPLETED' ? (
              <Button
                size="small"
                onClick={() => navigate(`/doctor/appointments/${row.appointmentId}/examine`)}
              >
                Xem lại
              </Button>
            ) : ready ? (
              <Button
                type="primary"
                size="small"
                icon={<MedicineBoxOutlined />}
                onClick={() => navigate(`/doctor/appointments/${row.appointmentId}/examine`)}
              >
                Khám
              </Button>
            ) : (
              /* Kept visible but disabled, so the reason it cannot start is on screen. */
              <Tooltip
                title={
                  row.status === 'PENDING'
                    ? 'Lễ tân chưa xác nhận lịch hẹn này'
                    : row.status === 'CANCELLED'
                      ? 'Ca khám đã bị hủy'
                      : 'Chưa tới giờ khám'
                }
              >
                <Button size="small" disabled>
                  {row.status === 'PENDING'
                    ? 'Chờ xác nhận'
                    : row.status === 'CANCELLED'
                      ? 'Đã hủy'
                      : state.label === 'Đã quá giờ hẹn'
                        ? 'Quá giờ'
                        : 'Chờ giờ'}
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/', title: <HomeOutlined />, onClick: () => navigate('/') },
          { title: 'Lịch khám của tôi' },
        ]}
      />

      <Card>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size={10} wrap>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Danh sách ca khám bệnh
              </Typography.Title>
              {shift && shift.length > 0 && (
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  Ca làm việc: {shift.map((s) => `${formatTime(s.startTime)}–${formatTime(s.endTime)}`).join(', ')}
                </Tag>
              )}
            </Space>
            {profile.data && (
              <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                BS. {profile.data.fullName} · {profile.data.specialty} · Mã BS: #
                {profile.data.doctorId}
              </Typography.Paragraph>
            )}
          </Col>
          <Col>
            <Space size={12} wrap>
              <Card size="small" styles={{ body: { padding: '8px 16px' } }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Tổng ca
                </Typography.Text>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{active.length}</div>
              </Card>
              <Card
                size="small"
                styles={{ body: { padding: '8px 16px' } }}
                style={readyNow > 0 ? { borderColor: '#faad14', background: '#fffbe6' } : undefined}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Sẵn sàng khám
                </Typography.Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: readyNow > 0 ? '#d48806' : undefined }}>
                  {readyNow}
                </div>
              </Card>
              <Card size="small" styles={{ body: { padding: '8px 16px' } }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Đã hoàn thành
                </Typography.Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#389e0d' }}>{done}</div>
              </Card>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* This is the backend rule, stated exactly: MedicalRecordService requires both. */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Quy trình khám bệnh"
        description="Nút Khám chỉ mở với ca đã được lễ tân xác nhận và đã tới giờ hẹn. Các ca khác giữ nút ở trạng thái vô hiệu kèm lý do, để thứ tự tiếp nhận không bị đảo."
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Form layout="vertical" onFinish={applyFilters}>
          <Row gutter={16} align="bottom">
            <Col xs={24} md={8}>
              <Form.Item label="Ngày khám bệnh" style={{ marginBottom: 0 }}>
                <DatePicker
                  size="large"
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Tất cả các ngày"
                  value={draft.date}
                  onChange={(date) => setDraft((c) => ({ ...c, date: date ?? undefined }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Trạng thái ca khám" style={{ marginBottom: 0 }}>
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
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" size="large" icon={<FilterOutlined />} htmlType="submit">
                  Lọc dữ liệu
                </Button>
                <Button size="large" icon={<ReloadOutlined />} onClick={resetFilters}>
                  Đặt lại
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Space align="center" size={16} wrap style={{ color: '#667085' }}>
        <Space size={6}>
          <CalendarOutlined />
          <span>
            {filters.date
              ? `Ca khám ngày ${dayjs(filters.date).format('DD/MM/YYYY')}`
              : 'Tất cả các ngày'}
          </span>
        </Space>
        <Space size={6}>
          <ClockCircleOutlined />
          <span>Thời gian hệ thống: {dayjs().format('HH:mm')}</span>
        </Space>
      </Space>

      <Card styles={{ body: { padding: 0 } }}>
        <Table<DoctorAppointment>
          rowKey="appointmentId"
          columns={columns}
          dataSource={error ? [] : rows}
          loading={isFetching}
          rowClassName={(row) => (slotState(row).current ? 'ant-table-row-selected' : '')}
          pagination={{
            ...toTablePagination(data, pageQuery),
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} – ${range[1]} trong tổng số ${total} ca khám`,
          }}
          onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filters.date
                    ? 'Không có ca khám nào trong ngày này'
                    : 'Chưa có ca khám nào'
                }
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
}
