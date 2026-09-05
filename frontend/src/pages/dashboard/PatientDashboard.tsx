import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { appointmentsApi } from '../../api/appointments';
import { patientApi } from '../../api/patient';
import { DateBadge } from '../../components/DateBadge';
import { SummaryTile } from '../../components/SummaryTile';
import { APPOINTMENT_STATUS_COLOR, APPOINTMENT_STATUS_LABEL } from '../../lib/appointmentStatus';
import { formatDate, formatTime, toApiDate } from '../../lib/datetime';

const MONTH_LABEL = (date: string) => dayjs(date).format('DD [thg] M');

/** Card heading with a leading icon and an optional link on the right. */
function SectionTitle({ icon, title, color }: { icon: ReactNode; title: string; color: string }) {
  return (
    <Space size={10}>
      <span style={{ color, fontSize: 17 }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
    </Space>
  );
}

/** A tappable row on a tinted surface, as used throughout the reference layout. */
function ListRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 12,
        background: '#f8fafc',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function PatientDashboard() {
  const navigate = useNavigate();
  const today = toApiDate(dayjs());

  const upcoming = useQuery({
    queryKey: ['my-appointments-upcoming'],
    queryFn: () =>
      appointmentsApi.mine({ page: 0, size: 5, fromDate: today, sort: 'appointmentDate,asc' }),
  });

  const pending = useQuery({
    queryKey: ['my-appointments-count', 'PENDING'],
    queryFn: () => appointmentsApi.mine({ page: 0, size: 1, status: 'PENDING' }),
    select: (page) => page.totalElements,
  });

  const records = useQuery({
    queryKey: ['my-medical-records', { page: 0, size: 4 }],
    queryFn: () => patientApi.medicalRecords({ page: 0, size: 4 }),
  });

  const prescriptions = useQuery({
    queryKey: ['my-prescriptions', { page: 0, size: 1 }],
    queryFn: () => patientApi.prescriptions(0, 1),
  });

  /* The medical record carries no doctor, so the most recent visit is read from the
   * completed appointment, which does. */
  const lastVisit = useQuery({
    queryKey: ['my-appointments-last-visit'],
    queryFn: () =>
      appointmentsApi.mine({
        page: 0,
        size: 1,
        status: 'COMPLETED',
        sort: 'appointmentDate,desc',
      }),
    select: (page) => page.content[0],
  });

  const nextAppointment = upcoming.data?.content.find(
    (appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED',
  );
  const latestPrescription = prescriptions.data?.content[0];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            featured
            label="Lịch hẹn kế tiếp"
            value={nextAppointment ? MONTH_LABEL(nextAppointment.appointmentDate) : 'Chưa có'}
            icon={<CalendarOutlined />}
            loading={upcoming.isPending}
            onClick={() => navigate('/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            label="Chờ xác nhận"
            value={pending.data ?? 0}
            icon={<ClockCircleOutlined />}
            iconColor="#faad14"
            loading={pending.isPending}
            onClick={() => navigate('/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            label="Đơn thuốc"
            value={prescriptions.data?.totalElements ?? 0}
            icon={<MedicineBoxOutlined />}
            iconColor="#722ed1"
            loading={prescriptions.isPending}
            onClick={() => navigate('/prescriptions')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            label="Bệnh án"
            value={records.data?.totalElements ?? 0}
            icon={<FileTextOutlined />}
            iconColor="#52c41a"
            loading={records.isPending}
            onClick={() => navigate('/medical-records')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <SectionTitle icon={<CalendarOutlined />} title="Lịch hẹn sắp tới" color="#0d9488" />
              }
              extra={
                <Button type="link" onClick={() => navigate('/appointments')}>
                  Xem tất cả
                </Button>
              }
              loading={upcoming.isPending}
            >
              {upcoming.data && upcoming.data.content.length > 0 ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {upcoming.data.content.map((appointment) => (
                    <ListRow
                      key={appointment.appointmentId}
                      onClick={() => navigate('/appointments')}
                    >
                      <DateBadge date={appointment.appointmentDate} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space size={8} wrap>
                          <Typography.Text strong>{appointment.doctorFullName}</Typography.Text>
                          <Tag color={APPOINTMENT_STATUS_COLOR[appointment.status]}>
                            {APPOINTMENT_STATUS_LABEL[appointment.status]}
                          </Tag>
                        </Space>
                        <div style={{ color: '#667085', fontSize: 13, marginTop: 2 }}>
                          {appointment.doctorSpecialty}
                        </div>
                        <Space size={16} style={{ marginTop: 6, fontSize: 13, color: '#667085' }}>
                          <span>
                            <ClockCircleOutlined /> {formatTime(appointment.startTime)} –{' '}
                            {formatTime(appointment.endTime)}
                          </span>
                        </Space>
                      </div>
                      <RightOutlined style={{ color: '#98a2b3' }} />
                    </ListRow>
                  ))}
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch hẹn sắp tới">
                  <Button type="primary" onClick={() => navigate('/doctors')}>
                    Đặt lịch khám
                  </Button>
                </Empty>
              )}
            </Card>

            <Card
              title={<SectionTitle icon={<FileTextOutlined />} title="Bệnh án gần đây" color="#1677ff" />}
              extra={
                <Button type="link" onClick={() => navigate('/medical-records')}>
                  Xem tất cả
                </Button>
              }
              loading={records.isPending}
            >
              {records.data && records.data.content.length > 0 ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {records.data.content.map((record) => (
                    <ListRow
                      key={record.medicalRecordId}
                      onClick={() => navigate('/medical-records')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong>{record.diagnosis}</Typography.Text>
                        <div style={{ color: '#667085', fontSize: 13, marginTop: 2 }}>
                          {formatDate(record.createdAt)}
                        </div>
                      </div>
                      <RightOutlined style={{ color: '#98a2b3' }} />
                    </ListRow>
                  ))}
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bệnh án nào" />
              )}
            </Card>
          </Space>
        </Col>

        <Col xs={24} xl={9}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <SectionTitle
                  icon={<MedicineBoxOutlined />}
                  title="Đơn thuốc gần nhất"
                  color="#722ed1"
                />
              }
              loading={prescriptions.isPending}
            >
              {latestPrescription ? (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Kê ngày {formatDate(latestPrescription.createdAt)}
                  </Typography.Text>

                  {latestPrescription.details.map((detail) => (
                    <div
                      key={detail.medicineId}
                      style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 14 }}
                    >
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}
                      >
                        <Typography.Text strong>
                          {detail.medicineName} {detail.dosage}
                        </Typography.Text>
                        {/* Quantity, not a status: a prescription line has no active flag. */}
                        <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                          {detail.quantity}
                        </Tag>
                      </div>
                      <div style={{ color: '#667085', fontSize: 13, marginTop: 4 }}>
                        {detail.frequency} · {detail.duration}
                      </div>
                    </div>
                  ))}

                  <Button block onClick={() => navigate('/prescriptions')}>
                    Xem tất cả đơn thuốc
                  </Button>
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn thuốc nào" />
              )}
            </Card>

            <Card
              title={
                <SectionTitle icon={<MedicineBoxOutlined />} title="Lần khám gần nhất" color="#eb2f96" />
              }
              loading={lastVisit.isPending}
            >
              {lastVisit.data ? (
                <div style={{ borderRadius: 12, background: '#f8fafc', padding: 16 }}>
                  <Typography.Text strong>{lastVisit.data.doctorSpecialty}</Typography.Text>
                  <div style={{ color: '#667085', fontSize: 13, marginTop: 4 }}>
                    BS {lastVisit.data.doctorFullName}
                  </div>
                  <div style={{ color: '#667085', fontSize: 13, marginTop: 4 }}>
                    {formatDate(lastVisit.data.appointmentDate)} ·{' '}
                    {formatTime(lastVisit.data.startTime)}
                  </div>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa khám lần nào" />
              )}
            </Card>

            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text strong>Cần khám bệnh?</Typography.Text>
                <Typography.Text type="secondary">
                  Chọn bác sĩ theo chuyên khoa và giữ chỗ ca khám 30 phút.
                </Typography.Text>
                <Button type="primary" block onClick={() => navigate('/doctors')}>
                  Đặt lịch khám
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
