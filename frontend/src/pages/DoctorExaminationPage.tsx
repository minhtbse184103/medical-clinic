import { MinusCircleOutlined, PlusOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Result,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { doctorApi } from '../api/doctor';
import { PageHeader } from '../components/PageHeader';
import { PrescriptionTable } from '../components/PrescriptionTable';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { APPOINTMENT_STATUS_COLOR, APPOINTMENT_STATUS_LABEL } from '../lib/appointmentStatus';
import { formatDate, formatTime } from '../lib/datetime';
import type {
  CreateMedicalRecordRequest,
  CreatePrescriptionDetailRequest,
  DoctorAppointment,
  MedicalRecord,
} from '../types/api';

interface PrescriptionFormValues {
  notes?: string;
  items: CreatePrescriptionDetailRequest[];
}

/** Whether the visit is happening right now, for the status chip on the header card. */
function isInProgress(appointment: DoctorAppointment): boolean {
  const now = dayjs();
  const start = dayjs(`${appointment.appointmentDate}T${appointment.startTime}`);
  const end = dayjs(`${appointment.appointmentDate}T${appointment.endTime}`);
  return !now.isBefore(start) && now.isBefore(end);
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

  const profile = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorApi.profile(),
  });

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
      message.success('Đã lưu bệnh án. Ca khám chuyển sang Đã khám.');
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
        title="Không tìm thấy ca khám"
        subTitle="Ca khám này không thuộc về bạn hoặc không tồn tại."
        extra={
          <Button type="primary" onClick={() => navigate('/doctor/appointments')}>
            Về danh sách ca khám
          </Button>
        }
      />
    );
  }

  const prescription = prescriptionQuery.data;
  const currentStep = medicalRecord ? 1 : 0;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: 'Lịch khám của tôi', href: '#', onClick: () => navigate('/doctor/appointments') },
          { title: 'Khám bệnh & Kê toa' },
        ]}
      />

      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col xs={24} lg={16}>
          <PageHeader
            title="Thực hiện khám bệnh & Kê đơn"
            description="Ghi nhận triệu chứng, chẩn đoán và hướng xử trí, sau đó kê đơn thuốc."
            onBack={() => navigate('/doctor/appointments')}
            backLabel="Danh sách ca khám"
          />
        </Col>
        <Col xs={24} lg={8}>
          {profile.data && (
            <Card size="small" styles={{ body: { padding: '10px 16px' } }}>
              <Typography.Text strong>BS. {profile.data.fullName}</Typography.Text>
              <div style={{ color: '#667085', fontSize: 13 }}>{profile.data.specialty}</div>
            </Card>
          )}
        </Col>
      </Row>

      {/* The two steps are a real dependency: a prescription needs a saved record. */}
      <Card>
        <Steps
          current={currentStep}
          items={[
            { title: 'Bước 1', description: 'Ghi nhận bệnh án' },
            { title: 'Bước 2', description: 'Kê đơn thuốc' },
          ]}
        />
      </Card>

      <Card
        title={
          <Space size={10} wrap>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Thông tin ca khám &amp; Bệnh nhân</span>
            <Tag
              color={isInProgress(appointment) ? 'blue' : APPOINTMENT_STATUS_COLOR[appointment.status]}
              style={{ marginInlineEnd: 0 }}
            >
              {isInProgress(appointment)
                ? '● Đang trong giờ khám'
                : APPOINTMENT_STATUS_LABEL[appointment.status]}
            </Tag>
          </Space>
        }
        extra={
          profile.data && <Tag color="blue" style={{ marginInlineEnd: 0 }}>{profile.data.specialty}</Tag>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f8fafc', height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Họ và tên bệnh nhân
              </Typography.Text>
              <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>
                {appointment.patientFullName}
              </div>
              {/* Age, gender and identity documents are not in this response, and no endpoint
                  gives a doctor a patient's profile. */}
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Mã BN: #{appointment.patientId}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f8fafc', height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Lịch hẹn tiếp nhận
              </Typography.Text>
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {formatDate(appointment.appointmentDate)}
              </div>
              <Typography.Text style={{ color: '#0d9488', fontSize: 13 }}>
                {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f8fafc', height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Mã ca khám
              </Typography.Text>
              <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>
                #{appointment.appointmentId}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Đặt lúc {formatDate(appointment.createdAt)}
              </Typography.Text>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}
          >
            LÝ DO VÀO KHÁM
          </Typography.Text>
          <Card size="small" style={{ marginTop: 8, background: '#f8fafc' }}>
            <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>
              {appointment.reason}
            </Typography.Text>
          </Card>
        </div>
      </Card>

      <Card
        title={
          <Space size={10}>
            <Tag color="blue" style={{ marginInlineEnd: 0, borderRadius: 999 }}>
              1
            </Tag>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Bệnh án điện tử</span>
          </Space>
        }
      >
        {medicalRecord ? (
          <Descriptions
            column={1}
            size="small"
            bordered
            items={[
              { key: 's', label: 'Triệu chứng & bệnh sử', children: medicalRecord.symptoms ?? '—' },
              { key: 'd', label: 'Chẩn đoán xác định', children: medicalRecord.diagnosis },
              { key: 't', label: 'Phương pháp điều trị', children: medicalRecord.treatment ?? '—' },
              { key: 'n', label: 'Lời dặn & ghi chú', children: medicalRecord.notes ?? '—' },
            ]}
          />
        ) : historyQuery.isFetching ? (
          <Skeleton active />
        ) : (
          <Form
            form={recordForm}
            layout="vertical"
            onFinish={(values) => recordMutation.mutate(values)}
          >
            <Alert
              type="error"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 20 }}
              message="Lưu ý quan trọng"
              description="Lưu bệnh án sẽ đồng thời hoàn tất ca khám. Thao tác này không hoàn tác được và nội dung không sửa lại được."
            />

            <Form.Item
              name="symptoms"
              label="Triệu chứng lâm sàng & Bệnh sử"
              rules={[{ max: 5000, message: 'Tối đa 5000 ký tự.' }]}
            >
              <Input.TextArea rows={4} maxLength={5000} showCount />
            </Form.Item>

            <Form.Item
              name="diagnosis"
              label="Chẩn đoán xác định"
              rules={[
                { required: true, message: 'Vui lòng nhập chẩn đoán.' },
                { max: 5000, message: 'Tối đa 5000 ký tự.' },
              ]}
            >
              <Input.TextArea rows={3} maxLength={5000} showCount />
            </Form.Item>

            <Form.Item
              name="treatment"
              label="Phương pháp điều trị / Hướng xử trí"
              rules={[{ max: 5000, message: 'Tối đa 5000 ký tự.' }]}
            >
              <Input.TextArea rows={3} maxLength={5000} showCount />
            </Form.Item>

            <Form.Item
              name="notes"
              label="Lời dặn & Ghi chú theo dõi"
              rules={[{ max: 5000, message: 'Tối đa 5000 ký tự.' }]}
            >
              <Input.TextArea rows={3} maxLength={5000} showCount />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={recordMutation.isPending}
              >
                Lưu bệnh án &amp; Hoàn tất khám
              </Button>
            </div>
          </Form>
        )}
      </Card>

      <Card
        title={
          <Space size={10}>
            <Tag
              color={medicalRecord ? 'blue' : 'default'}
              style={{ marginInlineEnd: 0, borderRadius: 999 }}
            >
              2
            </Tag>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Đơn thuốc</span>
          </Space>
        }
      >
        {!medicalRecord ? (
          <Alert
            type="info"
            showIcon
            message="Chỉ kê được đơn sau khi bệnh án đã được lưu"
            description="Hoàn tất bước 1 để mở phần kê đơn."
          />
        ) : prescription ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {prescription.notes && (
              <Typography.Text>
                <b>Ghi chú:</b> {prescription.notes}
              </Typography.Text>
            )}
            <PrescriptionTable details={prescription.details} />
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

                      <Row gutter={12}>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name={[field.name, 'dosage']}
                            label="Liều"
                            rules={[{ required: true, message: 'Nhập liều.' }]}
                          >
                            <Input placeholder="500mg" maxLength={100} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name={[field.name, 'frequency']}
                            label="Tần suất"
                            rules={[{ required: true, message: 'Nhập tần suất.' }]}
                          >
                            <Input placeholder="2 lần/ngày" maxLength={100} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name={[field.name, 'duration']}
                            label="Thời gian"
                            rules={[{ required: true, message: 'Nhập thời gian.' }]}
                          >
                            <Input placeholder="7 ngày" maxLength={100} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            name={[field.name, 'quantity']}
                            label="Số lượng"
                            rules={[{ required: true, message: 'Nhập số lượng.' }]}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name={[field.name, 'instruction']} label="Cách dùng & hướng dẫn">
                        <Input maxLength={500} placeholder="Uống sau ăn sáng" />
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
              <Input.TextArea rows={2} maxLength={1000} showCount />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={prescriptionMutation.isPending}
              >
                Lưu đơn thuốc
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </Space>
  );
}
