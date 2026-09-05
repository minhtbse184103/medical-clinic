import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  List,
  Popconfirm,
  Row,
  Space,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { receptionistApi } from '../../api/receptionist';
import { StatCard } from '../../components/StatCard';
import { errorMessage } from '../../lib/apiError';
import { formatDate, formatTime, toApiDate } from '../../lib/datetime';

function usePendingCount() {
  return useQuery({
    queryKey: ['receptionist-appointments-count', { status: 'PENDING' }],
    queryFn: () => receptionistApi.appointments({ page: 0, size: 1, status: 'PENDING' }),
    select: (page) => page.totalElements,
  });
}

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const today = toApiDate(dayjs());

  const pending = usePendingCount();

  /*
   * One request for the day, with both figures derived from it. Counting through the API
   * would need two calls and would include cancelled appointments, which are not work.
   */
  const todayQuery = useQuery({
    queryKey: ['receptionist-appointments', { date: today, size: 100 }],
    queryFn: () => receptionistApi.appointments({ page: 0, size: 100, date: today }),
    select: (page) => {
      const active = page.content.filter((a) => a.status !== 'CANCELLED');
      return {
        total: active.length,
        confirmed: active.filter((a) => a.status === 'CONFIRMED').length,
      };
    },
  });

  const pendingList = useQuery({
    queryKey: ['receptionist-appointments', { status: 'PENDING', size: 5 }],
    queryFn: () => receptionistApi.appointments({ page: 0, size: 5, status: 'PENDING' }),
  });

  const confirmMutation = useMutation({
    mutationFn: (appointmentId: number) => receptionistApi.confirm(appointmentId),
    onSuccess: async () => {
      message.success('Đã xác nhận lịch hẹn.');
      // Both the counts and the list read the same data, so refresh every receptionist query.
      await queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] });
      await queryClient.invalidateQueries({ queryKey: ['receptionist-appointments-count'] });
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const waitingCount = pending.data ?? 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {pendingList.isError && (
        <Alert type="error" showIcon message={errorMessage(pendingList.error)} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Chờ xác nhận"
            value={waitingCount}
            icon={<ClockCircleOutlined />}
            loading={pending.isPending}
            // The one number on this screen that means someone has to act.
            highlight={waitingCount > 0}
            onClick={() => navigate('/receptionist/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Lịch hẹn hôm nay"
            value={todayQuery.data?.total ?? 0}
            icon={<CalendarOutlined />}
            loading={todayQuery.isPending}
            onClick={() => navigate('/receptionist/appointments')}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Đã xác nhận hôm nay"
            value={todayQuery.data?.confirmed ?? 0}
            icon={<CheckCircleOutlined />}
            loading={todayQuery.isPending}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Lịch hẹn chờ xác nhận"
            loading={pendingList.isPending}
            extra={
              <Button type="link" onClick={() => navigate('/receptionist/appointments')}>
                Xem tất cả
              </Button>
            }
          >
            {pendingList.data && pendingList.data.content.length > 0 ? (
              <List
                dataSource={pendingList.data.content}
                renderItem={(appointment) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="confirm"
                        title="Xác nhận lịch hẹn này?"
                        okText="Xác nhận"
                        cancelText="Đóng"
                        onConfirm={() => confirmMutation.mutate(appointment.appointmentId)}
                      >
                        <Button type="primary" loading={confirmMutation.isPending}>
                          Xác nhận
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Typography.Text strong>{appointment.patientFullName}</Typography.Text>
                      }
                      description={
                        <>
                          {formatDate(appointment.appointmentDate)} ·{' '}
                          {formatTime(appointment.startTime)} · BS {appointment.doctorFullName}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có lịch hẹn nào chờ xác nhận"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text strong>Bệnh nhân đến quầy?</Typography.Text>
              <Typography.Text type="secondary">
                Tìm bệnh nhân đã có tài khoản rồi đặt lịch hộ họ.
              </Typography.Text>
              <Button type="primary" block onClick={() => navigate('/receptionist/book')}>
                Đặt lịch hộ bệnh nhân
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
