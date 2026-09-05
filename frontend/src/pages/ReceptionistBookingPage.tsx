import {
  CalendarOutlined,
  ClockCircleOutlined,
  LockOutlined,
  SearchOutlined,
  UserOutlined,
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
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorsApi } from '../api/doctors';
import { receptionistApi } from '../api/receptionist';
import { PageHeader } from '../components/PageHeader';
import { errorCode, errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { dayOfWeekFromIndex } from '../lib/appointmentStatus';
import { formatDate, formatTime, isPastDate, toApiDate } from '../lib/datetime';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
import { buildSessions, SLOT_MINUTES } from '../lib/slots';
import { initials } from '../lib/user';
import type { DayOfWeek, DoctorSchedule, ReceptionistPatient } from '../types/api';

interface BookingFormValues {
  doctorId?: number;
  appointmentDate?: Dayjs;
  startTime?: string;
  reason?: string;
}

/** Booking conflicts are expected outcomes, not bugs: they mean the slot list is stale. */
const SLOT_CONFLICT_CODES = [
  'APPOINTMENT_SLOT_ALREADY_BOOKED',
  'APPOINTMENT_SLOT_NOT_AVAILABLE',
  'PATIENT_TIME_CONFLICT',
];

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

const PANEL_BG = '#f8fafc';

function LegendDot({ color, border, label }: { color: string; border?: string; label: string }) {
  return (
    <Space size={6}>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          border: border ? `1px solid ${border}` : undefined,
        }}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
        {label}
      </Typography.Text>
    </Space>
  );
}

