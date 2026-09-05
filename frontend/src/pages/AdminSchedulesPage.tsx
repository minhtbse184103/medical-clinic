import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  TimePicker,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

import { adminApi } from '../api/admin';
import { doctorsApi } from '../api/doctors';
import { errorCode, errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { DAY_OF_WEEK_LABEL } from '../lib/appointmentStatus';
import { formatTime } from '../lib/datetime';
import type { DayOfWeek, DoctorSchedule } from '../types/api';

const API_TIME_FORMAT = 'HH:mm:ss';

const DAY_OPTIONS = (Object.keys(DAY_OF_WEEK_LABEL) as DayOfWeek[]).map((day) => ({
  value: day,
  label: DAY_OF_WEEK_LABEL[day],
}));

interface ScheduleFormValues {
  dayOfWeek: DayOfWeek;
  startTime: Dayjs;
  endTime: Dayjs;
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
      title: 'Thứ',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (day: DayOfWeek) => DAY_OF_WEEK_LABEL[day],
    },
    {
      title: 'Giờ làm việc',
      key: 'time',
      render: (_, schedule) => `${formatTime(schedule.startTime)} – ${formatTime(schedule.endTime)}`,
    },
    {
      title: '',
      key: 'actions',
      width: 180,
      render: (_, schedule) => (
        <Space>
          <Button onClick={() => openEdit(schedule)}>Sửa</Button>
          <Popconfirm
            title="Xóa ca làm việc này?"
            description="Không xóa được nếu ca còn lịch hẹn chưa khám."
            okText="Xóa"
            cancelText="Đóng"
            onConfirm={() => deleteMutation.mutate(schedule.scheduleId)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Lịch làm việc của bác sĩ
      </Typography.Title>

      <Alert
        type="info"
        showIcon
        message="Lịch làm việc lặp lại hàng tuần"
        description="Các ca khám 30 phút được sinh ra từ đây. Chỉ hiện bác sĩ đang hoạt động."
      />

      <Card>
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Chọn bác sĩ"
          style={{ minWidth: 320 }}
          loading={doctorsQuery.isFetching}
          value={doctorId}
          options={(doctorsQuery.data?.content ?? []).map((doctor) => ({
            value: doctor.doctorId,
            label: `${doctor.fullName} — ${doctor.specialty}`,
          }))}
          onChange={setDoctorId}
        />
      </Card>

      {doctorId === undefined ? (
        <Typography.Text type="secondary">Chọn một bác sĩ để xem lịch làm việc.</Typography.Text>
      ) : (
        <>
          {schedulesQuery.isError && (
            <Alert type="error" showIcon message={errorMessage(schedulesQuery.error)} />
          )}

          <Button type="primary" onClick={openCreate}>
            Thêm ca làm việc
          </Button>

          <Table<DoctorSchedule>
            rowKey="scheduleId"
            columns={columns}
            dataSource={schedulesQuery.isError ? [] : schedulesQuery.data}
            loading={schedulesQuery.isFetching}
            pagination={false}
            locale={{
              emptyText: schedulesQuery.isError
                ? 'Không tải được lịch làm việc'
                : 'Bác sĩ chưa có ca làm việc nào',
            }}
          />
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
