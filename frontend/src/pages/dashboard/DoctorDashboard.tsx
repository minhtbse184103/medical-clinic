import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, List, Row, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { doctorApi } from '../../api/doctor';
import { StatCard } from '../../components/StatCard';
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_LABEL,
  isReadyToExamine,
} from '../../lib/appointmentStatus';
import { errorMessage } from '../../lib/apiError';
import { formatTime, toApiDate } from '../../lib/datetime';

export function DoctorDashboard() {
  const navigate = useNavigate();
  const today = toApiDate(dayjs());

  /*
   * One request for today's list, with the counts derived from it. A day's worth of
   * 30-minute slots cannot exceed a page, and this avoids three separate count calls.
   */
  const todayQuery = useQuery({
    queryKey: ['doctor-appointments', { date: today, size: 100 }],
    queryFn: () => doctorApi.appointments({ page: 0, size: 100, date: today }),
  });

  // A cancelled visit is not a visit: it must not inflate today's workload.
  const appointments = (todayQuery.data?.content ?? []).filter(
    (appointment) => appointment.status !== 'CANCELLED',
  );
  const waiting = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const done = appointments.filter((a) => a.status === 'COMPLETED').length;
  const readyNow = appointments.filter(isReadyToExamine);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {todayQuery.isError && (
        <Alert type="error" showIcon message={errorMessage(todayQuery.error)} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Ca khám hôm nay"
            value={appointments.length}
            icon={<CalendarOutlined />}
            loading={todayQuery.isPending}
            onClick={() => navigate('/doctor/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Chờ khám"
            value={waiting}
            icon={<ClockCircleOutlined />}
            loading={todayQuery.isPending}
            highlight={readyNow.length > 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Đã khám hôm nay"
            value={done}
            icon={<CheckCircleOutlined />}
            loading={todayQuery.isPending}
          />
        </Col>
      </Row>

      <Card
        title="Lịch khám hôm nay"
        loading={todayQuery.isPending}
        extra={
          <Button type="link" onClick={() => navigate('/doctor/appointments')}>
            Xem toàn bộ lịch
          </Button>
        }
      >
        {appointments.length > 0 ? (
          <List
            dataSource={appointments}
            renderItem={(appointment) => (
              <List.Item
                actions={
                  isReadyToExamine(appointment)
                    ? [
                        <Button
                          key="examine"
                          type="primary"
                          onClick={() =>
                            navigate(
                              `/doctor/appointments/${appointment.appointmentId}/examine`,
                            )
                          }
                        >
                          Khám
                        </Button>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{formatTime(appointment.startTime)}</span>
                      <Typography.Text strong>{appointment.patientFullName}</Typography.Text>
                      <Tag color={APPOINTMENT_STATUS_COLOR[appointment.status]}>
                        {APPOINTMENT_STATUS_LABEL[appointment.status]}
                      </Tag>
                    </Space>
                  }
                  description={appointment.reason}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Hôm nay bạn không có ca khám nào"
          />
        )}
      </Card>
    </Space>
  );
}
