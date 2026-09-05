import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorsApi } from '../api/doctors';
import { receptionistApi } from '../api/receptionist';
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
import type { ReceptionistPatient } from '../types/api';

interface BookingFormValues {
  doctorId?: number;
  appointmentDate?: Dayjs;
  startTime?: string;
  reason?: string;
}

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

export function ReceptionistBookingPage() {
  const [search, setSearch] = useState<{ name?: string; phone?: string }>({});
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  const [patient, setPatient] = useState<ReceptionistPatient | null>(null);
  const [form] = Form.useForm<BookingFormValues>();
  const doctorId = Form.useWatch('doctorId', form);
  const selectedDate = Form.useWatch('appointmentDate', form);
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

  const workingDays = useMemo(
    () => new Set((schedulesQuery.data ?? []).map((schedule) => schedule.dayOfWeek)),
    [schedulesQuery.data],
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

  const patientColumns: ColumnsType<ReceptionistPatient> = [
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone ?? '—',
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (value: string | null) => (value ? formatDate(value) : '—'),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string | null) => (gender ? GENDER_LABEL[gender] : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) => (
        <Button type="primary" onClick={() => setPatient(row)}>
          Chọn
        </Button>
      ),
    },
  ];

  const slots = slotsQuery.data?.slots ?? [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button onClick={() => navigate('/receptionist/appointments')}>← Quản lý lịch hẹn</Button>

      <Typography.Title level={4} style={{ margin: 0 }}>
        Đặt lịch hộ bệnh nhân
      </Typography.Title>

      <Card title="1. Chọn bệnh nhân">
        {patient ? (
          <Space direction="vertical">
            <Space>
              <Tag color="green">Đã chọn</Tag>
              <Typography.Text strong>{patient.fullName}</Typography.Text>
              <Typography.Text type="secondary">{patient.phone ?? 'chưa có SĐT'}</Typography.Text>
            </Space>
            <Button onClick={() => setPatient(null)}>Chọn bệnh nhân khác</Button>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              type="info"
              showIcon
              message="Chỉ tìm được bệnh nhân đã có tài khoản"
              description="Bệnh nhân chưa đăng ký cần tạo tài khoản trước; tính năng đó chưa có trong phạm vi hiện tại."
            />

            <Space wrap>
              <Input.Search
                allowClear
                placeholder="Tên bệnh nhân"
                style={{ width: 260 }}
                onSearch={(value) => {
                  setSearch((current) => ({ ...current, name: value.trim() || undefined }));
                  setPageQuery((current) => ({ ...current, page: 0 }));
                }}
              />
              <Input.Search
                allowClear
                placeholder="Số điện thoại"
                style={{ width: 220 }}
                onSearch={(value) => {
                  setSearch((current) => ({ ...current, phone: value.trim() || undefined }));
                  setPageQuery((current) => ({ ...current, page: 0 }));
                }}
              />
            </Space>

            {/* A failed search must not look like "no patients found". */}
            {patientsQuery.isError && (
              <Alert type="error" showIcon message={errorMessage(patientsQuery.error)} />
            )}

            <Table<ReceptionistPatient>
              rowKey="patientId"
              size="small"
              columns={patientColumns}
              dataSource={patientsQuery.isError ? [] : patientsQuery.data?.content}
              loading={patientsQuery.isFetching}
              pagination={toTablePagination(patientsQuery.data, pageQuery)}
              onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
              locale={{
                emptyText: patientsQuery.isError
                  ? 'Không tải được danh sách'
                  : 'Không tìm thấy bệnh nhân nào',
              }}
            />
          </Space>
        )}
      </Card>

      <Card title="2. Chọn lịch khám">
        {!patient ? (
          <Typography.Text type="secondary">Chọn bệnh nhân trước.</Typography.Text>
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
            <Form.Item
              name="doctorId"
              label="Bác sĩ"
              rules={[{ required: true, message: 'Vui lòng chọn bác sĩ.' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn bác sĩ"
                style={{ maxWidth: 360 }}
                loading={doctorsQuery.isFetching}
                options={(doctorsQuery.data?.content ?? []).map((doctor) => ({
                  value: doctor.doctorId,
                  label: `${doctor.fullName} — ${doctor.specialty}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="appointmentDate"
              label="Ngày khám"
              rules={[{ required: true, message: 'Vui lòng chọn ngày khám.' }]}
            >
              <DatePicker
                style={{ maxWidth: 280 }}
                format="DD/MM/YYYY"
                disabled={doctorId === undefined}
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
                <Typography.Text type="secondary">Chọn bác sĩ và ngày khám trước.</Typography.Text>
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
              Đặt lịch cho {patient.fullName}
            </Button>
          </Form>
        )}
      </Card>
    </Space>
  );
}