export function ReceptionistBookingPage() {
  const [draft, setDraft] = useState<{ name: string; phone: string }>({ name: '', phone: '' });
  const [search, setSearch] = useState<{ name?: string; phone?: string }>({});
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  const [patient, setPatient] = useState<ReceptionistPatient | null>(null);
  const [form] = Form.useForm<BookingFormValues>();
  const doctorId = Form.useWatch('doctorId', form);
  const selectedDate = Form.useWatch('appointmentDate', form);
  const selectedSlot = Form.useWatch('startTime', form);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  // The list loads straight away and the inputs narrow it down. A Receptionist already
  // sees patient names across the whole clinic on the appointment screen, and the API
  // returns every patient when called without filters, so withholding the list here
  // would add friction without protecting anything.
  const patientsQuery = useQuery({
    queryKey: ['receptionist-patients', { ...pageQuery, ...search }],
    queryFn: () => receptionistApi.searchPatients({ ...pageQuery, ...search }),
    placeholderData: keepPreviousData,
  });

  const doctorsQuery = useQuery({
    queryKey: ['doctors', { page: 0, size: 100 }],
    queryFn: () => doctorsApi.list({ page: 0, size: 100 }),
  });

  const schedulesQuery = useQuery({
    queryKey: ['doctor-schedules', doctorId],
    queryFn: () => doctorsApi.schedules(doctorId!),
    enabled: doctorId !== undefined,
  });

  const apiDate = selectedDate ? toApiDate(selectedDate) : undefined;

  const slotsQuery = useQuery({
    queryKey: ['available-slots', doctorId, apiDate],
    queryFn: () => doctorsApi.availableSlots(doctorId!, apiDate!),
    enabled: doctorId !== undefined && apiDate !== undefined,
  });

  const schedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);

  const workingDays = useMemo(
    () => new Set(schedules.map((schedule) => schedule.dayOfWeek)),
    [schedules],
  );

  const byWeekday = useMemo(() => {
    const index = new Map<DayOfWeek, DoctorSchedule[]>();
    for (const schedule of schedules) {
      index.set(schedule.dayOfWeek, [...(index.get(schedule.dayOfWeek) ?? []), schedule]);
    }
    return index;
  }, [schedules]);

  /*
   * The API returns only free slots, so the whole schedule window is rebuilt here and the
   * missing ones are drawn as taken. Otherwise a busy day just looks like a short one.
   */
  const sessions = useMemo(() => {
    if (!selectedDate || !apiDate) {
      return [];
    }
    const daySchedules = byWeekday.get(dayOfWeekFromIndex(selectedDate.day())) ?? [];
    return buildSessions(daySchedules, slotsQuery.data?.slots ?? [], apiDate);
  }, [selectedDate, apiDate, byWeekday, slotsQuery.data]);

  const freeCount = sessions.reduce(
    (total, session) => total + session.slots.filter((slot) => slot.state === 'available').length,
    0,
  );

  const bookMutation = useMutation({
    mutationFn: (values: Required<BookingFormValues>) =>
      receptionistApi.bookForPatient({
        patientId: patient!.patientId,
        doctorId: values.doctorId,
        appointmentDate: toApiDate(values.appointmentDate),
        startTime: values.startTime,
        reason: values.reason,
      }),
    onSuccess: () => {
      message.success(`Đã đặt lịch cho ${patient?.fullName}.`);
      navigate('/receptionist/appointments');
    },
    onError: async (error) => {
      if (applyFieldErrors(form, error)) {
        return;
      }

      message.error(errorMessage(error));

      if (SLOT_CONFLICT_CODES.includes(errorCode(error) ?? '')) {
        form.setFieldValue('startTime', undefined);
        await slotsQuery.refetch();
      }
    },
  });

  const runSearch = () => {
    setSearch({ name: draft.name.trim() || undefined, phone: draft.phone.trim() || undefined });
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const patientColumns: ColumnsType<ReceptionistPatient> = [
    {
      title: 'MÃ BN & HỌ VÀ TÊN',
      key: 'identity',
      render: (_, row) => (
        <Space size={10}>
          <Avatar style={{ background: '#e0edff', color: '#1677ff' }}>
            {initials(row.fullName)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ color: '#1677ff' }}>
              {row.fullName}
            </Typography.Text>
            {/* The real patient id; there is no separate patient code or national id. */}
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Mã BN #{row.patientId}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'SỐ ĐIỆN THOẠI',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string | null) => phone ?? '—',
    },
    {
      title: 'NGÀY SINH (TUỔI)',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      width: 190,
      render: (value: string | null) =>
        value ? `${formatDate(value)} (${dayjs().diff(dayjs(value), 'year')} tuổi)` : '—',
    },
    {
      title: 'GIỚI TÍNH',
      dataIndex: 'gender',
      key: 'gender',
      width: 110,
      render: (gender: string | null) =>
        gender ? <Tag style={{ marginInlineEnd: 0 }}>{GENDER_LABEL[gender]}</Tag> : '—',
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      width: 160,
      render: (_, row) => {
        const chosen = patient?.patientId === row.patientId;
        return (
          <Button
            type={chosen ? 'primary' : 'default'}
            icon={chosen ? <UserOutlined /> : undefined}
            onClick={() => setPatient(chosen ? null : row)}
          >
            {chosen ? 'Đang chọn' : 'Chọn bệnh nhân'}
          </Button>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          {
            title: 'Quản lý lịch hẹn',
            href: '#',
            onClick: () => navigate('/receptionist/appointments'),
          },
          { title: 'Đặt lịch hộ bệnh nhân' },
        ]}
      />

      <PageHeader
        title="Đặt lịch hẹn trực tiếp tại quầy"
        description="Chọn bệnh nhân đã có hồ sơ, rồi chọn bác sĩ và ca khám 30 phút."
        onBack={() => navigate('/receptionist/appointments')}
        backLabel="Quản lý lịch hẹn"
      />

      <Card>
        <Steps
          current={patient ? 1 : 0}
          items={[
            { title: 'Bước 1: Chọn bệnh nhân', description: 'Tra cứu theo tên hoặc số điện thoại' },
            { title: 'Bước 2: Chọn lịch khám', description: 'Bác sĩ, ngày trực và khung giờ' },
          ]}
        />
      </Card>

      <Card
        title={
          <Space size={10}>
            <Tag color="blue" style={{ marginInlineEnd: 0, borderRadius: 999 }}>
              1
            </Tag>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Chọn hồ sơ bệnh nhân tiếp nhận</span>
          </Space>
        }
        extra={
          <Tag color={patient ? 'green' : 'orange'} style={{ marginInlineEnd: 0 }}>
            {patient ? 'Đã chọn' : 'Bắt buộc'}
          </Tag>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          message="Lưu ý nghiệp vụ tra cứu"
          description="Chỉ đặt lịch hộ được cho bệnh nhân đã có tài khoản trên hệ thống. Bệnh nhân đến lần đầu cần tự đăng ký tài khoản trước; quầy chưa tạo hồ sơ mới được."
        />

        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} md={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Họ và tên bệnh nhân
            </Typography.Text>
            <Input
              style={{ marginTop: 4 }}
              prefix={<UserOutlined style={{ color: '#98a2b3' }} />}
              placeholder="Nhập tên bệnh nhân"
              value={draft.name}
              onChange={(event) => setDraft((c) => ({ ...c, name: event.target.value }))}
              onPressEnter={runSearch}
            />
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Số điện thoại liên lạc
            </Typography.Text>
            <Input
              style={{ marginTop: 4 }}
              placeholder="Nhập số điện thoại"
              value={draft.phone}
              onChange={(event) => setDraft((c) => ({ ...c, phone: event.target.value }))}
              onPressEnter={runSearch}
            />
          </Col>
          <Col xs={12} md={4}>
            <Button block type="primary" icon={<SearchOutlined />} onClick={runSearch}>
              Tìm kiếm
            </Button>
          </Col>
          <Col xs={12} md={4}>
            <Button
              block
              onClick={() => {
                setDraft({ name: '', phone: '' });
                setSearch({});
                setPageQuery((current) => ({ ...current, page: 0 }));
              }}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>

        {/* A failed search must not look like "no patients found". */}
        {patientsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16 }}
            message={errorMessage(patientsQuery.error)}
          />
        ) : (
          <Typography.Paragraph type="secondary" style={{ margin: '16px 0 8px' }}>
            Kết quả tra cứu khớp trong hệ thống:{' '}
            <Typography.Text strong>{patientsQuery.data?.totalElements ?? 0} hồ sơ</Typography.Text>
          </Typography.Paragraph>
        )}

        <Table<ReceptionistPatient>
          rowKey="patientId"
          size="middle"
          columns={patientColumns}
          dataSource={patientsQuery.isError ? [] : patientsQuery.data?.content}
          loading={patientsQuery.isFetching}
          scroll={{ x: 860 }}
          rowClassName={(row) => (patient?.patientId === row.patientId ? 'ant-table-row-selected' : '')}
          pagination={toTablePagination(patientsQuery.data, pageQuery)}
          onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
          locale={{
            emptyText: patientsQuery.isError
              ? 'Không tải được danh sách'
              : 'Không tìm thấy bệnh nhân nào',
          }}
        />
      </Card>

      <Card
        title={
          <Space size={10}>
            <Tag
              color={patient ? 'blue' : 'default'}
              style={{ marginInlineEnd: 0, borderRadius: 999 }}
            >
              2
            </Tag>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Chọn lịch khám & Bác sĩ phụ trách
            </span>
          </Space>
        }
        extra={
          <Space size={6} style={{ color: '#667085', fontSize: 13 }}>
            <ClockCircleOutlined />
            <span>Thời lượng chuẩn: {SLOT_MINUTES} phút/ca</span>
          </Space>
        }
      >
        {!patient ? (
          <Alert
            type="warning"
            showIcon
            icon={<LockOutlined />}
            message="Chọn bệnh nhân ở Bước 1 để mở phần chọn bác sĩ và ca khám."
          />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => bookMutation.mutate(values as Required<BookingFormValues>)}
            onValuesChange={(changed) => {
              // Changing doctor or date invalidates the chosen slot.
              if ('doctorId' in changed) {
                form.setFieldsValue({ appointmentDate: undefined, startTime: undefined });
              } else if ('appointmentDate' in changed) {
                form.setFieldValue('startTime', undefined);
              }
            }}
          >
            <Card size="small" style={{ background: PANEL_BG, marginBottom: 20 }}>
              <Space size={10}>
                <Avatar style={{ background: '#1677ff' }}>{initials(patient.fullName)}</Avatar>
                <div>
                  <Typography.Text strong>{patient.fullName}</Typography.Text>
                  <div style={{ color: '#667085', fontSize: 12.5 }}>
                    Mã BN #{patient.patientId}
                    {patient.phone ? ` · ${patient.phone}` : ''}
                  </div>
                </div>
              </Space>
            </Card>

            <Row gutter={20}>
              <Col xs={24} md={14}>
                <Form.Item
                  name="doctorId"
                  label="Bác sĩ chuyên khoa phụ trách"
                  extra={
                    doctorId !== undefined && (
                      <Button
                        type="link"
                        size="small"
                        style={{ paddingInline: 0 }}
                        onClick={() => navigate(`/doctors/${doctorId}`)}
                      >
                        Xem hồ sơ bác sĩ
                      </Button>
                    )
                  }
                  rules={[{ required: true, message: 'Vui lòng chọn bác sĩ.' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn bác sĩ"
                    loading={doctorsQuery.isFetching}
                    options={(doctorsQuery.data?.content ?? []).map((doctor) => ({
                      value: doctor.doctorId,
                      label: `${doctor.fullName} — ${doctor.specialty}`,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item
                  name="appointmentDate"
                  label="Ngày khám theo lịch bác sĩ"
                  extra="Chỉ chọn được ngày bác sĩ có ca trực; ngày nghỉ bị làm mờ."
                  rules={[{ required: true, message: 'Vui lòng chọn ngày khám.' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    suffixIcon={<CalendarOutlined />}
                    disabled={doctorId === undefined}
                    disabledDate={(value) =>
                      isPastDate(value) || !workingDays.has(dayOfWeekFromIndex(value.day()))
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="startTime"
              label={
                <Space size={16} wrap>
                  <span>Khung giờ khám ({SLOT_MINUTES} phút/ca)</span>
                  {sessions.length > 0 && (
                    <Space size={12} wrap>
                      <LegendDot color="#1677ff" label="Đang chọn" />
                      <LegendDot color="#ffffff" border="#d0d5dd" label="Còn trống" />
                      <LegendDot color="#f2f4f7" border="#e4e7ec" label="Kín chỗ" />
                    </Space>
                  )}
                </Space>
              }
              rules={[{ required: true, message: 'Vui lòng chọn giờ khám.' }]}
            >
              {!selectedDate ? (
                <Typography.Text type="secondary">Chọn bác sĩ và ngày khám trước.</Typography.Text>
              ) : slotsQuery.isFetching ? (
                <Spin />
              ) : slotsQuery.isError ? (
                // Distinguished from a genuinely full day: the request itself failed.
                <Alert type="error" showIcon message={errorMessage(slotsQuery.error)} />
              ) : freeCount === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không còn ca trống trong ngày này"
                />
              ) : (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {sessions.map((session) => (
                    <div key={session.scheduleId}>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4 }}
                      >
                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                      </Typography.Text>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        {session.slots.map((slot) => {
                          const chosen = selectedSlot === slot.startTime;
                          const disabled = slot.state !== 'available';
                          const end = dayjs(`2000-01-01T${slot.startTime}`).add(
                            SLOT_MINUTES,
                            'minute',
                          );
                          return (
                            <Button
                              key={slot.startTime}
                              type={chosen ? 'primary' : 'default'}
                              disabled={disabled}
                              onClick={() => form.setFieldValue('startTime', slot.startTime)}
                              style={{ height: 'auto', padding: '6px 8px' }}
                            >
                              <div style={{ fontWeight: 600 }}>
                                {formatTime(slot.startTime)} – {end.format('HH:mm')}
                              </div>
                              <div style={{ fontSize: 11.5, opacity: 0.75 }}>
                                {chosen
                                  ? 'Đang chọn'
                                  : slot.state === 'available'
                                    ? 'Còn trống'
                                    : slot.state === 'past'
                                      ? 'Đã qua giờ'
                                      : 'Đã kín chỗ'}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </Form.Item>

            <Form.Item
              name="reason"
              label="Lý do khám & Triệu chứng ban đầu"
              rules={[
                { required: true, message: 'Vui lòng nhập lý do khám.' },
                { max: 500, message: 'Lý do khám tối đa 500 ký tự.' },
              ]}
            >
              <Input.TextArea rows={4} maxLength={500} showCount />
            </Form.Item>

            {selectedSlot && selectedDate && (
              <Alert
                type="info"
                showIcon
                icon={<ClockCircleOutlined />}
                style={{ marginBottom: 16 }}
                message={`Đang đặt ca ${formatTime(selectedSlot)} ngày ${selectedDate.format('DD/MM/YYYY')} cho ${patient.fullName}`}
              />
            )}

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/receptionist/appointments')}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<CalendarOutlined />}
                loading={bookMutation.isPending}
              >
                Xác nhận đặt lịch khám
              </Button>
            </Space>
          </Form>
        )}
      </Card>
    </Space>
  );
}
