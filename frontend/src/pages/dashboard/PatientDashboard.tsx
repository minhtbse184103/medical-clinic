import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, List, Row, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { appointmentsApi } from '../../api/appointments';
import { patientApi } from '../../api/patient';
import { StatCard } from '../../components/StatCard';
import { APPOINTMENT_STATUS_COLOR, APPOINTMENT_STATUS_LABEL } from '../../lib/appointmentStatus';
import { formatDate, formatTime, toApiDate } from '../../lib/datetime';
import type { AppointmentStatus } from '../../types/api';

/** Counting through totalElements with size=1 avoids downloading rows just to count them. */
function useAppointmentCount(status: AppointmentStatus, fromDate?: string) {
  return useQuery({
    queryKey: ['my-appointments-count', status, fromDate],
    queryFn: () => appointmentsApi.mine({ page: 0, size: 1, status, fromDate }),
    select: (page) => page.totalElements,
  });
}

export function PatientDashboard() {
  const navigate = useNavigate();
  const today = toApiDate(dayjs());

  const pending = useAppointmentCount('PENDING');
  const confirmed = useAppointmentCount('CONFIRMED', today);
  const completed = useAppointmentCount('COMPLETED');

  const upcoming = useQuery({
    queryKey: ['my-appointments-upcoming'],
    queryFn: () =>
      appointmentsApi.mine({ page: 0, size: 5, fromDate: today, sort: 'appointmentDate,asc' }),
  });

  const prescriptions = useQuery({
    queryKey: ['my-prescriptions', { page: 0, size: 1 }],
    queryFn: () => patientApi.prescriptions(0, 1),
  });

  const latestPrescription = prescriptions.data?.content[0];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Lịch sắp tới"
            value={confirmed.data ?? 0}
            icon={<CalendarOutlined />}
            loading={confirmed.isPending}
            onClick={() => navigate('/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Chờ lễ tân xác nhận"
            value={pending.data ?? 0}
            icon={<ClockCircleOutlined />}
            loading={pending.isPending}
            onClick={() => navigate('/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Đã khám"
            value={completed.data ?? 0}
            icon={<CheckCircleOutlined />}
            loading={completed.isPending}
            onClick={() => navigate('/medical-records')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Lịch hẹn sắp tới"
            loading={upcoming.isPending}
            extra={
              <Button type="link" onClick={() => navigate('/appointments')}>
                Xem tất cả
              </Button>
            }
          >
            {upcoming.data && upcoming.data.content.length > 0 ? (
              <List
                dataSource={upcoming.data.content}
                renderItem={(appointment) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{appointment.doctorFullName}</span>
                          <Tag color={APPOINTMENT_STATUS_COLOR[appointment.status]}>
                            {APPOINTMENT_STATUS_LABEL[appointment.status]}
                          </Tag>
                        </Space>
                      }
                      description={
                        <>
                          {formatDate(appointment.appointmentDate)} ·{' '}
                          {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)} ·{' '}
                          {appointment.doctorSpecialty}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Bạn chưa có lịch hẹn nào sắp tới"
              >
                <Button type="primary" onClick={() => navigate('/doctors')}>
                  Đặt lịch khám
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text strong>Cần khám bệnh?</Typography.Text>
                <Typography.Text type="secondary">
                  Chọn bác sĩ theo chuyên khoa và đặt lịch trong vài bước.
                </Typography.Text>
                <Button type="primary" block onClick={() => navigate('/doctors')}>
                  Đặt lịch khám
                </Button>
              </Space>
            </Card>

            <Card title="Đơn thuốc gần nhất" loading={prescriptions.isPending}>
              {latestPrescription ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text type="secondary">
                    {formatDate(latestPrescription.createdAt)}
                  </Typography.Text>
                  {latestPrescription.details.map((detail) => (
                    <Typography.Text key={detail.medicineId}>
                      • {detail.medicineName} — {detail.dosage}, {detail.frequency}
                    </Typography.Text>
                  ))}
                  <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/prescriptions')}>
                    Xem tất cả đơn thuốc
                  </Button>
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn thuốc nào" />
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
