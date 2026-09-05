import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Result,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { doctorApi } from '../api/doctor';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { APPOINTMENT_STATUS_COLOR, APPOINTMENT_STATUS_LABEL } from '../lib/appointmentStatus';
import { formatDate, formatTime } from '../lib/datetime';
import type {
  CreateMedicalRecordRequest,
  CreatePrescriptionDetailRequest,
  MedicalRecord,
  PrescriptionMedicine,
} from '../types/api';

interface PrescriptionFormValues {
  notes?: string;
  items: CreatePrescriptionDetailRequest[];
}

export function DoctorExaminationPage() {
  const { appointmentId: appointmentIdParam } = useParams<{ appointmentId: string }>();
  const appointmentId = Number(appointmentIdParam);
  const [recordForm] = Form.useForm<CreateMedicalRecordRequest>();
  const [prescriptionForm] = Form.useForm<PrescriptionFormValues>();
  const [createdRecord, setCreatedRecord] = useState<MedicalRecord | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();

  // The API has no single-appointment endpoint for a Doctor, so the row is picked out of
  // the Doctor's own list. Fine for the current data volume; a dedicated endpoint would be
  // the right fix if the list ever outgrows one page.
  const appointmentsQuery = useQuery({
    queryKey: ['doctor-appointments', { page: 0, size: 100 }],
    queryFn: () => doctorApi.appointments({ page: 0, size: 100 }),
  });

  const appointment = appointmentsQuery.data?.content.find(
    (row) => row.appointmentId === appointmentId,
  );

  // When the record already exists (the doctor came back to prescribe later) it is found
  // through the patient's history, which is the only endpoint that exposes it.
  const historyQuery = useQuery({
    queryKey: ['doctor-patient-records', appointment?.patientId],
    queryFn: () => doctorApi.patientMedicalRecords(appointment!.patientId, 0, 100),
    enabled: appointment !== undefined && appointment.status === 'COMPLETED',
  });

  const existingRecord = historyQuery.data?.content.find(
    (record) => record.appointmentId === appointmentId,
  );

  const medicalRecord = createdRecord ?? existingRecord ?? null;

  const prescriptionQuery = useQuery({
    queryKey: ['prescription', medicalRecord?.medicalRecordId],
    queryFn: () => doctorApi.prescription(medicalRecord!.medicalRecordId),
    enabled: medicalRecord !== null,
    // A record without a prescription answers 404; that is a normal state, not an error.
    retry: false,
  });

  const medicinesQuery = useQuery({
    queryKey: ['medicines', { page: 0, size: 100, active: true }],
    queryFn: () => doctorApi.medicines({ page: 0, size: 100, active: true }),
  });

  const recordMutation = useMutation({
    mutationFn: (values: CreateMedicalRecordRequest) =>
      doctorApi.createMedicalRecord(appointmentId, values),
    onSuccess: async (record) => {
      setCreatedRecord(record);
      message.success('Đã tạo bệnh án. Lịch khám chuyển sang Đã khám.');
      await queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
    },
    onError: (error) => {
      if (!applyFieldErrors(recordForm, error)) {
        message.error(errorMessage(error));
      }
    },
  });

  const prescriptionMutation = useMutation({
    mutationFn: (values: PrescriptionFormValues) =>
      doctorApi.createPrescription(medicalRecord!.medicalRecordId, {
        notes: values.notes,
        items: values.items,
      }),
    onSuccess: async () => {
      message.success('Đã kê đơn thuốc.');
      await prescriptionQuery.refetch();
    },
    onError: (error) => {
      if (!applyFieldErrors(prescriptionForm, error)) {
        message.error(errorMessage(error));
      }
    },
  });

  if (appointmentsQuery.isPending) {
    return <Skeleton active />;
  }

  if (appointmentsQuery.isError) {
    return <Alert type="error" showIcon message={errorMessage(appointmentsQuery.error)} />;
  }

  if (!appointment) {
    return (
      <Result
        status="404"
        title="Không tìm thấy lịch khám"
        subTitle="Lịch khám này không thuộc về bạn hoặc không tồn tại."
        extra={
          <Button type="primary" onClick={() => navigate('/doctor/appointments')}>
            Về lịch khám
          </Button>
        }
      />
    );
  }

  const prescription = prescriptionQuery.data;

  const prescriptionColumns: ColumnsType<PrescriptionMedicine> = [
    { title: 'Thuốc', dataIndex: 'medicineName', key: 'medicineName' },
    { title: 'Liều', dataIndex: 'dosage', key: 'dosage' },
    { title: 'Tần suất', dataIndex: 'frequency', key: 'frequency' },
    { title: 'Thời gian', dataIndex: 'duration', key: 'duration' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Hướng dẫn',
      dataIndex: 'instruction',
      key: 'instruction',
      render: (value: string | null) => value ?? '—',
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button onClick={() => navigate('/doctor/appointments')}>← Lịch khám</Button>

      <Card title="Thông tin lịch khám">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Bệnh nhân">{appointment.patientFullName}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {formatDate(appointment.appointmentDate)} · {formatTime(appointment.startTime)} –{' '}
            {formatTime(appointment.endTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Lý do khám">{appointment.reason}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={APPOINTMENT_STATUS_COLOR[appointment.status]}>
              {APPOINTMENT_STATUS_LABEL[appointment.status]}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="1. Bệnh án">
        {medicalRecord ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Triệu chứng">
              {medicalRecord.symptoms ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Chẩn đoán">{medicalRecord.diagnosis}</Descriptions.Item>
            <Descriptions.Item label="Điều trị">
              {medicalRecord.treatment ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{medicalRecord.notes ?? '—'}</Descriptions.Item>
          </Descriptions>
        ) : historyQuery.isFetching ? (
          <Skeleton active />
        ) : (
          <Form
            form={recordForm}
            layout="vertical"
            onFinish={(values) => recordMutation.mutate(values)}
          >
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Tạo bệnh án sẽ đồng thời chuyển lịch khám sang trạng thái Đã khám"
              description="Hai việc này chạy trong cùng một transaction và không thể hoàn tác."
            />

            <Form.Item name="symptoms" label="Triệu chứng">
              <Input.TextArea rows={2} maxLength={5000} showCount />
            </Form.Item>

            <Form.Item
              name="diagnosis"
              label="Chẩn đoán"
              rules={[
                { required: true, message: 'Vui lòng nhập chẩn đoán.' },
                { max: 5000, message: 'Chẩn đoán tối đa 5000 ký tự.' },
              ]}
            >
              <Input.TextArea rows={2} maxLength={5000} showCount />
            </Form.Item>

            <Form.Item name="treatment" label="Hướng điều trị">
              <Input.TextArea rows={2} maxLength={5000} showCount />
            </Form.Item>

            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={2} maxLength={5000} showCount />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={recordMutation.isPending}>
              Lưu bệnh án và hoàn tất khám
            </Button>
          </Form>
        )}
      </Card>

      <Card title="2. Đơn thuốc">
        {!medicalRecord ? (
          <Typography.Text type="secondary">Tạo bệnh án trước khi kê đơn.</Typography.Text>
        ) : prescription ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {prescription.notes && (
              <Typography.Text>
                <b>Ghi chú:</b> {prescription.notes}
              </Typography.Text>
            )}
            <Table<PrescriptionMedicine>
              rowKey="medicineId"
              size="small"
              pagination={false}
              columns={prescriptionColumns}
              dataSource={prescription.details}
            />
          </Space>
        ) : prescriptionQuery.isFetching ? (
          <Skeleton active />
        ) : (
          <Form
            form={prescriptionForm}
            layout="vertical"
            initialValues={{ items: [{}] }}
            onFinish={(values) => prescriptionMutation.mutate(values)}
          >
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`Thuốc ${index + 1}`}
                      style={{ marginBottom: 12 }}
                      extra={
                        fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        )
                      }
                    >
                      <Form.Item
                        name={[field.name, 'medicineId']}
                        label="Thuốc"
                        rules={[{ required: true, message: 'Chọn thuốc.' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Chọn thuốc"
                          loading={medicinesQuery.isFetching}
                          options={(medicinesQuery.data?.content ?? []).map((medicine) => ({
                            value: medicine.medicineId,
                            label: medicine.unit
                              ? `${medicine.name} (${medicine.unit})`
                              : medicine.name,
                          }))}
                        />
                      </Form.Item>

                      <Space wrap align="start">
                        <Form.Item
                          name={[field.name, 'dosage']}
                          label="Liều"
                          rules={[{ required: true, message: 'Nhập liều.' }]}
                        >
                          <Input placeholder="500mg" style={{ width: 140 }} maxLength={100} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'frequency']}
                          label="Tần suất"
                          rules={[{ required: true, message: 'Nhập tần suất.' }]}
                        >
                          <Input placeholder="3 lần/ngày" style={{ width: 160 }} maxLength={100} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'duration']}
                          label="Thời gian"
                          rules={[{ required: true, message: 'Nhập thời gian.' }]}
                        >
                          <Input placeholder="5 ngày" style={{ width: 140 }} maxLength={100} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'quantity']}
                          label="Số lượng"
                          rules={[{ required: true, message: 'Nhập số lượng.' }]}
                        >
                          <InputNumber min={1} style={{ width: 120 }} />
                        </Form.Item>
                      </Space>

                      <Form.Item name={[field.name, 'instruction']} label="Hướng dẫn dùng">
                        <Input maxLength={500} placeholder="Uống sau ăn" />
                      </Form.Item>
                    </Card>
                  ))}

                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                    Thêm thuốc
                  </Button>
                </>
              )}
            </Form.List>

            <Divider />

            <Form.Item name="notes" label="Ghi chú đơn thuốc">
              <Input.TextArea rows={2} maxLength={1000} showCount style={{ maxWidth: 560 }} />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={prescriptionMutation.isPending}>
              Lưu đơn thuốc
            </Button>
          </Form>
        )}
      </Card>
    </Space>
  );
}
