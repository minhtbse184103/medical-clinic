import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  MoonOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
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
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

import { adminApi } from '../api/admin';
import { doctorsApi } from '../api/doctors';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { errorCode, errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { DAY_OF_WEEK_LABEL } from '../lib/appointmentStatus';
import { formatTime } from '../lib/datetime';
import { sessionCapacity, SLOT_MINUTES } from '../lib/slots';
import { initials } from '../lib/user';
import type { DayOfWeek, DoctorSchedule } from '../types/api';

const API_TIME_FORMAT = 'HH:mm:ss';

const PANEL_BG = '#f8fafc';

const WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_OPTIONS = WEEK.map((day) => ({ value: day, label: DAY_OF_WEEK_LABEL[day] }));

interface ScheduleFormValues {
  dayOfWeek: DayOfWeek;
  startTime: Dayjs;
  endTime: Dayjs;
}

/** Morning or afternoon, decided by the start time; the API has no session name. */
const isMorning = (schedule: DoctorSchedule) => schedule.startTime < '12:00:00';

/** Length of a shift in hours, for the roster summary. */
function shiftHours(schedule: DoctorSchedule): number {
  const start = dayjs(`2000-01-01T${schedule.startTime}`);
  const end = dayjs(`2000-01-01T${schedule.endTime}`);
  return end.diff(start, 'minute') / 60;
}

export function AdminSchedulesPage() {
  const [doctorId, setDoctorId] = useState<number | undefined>();
  const [editing, setEditing] = useState<DoctorSchedule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form] = Form.useForm<ScheduleFormValues>();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();

  const doctorsQuery = useQuery({
    queryKey: ['doctors', { page: 0, size: 100 }],
    queryFn: () => doctorsApi.list({ page: 0, size: 100 }),
  });

  const schedulesQuery = useQuery({
    queryKey: ['doctor-schedules', doctorId],
    queryFn: () => doctorsApi.schedules(doctorId!),
    enabled: doctorId !== undefined,
  });

  const doctor = doctorsQuery.data?.content.find((row) => row.doctorId === doctorId);

  /** Weekday order, then start time, so the roster reads like a week. */
  const schedules = useMemo(
    () =>
      [...(schedulesQuery.data ?? [])].sort(
        (a, b) =>
          WEEK.indexOf(a.dayOfWeek) - WEEK.indexOf(b.dayOfWeek) ||
          a.startTime.localeCompare(b.startTime),
      ),
    [schedulesQuery.data],
  );

  const totalSlots = schedules.reduce((sum, schedule) => sum + sessionCapacity(schedule), 0);
  const totalHours = schedules.reduce((sum, schedule) => sum + shiftHours(schedule), 0);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['doctor-schedules', doctorId] });

  const closeModal = () => {
    setEditing(null);
    setIsCreating(false);
    form.resetFields();
  };

  const openCreate = () => {
    setEditing(null);
    setIsCreating(true);
    form.resetFields();
  };

  const openEdit = (schedule: DoctorSchedule) => {
    setIsCreating(false);
    setEditing(schedule);
    form.setFieldsValue({
      dayOfWeek: schedule.dayOfWeek,
      startTime: dayjs(schedule.startTime, API_TIME_FORMAT),
      endTime: dayjs(schedule.endTime, API_TIME_FORMAT),
    });
  };

  const saveMutation = useMutation({
    mutationFn: (values: ScheduleFormValues) => {
      const request = {
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime.format(API_TIME_FORMAT),
        endTime: values.endTime.format(API_TIME_FORMAT),
      };
      return editing
        ? adminApi.updateSchedule(doctorId!, editing.scheduleId, request)
        : adminApi.createSchedule(doctorId!, request);
    },
    onSuccess: async () => {
      message.success(editing ? 'Đã cập nhật ca làm việc.' : 'Đã thêm ca làm việc.');
      closeModal();
      await invalidate();
    },
    onError: (saveError) => {
      // DOCTOR_SCHEDULE_OVERLAP and DOCTOR_SCHEDULE_INVALID_TIME_RANGE carry no field errors.
      if (!applyFieldErrors(form, saveError)) {
        message.error(errorMessage(saveError));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: number) => adminApi.deleteSchedule(doctorId!, scheduleId),
    onSuccess: async () => {
      message.success('Đã xóa ca làm việc.');
      await invalidate();
    },
    onError: (deleteError) => {
      if (errorCode(deleteError) === 'DOCTOR_SCHEDULE_HAS_ACTIVE_APPOINTMENTS') {
        message.error('Ca này còn lịch hẹn chưa khám, cần hủy các lịch đó trước khi xóa.');
        return;
      }
      message.error(errorMessage(deleteError));
    },
  });

  const columns: ColumnsType<DoctorSchedule> = [
    {
      title: 'THỨ TRONG TUẦN',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 150,
      render: (day: DayOfWeek) => (
        <Tag color="blue" style={{ marginInlineEnd: 0 }}>
          {DAY_OF_WEEK_LABEL[day]}
        </Tag>
      ),
    },
    {
      title: 'KHUNG GIỜ CA TRỰC',
      key: 'time',
      width: 200,
      render: (_, schedule) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>
            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
          </Typography.Text>
          <Space size={6} style={{ color: '#667085', fontSize: 12.5 }}>
            {isMorning(schedule) ? (
              <SunOutlined style={{ color: '#f59e0b' }} />
            ) : (
              <MoonOutlined style={{ color: '#6366f1' }} />
            )}
            <span>
              {isMorning(schedule) ? 'Ca sáng' : 'Ca chiều'} ({shiftHours(schedule).toFixed(1)} giờ)
            </span>
          </Space>
        </Space>
      ),
    },
    {
      title: `SLOT ${SLOT_MINUTES} PHÚT SINH RA`,
      key: 'slots',
      width: 180,
      // Derived, not stored: this is what patients will actually be offered.
      render: (_, schedule) => (
        <Tag color="green" style={{ marginInlineEnd: 0 }}>
          {sessionCapacity(schedule)} slot khám
        </Tag>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      width: 190,
      render: (_, schedule) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(schedule)}>
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xóa ca làm việc này?"
            description="Không xóa được nếu ca còn lịch hẹn chưa khám."
            okText="Xóa"
            cancelText="Đóng"
            onConfirm={() => deleteMutation.mutate(schedule.scheduleId)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[{ title: 'Quản trị hệ thống' }, { title: 'Quản lý lịch làm việc bác sĩ' }]}
      />

      <PageHeader
        title="Quản lý lịch làm việc hàng tuần của bác sĩ"
        description="Phân bổ ca trực định kỳ và kiểm soát số lượng ca khám 30 phút sinh ra từ mỗi ca."
      />

      {/* Why this screen matters: these rows are what generates every bookable slot. */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Cơ chế lặp lại ca trực hàng tuần"
        description={`Lịch trực được thiết lập một lần và lặp lại mỗi tuần. Hệ thống tự sinh các khung giờ khám ${SLOT_MINUTES} phút tương ứng cho từng ca để bệnh nhân và lễ tân đặt lịch.`}
      />

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
              Chọn bác sĩ để quản lý lịch trực
            </Typography.Text>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn bác sĩ"
              style={{ width: '100%', marginTop: 4 }}
              loading={doctorsQuery.isFetching}
              value={doctorId}
              options={(doctorsQuery.data?.content ?? []).map((row) => ({
                value: row.doctorId,
                label: `${row.fullName} — ${row.specialty}`,
              }))}
              onChange={setDoctorId}
            />
          </Col>
          {doctor && (
            <Col xs={24} md={10}>
              <Card size="small" style={{ background: PANEL_BG }}>
                <Space size={10}>
                  <Avatar style={{ background: '#1677ff' }}>{initials(doctor.fullName)}</Avatar>
                  <div>
                    <Typography.Text strong>BS. {doctor.fullName}</Typography.Text>
                    <div>
                      <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                        {doctor.specialty}
                      </Tag>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </Card>

      {doctorId === undefined ? (
        <Card>
          <Typography.Text type="secondary">
            Chọn một bác sĩ để xem và sửa lịch làm việc.
          </Typography.Text>
        </Card>
      ) : (
        <>
          {schedulesQuery.isError && (
            <Alert type="error" showIcon message={errorMessage(schedulesQuery.error)} />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <StatCard
                title="Ca trực trong tuần"
                value={schedules.length}
                loading={schedulesQuery.isFetching}
                icon={<ClockCircleOutlined />}
                footer="Lặp lại mỗi 7 ngày"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title={`Slot ${SLOT_MINUTES} phút sinh ra`}
                value={totalSlots}
                loading={schedulesQuery.isFetching}
                icon={<SunOutlined />}
                footer="Số ca bệnh nhân đặt được mỗi tuần"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Tổng thời lượng khám"
                value={`${totalHours.toFixed(1)} giờ`}
                loading={schedulesQuery.isFetching}
                icon={<MoonOutlined />}
                footer="Cộng dồn các ca trong tuần"
              />
            </Col>
          </Row>

          <Card
            title={
              <Space size={10} wrap>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Lịch phân ca cố định</span>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  Tuần hoàn mỗi 7 ngày
                </Tag>
              </Space>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Thêm ca làm việc
              </Button>
            }
          >
            <Table<DoctorSchedule>
              rowKey="scheduleId"
              columns={columns}
              dataSource={schedulesQuery.isError ? [] : schedules}
              loading={schedulesQuery.isFetching}
              pagination={false}
              scroll={{ x: 760 }}
              locale={{
                emptyText: schedulesQuery.isError
                  ? 'Không tải được lịch làm việc'
                  : 'Bác sĩ chưa có ca làm việc nào',
              }}
            />

            {schedules.length > 0 && (
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                Tổng cộng: <b>{schedules.length}</b> ca làm việc lặp lại trong tuần · Tổng thời
                lượng khám: <b>{totalHours.toFixed(1)} giờ</b> · <b>{totalSlots}</b> slot khám
              </Typography.Text>
            )}
          </Card>

          {/* The rule behind DOCTOR_SCHEDULE_HAS_ACTIVE_APPOINTMENTS. */}
          <Card>
            <Space size={10} align="start">
              <SafetyCertificateOutlined style={{ color: '#1677ff', marginTop: 3 }} />
              <div>
                <Typography.Text strong>Chính sách khóa ca bảo vệ bệnh nhân</Typography.Text>
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 0, marginTop: 6, fontSize: 13 }}
                >
                  Ca làm việc còn lịch hẹn chưa khám sẽ không xóa được, để bệnh nhân không bị mất
                  lịch đột ngột. Muốn xóa thì lễ tân phải hủy hoặc dời các lịch hẹn đó trước. Sửa
                  giờ ca cũng không được nếu khung giờ mới trùng với ca khác của cùng bác sĩ.
                </Typography.Paragraph>
              </div>
            </Space>
          </Card>
        </>
      )}

      <Modal
        open={isCreating || editing !== null}
        title={editing ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}
        okText="Lưu"
        cancelText="Đóng"
        confirmLoading={saveMutation.isPending}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item
            name="dayOfWeek"
            label="Thứ"
            rules={[{ required: true, message: 'Vui lòng chọn thứ.' }]}
          >
            <Select options={DAY_OPTIONS} placeholder="Chọn thứ" />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Giờ bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu.' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="Giờ kết thúc"
            dependencies={['startTime']}
            extra={`Khoảng thời gian lẻ dưới ${SLOT_MINUTES} phút ở cuối ca sẽ không sinh ra slot nào.`}
            rules={[
              { required: true, message: 'Vui lòng chọn giờ kết thúc.' },
              // The backend enforces this too; checking here avoids a pointless round trip.
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs | undefined) {
                  const startTime = getFieldValue('startTime') as Dayjs | undefined;
                  if (!value || !startTime || value.isAfter(startTime)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu.'));
                },
              }),
            ]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
