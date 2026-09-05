import {
  CalendarOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Breadcrumb,
  Card,
  Col,
  Empty,
  Pagination,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { appointmentsApi } from '../api/appointments';
import { patientApi } from '../api/patient';
import { errorMessage } from '../lib/apiError';
import { formatDate, formatDateTime, formatTime } from '../lib/datetime';
import { initials } from '../lib/user';
import { DEFAULT_PAGE_QUERY, type PageQuery } from '../lib/pagination';
import type {
  MedicalRecordSort,
  PatientAppointment,
  PatientPrescription,
  PrescriptionMedicine,
} from '../types/api';

const SORT_OPTIONS: { value: MedicalRecordSort; label: string }[] = [
  { value: 'createdAt,desc', label: 'Mới nhất trước' },
  { value: 'createdAt,asc', label: 'Cũ nhất trước' },
];

const prescriptionColumns: ColumnsType<PrescriptionMedicine> = [
  {
    title: 'STT',
    key: 'index',
    width: 60,
    render: (_, __, index) => String(index + 1).padStart(2, '0'),
  },
  {
    title: 'TÊN THUỐC & HÀM LƯỢNG',
    key: 'medicine',
    render: (_, detail) => (
      <Typography.Text strong>
        {detail.medicineName} {detail.dosage}
      </Typography.Text>
    ),
  },
  { title: 'TẦN SUẤT', dataIndex: 'frequency', key: 'frequency', width: 130 },
  { title: 'THỜI GIAN', dataIndex: 'duration', key: 'duration', width: 120 },
  {
    title: 'SỐ LƯỢNG',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 110,
    render: (quantity: number) => (
      <Typography.Text style={{ color: '#1677ff', fontWeight: 600 }}>{quantity}</Typography.Text>
    ),
  },
  {
    title: 'CÁCH DÙNG & HƯỚNG DẪN',
    dataIndex: 'instruction',
    key: 'instruction',
    render: (instruction: string | null) =>
      instruction ?? <Typography.Text type="secondary">—</Typography.Text>,
  },
];

/** Small labelled block used for the three clinical sections of a record. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Typography.Text
        type="secondary"
        style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}
      >
        {label}
      </Typography.Text>
      <Typography.Paragraph style={{ marginTop: 6, marginBottom: 0, lineHeight: 1.8 }}>
        {children}
      </Typography.Paragraph>
    </div>
  );
}

export function PatientMedicalRecordsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 5 });
  const [sort, setSort] = useState<MedicalRecordSort>('createdAt,desc');
  const navigate = useNavigate();

  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => patientApi.profile(),
  });

  const records = useQuery({
    queryKey: ['my-medical-records', pageQuery, sort],
    queryFn: () => patientApi.medicalRecords({ ...pageQuery, sort }),
    placeholderData: keepPreviousData,
  });

  /*
   * Prescriptions and completed visits are fetched once and indexed, rather than one
   * request per record on screen. Two requests cover the page regardless of its size.
   */
  const prescriptions = useQuery({
    queryKey: ['my-prescriptions', { page: 0, size: 100 }],
    queryFn: () => patientApi.prescriptions(0, 100),
  });

  /** A medical record carries no doctor; the completed appointment behind it does. */
  const visits = useQuery({
    queryKey: ['my-appointments-completed'],
    queryFn: () => appointmentsApi.mine({ page: 0, size: 100, status: 'COMPLETED' }),
  });

  const prescriptionByRecord = useMemo(() => {
    const index = new Map<number, PatientPrescription>();
    for (const prescription of prescriptions.data?.content ?? []) {
      index.set(prescription.medicalRecordId, prescription);
    }
    return index;
  }, [prescriptions.data]);

  const visitByAppointment = useMemo(() => {
    const index = new Map<number, PatientAppointment>();
    for (const visit of visits.data?.content ?? []) {
      index.set(visit.appointmentId, visit);
    }
    return index;
  }, [visits.data]);

  const patientAge = profile.data?.dateOfBirth
    ? dayjs().diff(dayjs(profile.data.dateOfBirth), 'year')
    : null;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/', title: <HomeOutlined />, onClick: () => navigate('/') },
          { title: 'Bệnh án điện tử' },
        ]}
      />

      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Bệnh án điện tử &amp; Lịch sử khám bệnh
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            Theo dõi hồ sơ chẩn đoán, hướng điều trị và đơn thuốc của từng lần khám.
          </Typography.Paragraph>
        </Col>
        <Col>
          <Select
            size="large"
            style={{ width: 200 }}
            options={SORT_OPTIONS}
            value={sort}
            onChange={(value) => {
              setSort(value);
              setPageQuery((current) => ({ ...current, page: 0 }));
            }}
          />
        </Col>
      </Row>

      <Card loading={profile.isPending}>
        {profile.data && (
          <Space
            align="center"
            size={16}
            wrap
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Space align="center" size={16}>
              <Avatar size={52} style={{ background: '#e6f4ff', color: '#1677ff', fontWeight: 700 }}>
                {initials(profile.data.fullName)}
              </Avatar>
              <div>
                <Space size={10} wrap>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {profile.data.fullName}
                  </Typography.Text>
                  <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                    Bệnh nhân ngoại trú
                  </Tag>
                </Space>
                <Space size={16} wrap style={{ marginTop: 4, color: '#667085', fontSize: 13 }}>
                  {/* The real patient id, not an invented reference format. */}
                  <span>Mã hồ sơ: #{profile.data.patientId}</span>
                  {profile.data.dateOfBirth && (
                    <span>
                      Năm sinh: {dayjs(profile.data.dateOfBirth).format('YYYY')} ({patientAge} tuổi)
                    </span>
                  )}
                </Space>
              </div>
            </Space>

            <Card size="small" styles={{ body: { padding: '10px 16px' } }}>
              <Space size={10}>
                <SolutionOutlined style={{ color: '#0d9488' }} />
                <span style={{ color: '#667085' }}>Tổng số lượt khám:</span>
                <Typography.Text strong>{records.data?.totalElements ?? 0}</Typography.Text>
              </Space>
            </Card>
          </Space>
        )}
      </Card>

      {records.isError && <Alert type="error" showIcon message={errorMessage(records.error)} />}

      {records.isPending ? (
        <Skeleton active />
      ) : records.data && records.data.content.length > 0 ? (
        <>
          {records.data.content.map((record) => {
            const prescription = prescriptionByRecord.get(record.medicalRecordId);
            const visit = visitByAppointment.get(record.appointmentId);

            return (
              <Card key={record.medicalRecordId} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: 20, borderBottom: '1px solid #f0f0f0' }}>
                  <Space size={10} wrap>
                    <CalendarOutlined style={{ color: '#1677ff' }} />
                    <Typography.Text strong>
                      Khám bệnh ngày {formatDateTime(record.createdAt)}
                    </Typography.Text>
                    <Tag color="green" style={{ marginInlineEnd: 0 }}>
                      ● Hoàn tất khám
                    </Tag>
                  </Space>
                  {visit && (
                    <Space size={8} style={{ marginTop: 8, color: '#667085' }} wrap>
                      <MedicineBoxOutlined />
                      <span>
                        BS. {visit.doctorFullName} — {visit.doctorSpecialty}
                      </span>
                      <span>·</span>
                      <span>
                        Ca khám {formatTime(visit.startTime)} – {formatTime(visit.endTime)} ngày{' '}
                        {formatDate(visit.appointmentDate)}
                      </span>
                    </Space>
                  )}
                </div>

                <div style={{ padding: 20 }}>
                  {/* The design showed an ICD-10 code; the record stores free-text diagnosis. */}
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}
                  >
                    CHẨN ĐOÁN
                  </Typography.Text>
                  <Typography.Title level={5} style={{ marginTop: 6, marginBottom: 20 }}>
                    {record.diagnosis}
                  </Typography.Title>

                  <Row gutter={[24, 20]}>
                    <Col xs={24} md={12}>
                      <Section label="TRIỆU CHỨNG & BỆNH SỬ">
                        {record.symptoms ?? (
                          <Typography.Text type="secondary">Không ghi nhận</Typography.Text>
                        )}
                      </Section>
                    </Col>
                    <Col xs={24} md={12}>
                      <Section label="PHƯƠNG PHÁP ĐIỀU TRỊ / HƯỚNG XỬ TRÍ">
                        {record.treatment ?? (
                          <Typography.Text type="secondary">Không ghi nhận</Typography.Text>
                        )}
                      </Section>
                    </Col>
                  </Row>

                  {record.notes && (
                    <div style={{ marginTop: 20 }}>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}
                      >
                        LỜI DẶN & GHI CHÚ CỦA BÁC SĨ
                      </Typography.Text>
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginTop: 8 }}
                        message={record.notes}
                      />
                    </div>
                  )}
                </div>

                <div style={{ padding: '0 20px 20px' }}>
                  <Space size={8} style={{ marginBottom: 12 }}>
                    <MedicineBoxOutlined style={{ color: '#722ed1' }} />
                    <Typography.Text strong>Đơn thuốc</Typography.Text>
                  </Space>

                  {prescriptions.isPending ? (
                    <Skeleton active paragraph={{ rows: 2 }} />
                  ) : prescription ? (
                    <>
                      {prescription.notes && (
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                          Ghi chú đơn: {prescription.notes}
                        </Typography.Paragraph>
                      )}
                      <Table<PrescriptionMedicine>
                        rowKey="medicineId"
                        size="small"
                        pagination={false}
                        columns={prescriptionColumns}
                        dataSource={prescription.details}
                      />
                    </>
                  ) : (
                    <Alert
                      type="info"
                      showIcon
                      icon={<CheckCircleOutlined />}
                      message="Lần khám này không kê đơn thuốc"
                      description="Bác sĩ chỉ ghi nhận chẩn đoán và hướng xử trí cho lần khám này."
                    />
                  )}
                </div>
              </Card>
            );
          })}

          <Space
            align="center"
            style={{ width: '100%', justifyContent: 'space-between' }}
            wrap
          >
            <Typography.Text type="secondary">
              Hiển thị {records.data.content.length} trong tổng số {records.data.totalElements} hồ
              sơ
            </Typography.Text>
            <Pagination
              current={records.data.page + 1}
              pageSize={records.data.size}
              total={records.data.totalElements}
              showSizeChanger={false}
              onChange={(page) => setPageQuery((current) => ({ ...current, page: page - 1 }))}
            />
          </Space>
        </>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bạn chưa có bệnh án nào"
          >
            <Typography.Text type="secondary">
              Bệnh án được tạo sau khi bác sĩ hoàn tất buổi khám.
            </Typography.Text>
          </Empty>
        </Card>
      )}
    </Space>
  );
}
