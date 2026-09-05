import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Radio,
  Skeleton,
  Space,
  Spin,
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

export function DoctorDetailPage() {
  const { doctorId: doctorIdParam } = useParams<{ doctorId: string }>();
  const doctorId = Number(doctorIdParam);
  const [form] = Form.useForm<BookingFormValues>();
  const selectedDate = Form.useWatch('appointmentDate', form);
  const { user } = useAuth();
  const navigate = useNavigate();

  const canBook = user?.role === 'PATIENT';
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();

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

  // The doctor only works on the weekdays present in the weekly schedule, so every other
  // day is blocked in the picker instead of letting the backend reject the booking.
  const workingDays = useMemo(
    () => new Set((schedulesQuery.data ?? []).map((schedule) => schedule.dayOfWeek)),
    [schedulesQuery.data],
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

      // Someone else took the slot, so refresh the list and clear the stale choice.
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
  const slots = slotsQuery.data?.slots ?? [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={doctor.fullName}
        description={doctor.specialty}
        onBack={() => navigate('/doctors')}
        backLabel="Danh sách bác sĩ"
      />

      <Card title="Thông tin bác sĩ">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Chuyên khoa">{doctor.specialty}</Descriptions.Item>
          <Descriptions.Item label="Điện thoại">{doctor.phone ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Giới thiệu">{doctor.bio ?? '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Lịch làm việc hàng tuần" loading={schedulesQuery.isPending}>
        {schedulesQuery.data && schedulesQuery.data.length > 0 ? (
          <Space direction="vertical">
            {schedulesQuery.data.map((schedule) => (
              <span key={schedule.scheduleId}>
                <Tag color="blue">{DAY_OF_WEEK_LABEL[schedule.dayOfWeek]}</Tag>
                {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
              </span>
            ))}
          </Space>
        ) : (
          <Empty description="Bác sĩ chưa có lịch làm việc" />
        )}
      </Card>

      {/*
        Booking is a PATIENT-only endpoint. Other roles still see the doctor's information
        and weekly schedule above; a Receptionist books through their own screen instead.
      */}
      {!canBook ? (
        <Card title="Đặt lịch khám">
          <Typography.Text type="secondary">
            {user?.role === 'RECEPTIONIST'
              ? 'Lễ tân đặt lịch cho bệnh nhân ở màn hình Quản lý lịch hẹn.'
              : 'Chỉ bệnh nhân mới đặt được lịch khám.'}
          </Typography.Text>
        </Card>
      ) : (
      <Card title="Đặt lịch khám">
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
            label="Ngày khám"
            rules={[{ required: true, message: 'Vui lòng chọn ngày khám.' }]}
          >
            <DatePicker
              style={{ maxWidth: 280 }}
              format="DD/MM/YYYY"
              disabledDate={(value) =>
                isPastDate(value) || !workingDays.has(dayOfWeekFromIndex(value.day()))
              }
            />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Giờ khám"
            rules={[{ required: true, message: 'Vui lòng chọn giờ khám.' }]}
            extra="Mỗi ca khám kéo dài 30 phút."
          >
            {!selectedDate ? (
              <Typography.Text type="secondary">Chọn ngày khám trước.</Typography.Text>
            ) : slotsQuery.isFetching ? (
              <Spin />
            ) : slotsQuery.isError ? (
              // Distinguished from a genuinely full day: the request itself failed.
              <Alert type="error" showIcon message={errorMessage(slotsQuery.error)} />
            ) : slots.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không còn ca trống trong ngày này"
              />
            ) : (
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={slots.map((slot) => ({
                  // The backend expects the slot's start time exactly as it produced it.
                  value: slot.startTime,
                  label: formatTime(slot.startTime),
                }))}
              />
            )}
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do khám"
            rules={[
              { required: true, message: 'Vui lòng nhập lý do khám.' },
              { max: 500, message: 'Lý do khám tối đa 500 ký tự.' },
            ]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount style={{ maxWidth: 560 }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={bookMutation.isPending}>
            Xác nhận đặt lịch
          </Button>
        </Form>
      </Card>
      )}
    </Space>
  );
}
