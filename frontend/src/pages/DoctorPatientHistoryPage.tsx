import {
  CalendarOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Pagination,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { doctorApi } from '../api/doctor';
import { PageHeader } from '../components/PageHeader';
import { PrescriptionTable } from '../components/PrescriptionTable';
import { errorCode, errorMessage } from '../lib/apiError';
import { formatDate, formatDateTime } from '../lib/datetime';
import { DEFAULT_PAGE_QUERY, type PageQuery } from '../lib/pagination';
import { initials } from '../lib/user';
import type { MedicalRecord, PrescriptionView } from '../types/api';

const PANEL_BG = '#f8fafc';

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div>
      <Space size={6} style={{ color: '#475467', fontWeight: 600, fontSize: 13 }}>
        {icon}
        <span>{label}</span>
      </Space>
      <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  );
}

export function DoctorPatientHistoryPage() {
  const { patientId: patientIdParam } = useParams<{ patientId: string }>();
  const patientId = Number(patientIdParam);
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 5 });
  const [expanded, setExpanded] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['doctor-patient-records', patientId, pageQuery],
    queryFn: () => doctorApi.patientMedicalRecords(patientId, pageQuery.page, pageQuery.size),
    enabled: Number.isFinite(patientId),
    placeholderData: keepPreviousData,
  });

  const profile = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorApi.profile(),
  });

  /*
   * The records endpoint returns the patient id only, so the name comes from the doctor's
   * own appointment list. That list also tells which of these visits were the doctor's own:
   * the history includes records written by other doctors, and prescriptions of those are
   * not readable here.
   */
  const appointments = useQuery({
    queryKey: ['doctor-appointments', { page: 0, size: 100 }],
    queryFn: () => doctorApi.appointments({ page: 0, size: 100 }),
  });

  const patientName = appointments.data?.content.find(
    (row) => row.patientId === patientId,
  )?.patientFullName;

  const myAppointmentIds = useMemo(
    () => new Set((appointments.data?.content ?? []).map((row) => row.appointmentId)),
    [appointments.data],
  );

  const records = data?.content ?? [];

  // Only records from this doctor's own appointments; the endpoint answers 403 for others.
  const prescriptionQueries = useQueries({
    queries: records.map((record) => ({
      queryKey: ['prescription', record.medicalRecordId],
      queryFn: () => doctorApi.prescription(record.medicalRecordId),
      enabled: myAppointmentIds.has(record.appointmentId),
      // A visit without a prescription answers 404; that is a normal state, not an error.
      retry: false,
    })),
  });

  const prescriptionByRecord = new Map<number, PrescriptionView>();
  records.forEach((record, index) => {
    const result = prescriptionQueries[index]?.data;
    if (result) {
      prescriptionByRecord.set(record.medicalRecordId, result);
    }
  });

  // Access needs at least one appointment between this doctor and the patient;
  // the DOCTOR role alone is not enough, so a plain 403 is an expected outcome here.
  const isAccessDenied = errorCode(error) === 'DOCTOR_PATIENT_MEDICAL_RECORD_ACCESS_FORBIDDEN';

  const lastVisit = records[0]?.createdAt;
  const from = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const to = data ? data.page * data.size + records.length : 0;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: 'Lịch khám của tôi', href: '#', onClick: () => navigate('/doctor/appointments') },
          { title: 'Hồ sơ bệnh án' },
        ]}
      />

      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col xs={24} lg={16}>
          <PageHeader
            title="Hồ sơ bệnh án bệnh nhân"
            description="Toàn bộ lần khám đã hoàn tất của bệnh nhân này, mới nhất trước."
            onBack={() => navigate('/doctor/appointments')}
            backLabel="Lịch khám của tôi"
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

      {isError && (
        <Alert
          type={isAccessDenied ? 'warning' : 'error'}
          showIcon
          message={
            isAccessDenied
              ? 'Bạn chưa từng khám cho bệnh nhân này nên không xem được bệnh án.'
              : errorMessage(error)
          }
        />
      )}

      {!isError && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Card style={{ height: '100%' }}>
              <Space size={14} align="center">
                <Avatar size={48} style={{ background: '#1677ff' }}>
                  {initials(patientName ?? String(patientId))}
                </Avatar>
                <div>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {patientName ?? `Bệnh nhân #${patientId}`}
                  </Typography.Title>
                  {/* Age, gender, insurance and medical history are not in any endpoint
                      available to a doctor, so they are not shown. */}
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Bệnh nhân
                  </Typography.Text>
                </div>
              </Space>

              <Row gutter={[12, 12]} style={{ marginTop: 18 }}>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ background: PANEL_BG, height: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                      Mã bệnh nhân
                    </Typography.Text>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>#{patientId}</div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ background: PANEL_BG, height: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                      Lần khám gần nhất
                    </Typography.Text>
                    <div style={{ fontWeight: 600, marginTop: 4, color: '#1677ff' }}>
                      {lastVisit ? formatDate(lastVisit) : '—'}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ background: PANEL_BG, height: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                      Tổng số lần khám
                    </Typography.Text>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{data?.totalElements ?? 0}</div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            {/* The rule the backend actually enforces, stated for the doctor. */}
            <Card style={{ height: '100%', background: '#f0f6ff', borderColor: '#bfdbfe' }}>
              <Space size={8} align="start">
                <SafetyCertificateOutlined style={{ color: '#1677ff', marginTop: 3 }} />
                <div>
                  <Typography.Text strong>Quy định bảo mật bệnh án</Typography.Text>
                  <Typography.Paragraph
                    type="secondary"
                    style={{ marginBottom: 0, marginTop: 6, fontSize: 13 }}
                  >
                    Bạn chỉ tra cứu được hồ sơ của bệnh nhân đã từng đặt lịch khám với bạn. Hồ sơ có
                    thể gồm cả lần khám do bác sĩ khác thực hiện; đơn thuốc của những lần đó không
                    mở được.
                  </Typography.Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {isPending ? (
        <Skeleton active />
      ) : isError ? null : records.length > 0 ? (
        <>
          {records.map((record: MedicalRecord) => {
            const isMine = myAppointmentIds.has(record.appointmentId);
            const prescription = prescriptionByRecord.get(record.medicalRecordId);
            const isOpen = expanded === record.medicalRecordId;

            return (
              <Card key={record.medicalRecordId} styles={{ body: { padding: 0 } }}>
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <Space size={8} wrap>
                      <CalendarOutlined style={{ color: '#1677ff' }} />
                      <Typography.Text strong>
                        Khám bệnh ngày {formatDateTime(record.createdAt)}
                      </Typography.Text>
                      <Tag color="green" style={{ marginInlineEnd: 0 }}>
                        Hoàn tất khám
                      </Tag>
                    </Space>
                    <div style={{ color: '#667085', fontSize: 13, marginTop: 4 }}>
                      Bệnh án #{record.medicalRecordId} · Ca khám #{record.appointmentId}
                    </div>
                  </div>
                  {/* Records carry no doctor; only membership in this doctor's own
                      appointment list can be stated truthfully. */}
                  <Tag
                    color={isMine ? 'blue' : 'default'}
                    style={{ marginInlineEnd: 0, height: 'fit-content' }}
                  >
                    {isMine ? 'Bạn khám' : 'Bác sĩ khác khám'}
                  </Tag>
                </div>

                <div style={{ padding: 20 }}>
                  <Card size="small" style={{ background: PANEL_BG, marginBottom: 16 }}>
                    <Field icon={<SolutionOutlined />} label="Chẩn đoán xác định">
                      <Typography.Text strong style={{ fontSize: 15 }}>
                        {record.diagnosis}
                      </Typography.Text>
                    </Field>
                  </Card>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card size="small" style={{ background: PANEL_BG, height: '100%' }}>
                        {/* Vital signs have no table in this system, so this is symptoms only. */}
                        <Field icon={<FileTextOutlined />} label="Triệu chứng lâm sàng">
                          {record.symptoms ?? (
                            <Typography.Text type="secondary">Không ghi nhận</Typography.Text>
                          )}
                        </Field>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card size="small" style={{ background: PANEL_BG, height: '100%' }}>
                        <Field icon={<MedicineBoxOutlined />} label="Phương pháp điều trị & Xử trí">
                          {record.treatment ?? (
                            <Typography.Text type="secondary">Không ghi nhận</Typography.Text>
                          )}
                        </Field>
                      </Card>
                    </Col>
                  </Row>

                  {record.notes && (
                    <Alert
                      type="warning"
                      style={{ marginTop: 16 }}
                      message={
                        <span>
                          <b>Lời dặn &amp; Ghi chú của bác sĩ:</b> {record.notes}
                        </span>
                      }
                    />
                  )}

                  <div
                    style={{
                      marginTop: 16,
                      padding: '12px 16px',
                      background: PANEL_BG,
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Space size={8}>
                      <MedicineBoxOutlined style={{ color: '#667085' }} />
                      <Typography.Text style={{ fontSize: 13 }}>
                        {!isMine
                          ? 'Đơn thuốc do bác sĩ khác kê, không xem được'
                          : prescription
                            ? `Đơn thuốc kèm theo: ${prescription.details.length} loại thuốc`
                            : 'Lần khám này không kê đơn thuốc'}
                      </Typography.Text>
                    </Space>
                    {prescription && (
                      <Button
                        type="link"
                        size="small"
                        style={{ paddingInline: 0 }}
                        onClick={() => setExpanded(isOpen ? null : record.medicalRecordId)}
                      >
                        {isOpen ? 'Ẩn chi tiết đơn thuốc' : 'Xem chi tiết đơn thuốc'}
                      </Button>
                    )}
                  </div>

                  {prescription && isOpen && (
                    <div style={{ marginTop: 12 }}>
                      {prescription.notes && (
                        <Typography.Paragraph style={{ marginBottom: 8 }}>
                          <b>Ghi chú đơn thuốc:</b> {prescription.notes}
                        </Typography.Paragraph>
                      )}
                      <PrescriptionTable details={prescription.details} />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {data && (
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Typography.Text type="secondary">
                Hiển thị {from} – {to} trong tổng số {data.totalElements} lần khám
              </Typography.Text>
              <Pagination
                current={data.page + 1}
                pageSize={data.size}
                total={data.totalElements}
                showSizeChanger={false}
                onChange={(page) => {
                  setExpanded(null);
                  setPageQuery((current) => ({ ...current, page: page - 1 }));
                }}
              />
            </Space>
          )}
        </>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bệnh nhân chưa có bệnh án nào"
          >
            <Typography.Text type="secondary">
              Bệnh án được tạo sau khi một ca khám hoàn tất.
            </Typography.Text>
          </Empty>
        </Card>
      )}
    </Space>
  );
}
