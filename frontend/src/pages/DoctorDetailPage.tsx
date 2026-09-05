import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { appointmentsApi } from '../api/appointments';
import { doctorsApi } from '../api/doctors';
import { useAuth } from '../auth/useAuth';
import { PageHeader } from '../components/PageHeader';
import { errorCode, errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { DAY_OF_WEEK_LABEL, dayOfWeekFromIndex } from '../lib/appointmentStatus';
import { formatTime, isPastDate, toApiDate } from '../lib/datetime';
import { buildSessions, sessionCapacity, SLOT_MINUTES } from '../lib/slots';
import { initials } from '../lib/user';
import type { DayOfWeek, DoctorSchedule } from '../types/api';

interface BookingFormValues {
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

const WEEK_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export function DoctorDetailPage() {
  const { doctorId: doctorIdParam } = useParams<{ doctorId: string }>();
  const doctorId = Number(doctorIdParam);
  const [form] = Form.useForm<BookingFormValues>();
  const selectedDate = Form.useWatch('appointmentDate', form);
  const selectedSlot = Form.useWatch('startTime', form);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();

  const canBook = user?.role === 'PATIENT';

  const doctorQuery = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorsApi.get(doctorId),
    enabled: Number.isFinite(doctorId),
  });

  const schedulesQuery = useQuery({
    queryKey: ['doctor-schedules', doctorId],
    queryFn: () => doctorsApi.schedules(doctorId),
    enabled: Number.isFinite(doctorId),
  });

  const apiDate = selectedDate ? toApiDate(selectedDate) : undefined;

  const slotsQuery = useQuery({
    queryKey: ['available-slots', doctorId, apiDate],
    queryFn: () => doctorsApi.availableSlots(doctorId, apiDate!),
    enabled: Number.isFinite(doctorId) && apiDate !== undefined,
  });

  const schedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);

  /** Weekdays the doctor works, used to disable the rest of the calendar. */
  const workingDays = useMemo(
    () => new Set(schedules.map((schedule) => schedule.dayOfWeek)),
    [schedules],
  );

  const byWeekday = useMemo(() => {
    const map = new Map<DayOfWeek, DoctorSchedule[]>();
    for (const schedule of schedules) {
      map.set(schedule.dayOfWeek, [...(map.get(schedule.dayOfWeek) ?? []), schedule]);
    }
    return map;
  }, [schedules]);

  /* Full grid for the chosen day, so booked slots stay visible rather than disappearing. */
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
      appointmentsApi.book({
        doctorId,
        appointmentDate: toApiDate(values.appointmentDate),
        startTime: values.startTime,
        reason: values.reason,
      }),
    onSuccess: async () => {
      message.success('Đặt lịch thành công. Lịch hẹn đang chờ lễ tân xác nhận.');
      await queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      navigate('/appointments');
    },
    onError: async (error) => {
      if (applyFieldErrors(form, error)) {
        return;
      }
      message.error(errorMessage(error));

      // Someone else took the slot, so refresh the grid and clear the stale choice.
      if (SLOT_CONFLICT_CODES.includes(errorCode(error) ?? '')) {
        form.setFieldValue('startTime', undefined);
        await slotsQuery.refetch();
      }
    },
  });

  if (doctorQuery.isPending) {
    return <Skeleton active />;
  }

  if (doctorQuery.isError || !doctorQuery.data) {
    return <Alert type="error" showIcon message={errorMessage(doctorQuery.error)} />;
  }

  const doctor = doctorQuery.data;
  const workingDayLabels = WEEK_ORDER.filter((day) => workingDays.has(day)).map(
    (day) => DAY_OF_WEEK_LABEL[day],
  );

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PageHeader
        title="Thông tin bác sĩ"
        onBack={() => navigate('/doctors')}
        backLabel="Danh bạ bác sĩ"
      />

      <Card>
        <Space align="start" size={16} wrap>
          <Avatar size={64} style={{ background: '#e6f4ff', color: '#1677ff', fontWeight: 700 }}>
            {initials(doctor.fullName)}
          </Avatar>
          <div>
            <Space size={10} wrap>
              <Typography.Title level={4} style={{ margin: 0 }}>
                BS. {doctor.fullName}
              </Typography.Title>
              {/* Only ACTIVE doctors are returned at all, so being listed means being available. */}
              {schedules.length > 0 && (
                <Tag color="green" style={{ marginInlineEnd: 0 }}>
                  ● Đang nhận lịch khám
                </Tag>
              )}
            </Space>
            <div style={{ marginTop: 8 }}>
              <Space size={16} wrap>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  {doctor.specialty}
                </Tag>
                {doctor.phone && (
                  <Space size={6} style={{ color: '#667085' }}>
                    <PhoneOutlined />
                    <span>{doctor.phone}</span>
                  </Space>
                )}
              </Space>
            </div>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={canBook ? 13 : 24}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <Space size={10}>
                  <CheckCircleOutlined style={{ color: '#1677ff' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Giới thiệu</span>
                </Space>
              }
            >
              {doctor.bio ? (
                <Typography.Paragraph style={{ marginBottom: 0, lineHeight: 1.9 }}>
                  {doctor.bio}
                </Typography.Paragraph>
              ) : (
                <Typography.Text type="secondary">Bác sĩ chưa cập nhật giới thiệu.</Typography.Text>
              )}
            </Card>

            <Card
              title={
                <Space size={10}>
                  <CalendarOutlined style={{ color: '#0d9488' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Lịch làm việc hàng tuần</span>
                </Space>
              }
              loading={schedulesQuery.isPending}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {WEEK_ORDER.map((day) => {
                  const daySchedules = (byWeekday.get(day) ?? []).sort((a, b) =>
                    a.startTime.localeCompare(b.startTime),
                  );
                  const working = daySchedules.length > 0;

                  return (
                    <div
                      key={day}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 12,
                        borderRadius: 12,
                        background: working ? '#f8fafc' : undefined,
                        opacity: working ? 1 : 0.6,
                      }}
                    >
                      <Tag
                        color={working ? 'blue' : 'default'}
                        style={{ marginInlineEnd: 0, width: 92, textAlign: 'center' }}
                      >
                        {DAY_OF_WEEK_LABEL[day]}
                      </Tag>

                      {working ? (
                        <Space size={20} wrap style={{ flex: 1 }}>
                          {daySchedules.map((schedule) => (
                            <Space key={schedule.scheduleId} direction="vertical" size={0}>
                              <Typography.Text strong>
                                {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                              </Typography.Text>
                              {/* Derived from the window, not a configured limit. */}
                              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                                Tối đa {sessionCapacity(schedule)} ca · {SLOT_MINUTES} phút/ca
                              </Typography.Text>
                            </Space>
                          ))}
                        </Space>
                      ) : (
                        <Typography.Text type="secondary" style={{ flex: 1 }}>
                          Không có lịch khám
                        </Typography.Text>
                      )}
                    </div>
                  );
                })}
              </Space>
            </Card>
          </Space>
        </Col>

        {canBook && (
          <Col xs={24} xl={11}>
            <Card
              title={
                <Space size={10}>
                  <CalendarOutlined style={{ color: '#1677ff' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Đặt lịch khám</span>
                </Space>
              }
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => bookMutation.mutate(values as Required<BookingFormValues>)}
                onValuesChange={(changed) => {
                  // A slot belongs to one specific day, so changing the date invalidates it.
                  if ('appointmentDate' in changed) {
                    form.setFieldValue('startTime', undefined);
                  }
                }}
              >
                <Form.Item
                  name="appointmentDate"
                  label={
                    <Space size={8} wrap>
                      <span>1. Chọn ngày khám</span>
                      {workingDayLabels.length > 0 && (
                        <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
                          Chỉ nhận {workingDayLabels.join(', ')}
                        </Typography.Text>
                      )}
                    </Space>
                  }
                  rules={[{ required: true, message: 'Vui lòng chọn ngày khám.' }]}
                  extra={
                    selectedDate ? (
                      <Space size={6} style={{ color: '#389e0d' }}>
                        <CheckCircleOutlined />
                        <span>
                          Ngày hợp lệ · {DAY_OF_WEEK_LABEL[dayOfWeekFromIndex(selectedDate.day())]},{' '}
                          {selectedDate.format('DD/MM/YYYY')}
                        </span>
                      </Space>
                    ) : undefined
                  }
                >
                  <DatePicker
                    size="large"
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày khám"
                    disabledDate={(value) =>
                      isPastDate(value) || !workingDays.has(dayOfWeekFromIndex(value.day()))
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="startTime"
                  label={
                    <Space size={8} wrap>
                      <span>2. Khung giờ còn trống</span>
                      <Tag style={{ marginInlineEnd: 0 }}>{SLOT_MINUTES} phút / ca</Tag>
                    </Space>
                  }
                  rules={[{ required: true, message: 'Vui lòng chọn giờ khám.' }]}
                >
                  {!selectedDate ? (
                    <Typography.Text type="secondary">Chọn ngày khám trước.</Typography.Text>
                  ) : slotsQuery.isFetching ? (
                    <Skeleton active paragraph={{ rows: 2 }} />
                  ) : slotsQuery.isError ? (
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
                              gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                              gap: 8,
                              marginTop: 8,
                            }}
                          >
                            {session.slots.map((slot) => {
                              const chosen = selectedSlot === slot.startTime;
                              const disabled = slot.state !== 'available';
                              return (
                                <Button
                                  key={slot.startTime}
                                  type={chosen ? 'primary' : 'default'}
                                  disabled={disabled}
                                  onClick={() => form.setFieldValue('startTime', slot.startTime)}
                                  style={
                                    disabled
                                      ? { textDecoration: 'line-through', opacity: 0.55 }
                                      : undefined
                                  }
                                >
                                  {formatTime(slot.startTime)}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                        Ca gạch ngang là đã có người đặt hoặc đã qua giờ.
                      </Typography.Text>
                    </Space>
                  )}
                </Form.Item>

                {selectedSlot && selectedDate && (
                  <Alert
                    type="info"
                    showIcon
                    icon={<ClockCircleOutlined />}
                    style={{ marginBottom: 16 }}
                    message={`Đang chọn ca ${formatTime(selectedSlot)} ngày ${selectedDate.format('DD/MM/YYYY')}`}
                  />
                )}

                <Form.Item
                  name="reason"
                  label="3. Lý do khám / Triệu chứng"
                  rules={[
                    { required: true, message: 'Vui lòng nhập lý do khám.' },
                    { max: 500, message: 'Lý do khám tối đa 500 ký tự.' },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    maxLength={500}
                    showCount
                    placeholder="Mô tả triệu chứng, tiền sử hoặc lý do tái khám..."
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  icon={<CalendarOutlined />}
                  loading={bookMutation.isPending}
                  style={{ height: 48, fontWeight: 600 }}
                >
                  Xác nhận đặt lịch khám
                </Button>

                <Typography.Paragraph
                  type="secondary"
                  style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0, lineHeight: 1.7 }}
                >
                  Lịch hẹn được tạo ở trạng thái chờ xác nhận và sẽ do lễ tân duyệt. Bạn theo dõi
                  trạng thái ở mục Lịch hẹn của tôi.
                </Typography.Paragraph>
              </Form>
            </Card>
          </Col>
        )}
      </Row>

      {!canBook && (
        <Alert
          type="info"
          showIcon
          message={
            user?.role === 'RECEPTIONIST'
              ? 'Lễ tân đặt lịch cho bệnh nhân ở màn hình Quản lý lịch hẹn.'
              : 'Chỉ bệnh nhân mới đặt được lịch khám.'
          }
        />
      )}
    </Space>
  );
}
