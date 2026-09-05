import {
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MedicineBoxOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Empty, Row, Space, Tag, Typography } from 'antd';
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

  /*
   * "Upcoming" means still active. The API filters on one status at a time, so a wider
   * page is fetched by date and narrowed here; otherwise cancelled and completed visits
   * appear under a heading that promises neither.
   */
  const upcoming = useQuery({
    queryKey: ['my-appointments-upcoming'],
    queryFn: () =>
      appointmentsApi.mine({ page: 0, size: 20, fromDate: today, sort: 'appointmentDate,asc' }),
    select: (page) =>
      page.content
        .filter(
          (appointment) =>
            appointment.status === 'PENDING' || appointment.status === 'CONFIRMED',
        )
        .slice(0, 4),
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

  const upcomingList = upcoming.data ?? [];
  const nextAppointment = upcomingList[0];
  const latestPrescription = prescriptions.data?.content[0];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            featured
            label="Lịch khám tiếp theo"
            value={nextAppointment ? formatDate(nextAppointment.appointmentDate) : 'Chưa có'}
            sub={
              nextAppointment
                ? `${formatTime(nextAppointment.startTime)} – ${formatTime(nextAppointment.endTime)} · BS. ${nextAppointment.doctorFullName}`
                : 'Bạn chưa đặt lịch nào'
            }
            icon={<CalendarOutlined />}
            loading={upcoming.isPending}
            onClick={() => navigate('/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            label="Lịch hẹn chờ xác nhận"
            value={pending.data ?? 0}
            sub={(pending.data ?? 0) > 0 ? 'Đang được lễ tân xử lý' : 'Không có lịch nào chờ'}
            icon={<ClockCircleOutlined />}
            iconColor="#d48806"
            iconBg="#fffbe6"
            loading={pending.isPending}
            onClick={() => navigate('/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            label="Đơn thuốc"
            value={prescriptions.data?.totalElements ?? 0}
            sub={
              latestPrescription
                ? `${latestPrescription.details.length} thuốc trong đơn gần nhất`
                : 'Chưa có đơn nào'
            }
            icon={<MedicineBoxOutlined />}
            iconColor="#722ed1"
            iconBg="#f9f0ff"
            loading={prescriptions.isPending}
            onClick={() => navigate('/prescriptions')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryTile
            label="Hồ sơ bệnh án"
            value={records.data?.totalElements ?? 0}
            sub="Cập nhật sau mỗi lần khám"
            icon={<FileTextOutlined />}
            iconColor="#389e0d"
            iconBg="#f6ffed"
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
              {upcomingList.length > 0 ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {upcomingList.map((appointment) => (
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
                        <Tag color="blue" style={{ marginInlineEnd: 0, flexShrink: 0 }}>
                          SL: {detail.quantity}
                        </Tag>
                      </div>
                      {/* Labelled, because the doctor may enter bare values like "3" and "5". */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          color: '#667085',
                          fontSize: 13,
                          marginTop: 6,
                        }}
                      >
                        <ClockCircleOutlined style={{ marginTop: 3, flexShrink: 0 }} />
                        <span>
                          Tần suất {detail.frequency} · Dùng trong {detail.duration}
                          {detail.instruction ? ` · ${detail.instruction}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    style={{ paddingInline: 0 }}
                    onClick={() => navigate('/prescriptions')}
                  >
                    Xem chi tiết &amp; hướng dẫn dùng thuốc
                  </Button>
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn thuốc nào" />
              )}
            </Card>

            <Card
              title={
                <SectionTitle icon={<HistoryOutlined />} title="Lần khám gần nhất" color="#eb2f96" />
              }
              loading={lastVisit.isPending}
            >
              {lastVisit.data ? (
                <Descriptions
                  column={1}
                  size="small"
                  labelStyle={{ color: '#667085', width: 130 }}
                  items={[
                    {
                      key: 'specialty',
                      label: 'Chuyên khoa',
                      children: (
                        <Typography.Text strong>{lastVisit.data.doctorSpecialty}</Typography.Text>
                      ),
                    },
                    {
                      key: 'doctor',
                      label: 'Bác sĩ phụ trách',
                      children: `BS. ${lastVisit.data.doctorFullName}`,
                    },
                    {
                      key: 'time',
                      label: 'Thời gian khám',
                      children: `${formatDate(lastVisit.data.appointmentDate)} · ${formatTime(lastVisit.data.startTime)} – ${formatTime(lastVisit.data.endTime)}`,
                    },
                  ]}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa khám lần nào" />
              )}
            </Card>

            <Card style={{ background: '#f8fafc' }}>
              <Space align="start" size={12} style={{ marginBottom: 16 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#eff6ff',
                    color: '#1677ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MedicineBoxOutlined />
                </span>
                <Typography.Text>
                  Bạn cần khám bệnh hoặc tái khám định kỳ theo chỉ định của bác sĩ?
                </Typography.Text>
              </Space>
              <Button
                type="primary"
                block
                size="large"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/doctors')}
              >
                Đặt lịch khám
              </Button>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
