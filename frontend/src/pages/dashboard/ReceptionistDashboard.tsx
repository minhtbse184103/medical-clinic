import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HourglassOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  SafetyOutlined,
  UserAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { receptionistApi } from '../../api/receptionist';
import { SummaryTile } from '../../components/SummaryTile';
import { errorMessage } from '../../lib/apiError';
import { formatDate, formatTime, toApiDate } from '../../lib/datetime';
import { initials } from '../../lib/user';
import type { ReceptionistAppointment } from '../../types/api';

interface DoctorOnDuty {
  doctorId: number;
  name: string;
  specialty: string;
  firstStart: string;
  lastEnd: string;
  examining: boolean;
}

/**
 * Who has patients today, grouped from the day's appointments. The design showed a duty
 * roster with room numbers; there are no rooms, and reading every doctor's weekly schedule
 * would mean one request per doctor. This uses the list already fetched.
 */
function doctorsWithVisitsToday(rows: ReceptionistAppointment[]): DoctorOnDuty[] {
  const now = dayjs().format('HH:mm:ss');
  const byDoctor = new Map<number, DoctorOnDuty>();

  for (const row of rows) {
    const current = byDoctor.get(row.doctorId);
    const examining = now >= row.startTime && now <= row.endTime;

    if (!current) {
      byDoctor.set(row.doctorId, {
        doctorId: row.doctorId,
        name: row.doctorFullName,
        specialty: row.doctorSpecialty,
        firstStart: row.startTime,
        lastEnd: row.endTime,
        examining,
      });
      continue;
    }

    current.firstStart = row.startTime < current.firstStart ? row.startTime : current.firstStart;
    current.lastEnd = row.endTime > current.lastEnd ? row.endTime : current.lastEnd;
    current.examining = current.examining || examining;
  }

  return [...byDoctor.values()].sort((a, b) => a.firstStart.localeCompare(b.firstStart));
}

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const today = toApiDate(dayjs());

  const pendingQuery = useQuery({
    queryKey: ['receptionist-appointments', { status: 'PENDING', size: 5 }],
    queryFn: () => receptionistApi.appointments({ page: 0, size: 5, status: 'PENDING' }),
  });

  /* One request for the day; every figure on this screen is derived from it. */
  const todayQuery = useQuery({
    queryKey: ['receptionist-appointments', { date: today, size: 100 }],
    queryFn: () => receptionistApi.appointments({ page: 0, size: 100, date: today }),
    select: (page) => {
      const active = page.content.filter((row) => row.status !== 'CANCELLED');
      const confirmed = active.filter((row) => row.status === 'CONFIRMED');
      return {
        total: active.length,
        confirmed: confirmed.length,
        specialties: [...new Set(active.map((row) => row.doctorSpecialty))],
        doctors: doctorsWithVisitsToday(active),
      };
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] });
    message.success('Đã làm mới dữ liệu.');
  };

  const confirmMutation = useMutation({
    mutationFn: (appointmentId: number) => receptionistApi.confirm(appointmentId),
    onSuccess: async () => {
      message.success('Đã xác nhận lịch hẹn.');
      await queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] });
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const pendingCount = pendingQuery.data?.totalElements ?? 0;
  const summary = todayQuery.data;
  // Confirmed out of today's active bookings: what share of the desk's work is done.
  const rate = summary && summary.total > 0 ? (summary.confirmed / summary.total) * 100 : null;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {(pendingQuery.isError || todayQuery.isError) && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(pendingQuery.error ?? todayQuery.error)}
        />
      )}

      <Flexbar onRefresh={refresh} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Lịch hẹn chờ xác nhận"
            value={`${pendingCount} lịch hẹn`}
            sub={
              pendingCount > 0 ? (
                <Space size={6}>
                  <WarningOutlined />
                  <span>Cần xử lý để giữ chỗ ca khám</span>
                </Space>
              ) : (
                'Không còn lịch nào chờ'
              )
            }
            icon={<HourglassOutlined />}
            iconColor="#d48806"
            iconBg="#fffbe6"
            featured={pendingCount > 0}
            loading={pendingQuery.isPending}
            onClick={() => navigate('/receptionist/appointments')}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Tổng số lịch hẹn hôm nay"
            value={`${summary?.total ?? 0} lịch hẹn`}
            sub={
              summary && summary.specialties.length > 0
                ? summary.specialties.join(' · ')
                : 'Hôm nay chưa có lịch hẹn'
            }
            icon={<CalendarOutlined />}
            loading={todayQuery.isPending}
            onClick={() => navigate('/receptionist/appointments')}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Đã xác nhận hôm nay"
            value={`${summary?.confirmed ?? 0} ca`}
            /* A share of today's bookings, not a target: no goal is configured anywhere. */
            sub={rate === null ? 'Chưa có ca nào' : `Tỷ lệ đã xác nhận: ${rate.toFixed(0)}%`}
            icon={<CheckCircleOutlined />}
            iconColor="#389e0d"
            iconBg="#f6ffed"
            loading={todayQuery.isPending}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title={
              <Space size={10}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Lịch hẹn chờ xác nhận</span>
                {pendingCount > 0 && <Tag color="gold">{pendingCount}</Tag>}
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/receptionist/appointments')}>
                Xem tất cả
              </Button>
            }
            loading={pendingQuery.isPending}
          >
            {pendingQuery.data && pendingQuery.data.content.length > 0 ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {pendingQuery.data.content.map((row) => (
                  <div
                    key={row.appointmentId}
                    style={{ padding: 16, borderRadius: 12, background: '#f8fafc' }}
                  >
                    <Space align="start" size={12} style={{ width: '100%' }}>
                      <Avatar style={{ background: '#e6f4ff', color: '#1677ff', fontWeight: 600 }}>
                        {initials(row.patientFullName)}
                      </Avatar>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space size={8} wrap>
                          <Typography.Text strong>{row.patientFullName}</Typography.Text>
                          <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                            Chờ duyệt
                          </Tag>
                        </Space>

                        <Space size={16} wrap style={{ fontSize: 13, marginTop: 6 }}>
                          <Space size={6} style={{ color: '#1677ff' }}>
                            <ClockCircleOutlined />
                            <span>
                              {formatDate(row.appointmentDate)} · {formatTime(row.startTime)} –{' '}
                              {formatTime(row.endTime)}
                            </span>
                          </Space>
                          <Space size={6} style={{ color: '#667085' }}>
                            <MedicineBoxOutlined />
                            <span>
                              BS. {row.doctorFullName} ({row.doctorSpecialty})
                            </span>
                          </Space>
                        </Space>

                        <Typography.Paragraph
                          type="secondary"
                          italic
                          style={{ fontSize: 13, marginTop: 6, marginBottom: 0 }}
                        >
                          Lý do khám: {row.reason}
                        </Typography.Paragraph>
                      </div>

                      <Popconfirm
                        title="Xác nhận lịch hẹn này?"
                        okText="Xác nhận"
                        cancelText="Đóng"
                        onConfirm={() => confirmMutation.mutate(row.appointmentId)}
                      >
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          loading={confirmMutation.isPending}
                        >
                          Xác nhận
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có lịch hẹn nào chờ xác nhận"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <Space size={10}>
                  <UserAddOutlined style={{ color: '#1677ff' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Tiếp nhận trực tiếp</span>
                </Space>
              }
            >
              <Typography.Paragraph style={{ marginBottom: 16 }}>
                Bệnh nhân đến quầy hoặc gọi điện, lễ tân tìm hồ sơ và giữ chỗ ca khám 30 phút hộ
                họ.
              </Typography.Paragraph>
              <Button
                type="primary"
                block
                size="large"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/receptionist/book')}
              >
                Đặt lịch hộ bệnh nhân
              </Button>
            </Card>

            <Card
              title={
                <Space size={10}>
                  <MedicineBoxOutlined style={{ color: '#0d9488' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Bác sĩ có lịch hôm nay</span>
                </Space>
              }
              loading={todayQuery.isPending}
            >
              {summary && summary.doctors.length > 0 ? (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {summary.doctors.map((doctor) => (
                    <div
                      key={doctor.doctorId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <Avatar style={{ background: '#e6fffb', color: '#08979c', fontWeight: 600 }}>
                        {initials(doctor.name)}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong>BS. {doctor.name}</Typography.Text>
                        <div style={{ fontSize: 12.5, color: '#667085' }}>
                          {doctor.specialty} · {formatTime(doctor.firstStart)} –{' '}
                          {formatTime(doctor.lastEnd)}
                        </div>
                      </div>
                      <Tag
                        color={doctor.examining ? 'green' : 'default'}
                        style={{ marginInlineEnd: 0 }}
                      >
                        {doctor.examining ? 'Đang khám' : 'Chưa tới giờ'}
                      </Tag>
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Hôm nay chưa có bác sĩ nào có lịch"
                />
              )}
            </Card>

            {/* Rules the system genuinely enforces, not desk policy it cannot check. */}
            <Card
              title={
                <Space size={10}>
                  <SafetyOutlined style={{ color: '#722ed1' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Quy tắc tiếp nhận</span>
                </Space>
              }
            >
              <ul style={{ margin: 0, paddingInlineStart: 18, color: '#475467', lineHeight: 2 }}>
                <li>Mỗi ca khám cố định 30 phút, sinh từ lịch làm việc của bác sĩ.</li>
                <li>Chỉ lịch đang chờ xác nhận mới xác nhận được.</li>
                <li>Lễ tân hủy được kể cả sát giờ, bệnh nhân thì giới hạn 2 tiếng.</li>
              </ul>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}

/** Small strip above the tiles: a refresh action for a desk that watches this screen. */
function Flexbar({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button icon={<ReloadOutlined />} onClick={onRefresh}>
        Làm mới dữ liệu
      </Button>
    </div>
  );
}
