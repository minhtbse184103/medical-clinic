import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { doctorApi } from '../../api/doctor';
import { doctorsApi } from '../../api/doctors';
import { SummaryTile } from '../../components/SummaryTile';
import { errorMessage } from '../../lib/apiError';
import { dayOfWeekFromIndex, isReadyToExamine } from '../../lib/appointmentStatus';
import { formatTime, toApiDate } from '../../lib/datetime';
import type { DoctorAppointment } from '../../types/api';

/**
 * What the doctor needs to know about a row, which is finer than the stored status:
 * a confirmed visit whose time has arrived is ready to be examined, one still ahead is not.
 * The design's "Đã có mặt tại phòng" is not available — nothing records a patient arriving.
 */
function receptionStatus(appointment: DoctorAppointment): { label: string; color: string } {
  switch (appointment.status) {
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'red' };
    case 'COMPLETED':
      return { label: 'Đã khám xong', color: 'green' };
    case 'PENDING':
      return { label: 'Chờ xác nhận', color: 'gold' };
    default:
      return isReadyToExamine(appointment)
        ? { label: 'Sẵn sàng khám', color: 'blue' }
        : { label: 'Đã xác nhận', color: 'default' };
  }
}

export function DoctorDashboard() {
  const navigate = useNavigate();
  const today = toApiDate(dayjs());

  const profile = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorApi.profile(),
  });

  /*
   * One request for today's list, with the counts derived from it. A day of 30-minute
   * slots cannot exceed a page, and this avoids three separate count calls.
   */
  const todayQuery = useQuery({
    queryKey: ['doctor-appointments', { date: today, size: 100 }],
    queryFn: () => doctorApi.appointments({ page: 0, size: 100, date: today }),
  });

  /** The working shift shown top right comes from the weekly schedule for today's weekday. */
  const schedules = useQuery({
    queryKey: ['doctor-schedules', profile.data?.doctorId],
    queryFn: () => doctorsApi.schedules(profile.data!.doctorId),
    enabled: profile.data !== undefined,
  });

  const rows = todayQuery.data?.content ?? [];
  // A cancelled visit is not work: it stays visible in the list but out of the counts.
  const active = rows.filter((row) => row.status !== 'CANCELLED');
  const waiting = active.filter((row) => row.status === 'CONFIRMED').length;
  const done = active.filter((row) => row.status === 'COMPLETED').length;
  const readyNow = active.filter(isReadyToExamine).length;

  const todayWeekday = dayOfWeekFromIndex(dayjs().day());
  const todayShift = (schedules.data ?? []).find(
    (schedule) => schedule.dayOfWeek === todayWeekday,
  );
  const now = dayjs().format('HH:mm:ss');
  const shiftActive =
    todayShift !== undefined && now >= todayShift.startTime && now <= todayShift.endTime;

  const columns: ColumnsType<DoctorAppointment> = [
    {
      title: 'KHUNG GIỜ',
      key: 'slot',
      width: 190,
      render: (_, row) => {
        const cancelled = row.status === 'CANCELLED';
        const status = receptionStatus(row);
        return (
          <Space size={8}>
            {cancelled ? (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            ) : row.status === 'COMPLETED' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ClockCircleOutlined style={{ color: status.color === 'blue' ? '#1677ff' : '#faad14' }} />
            )}
            <span style={cancelled ? { textDecoration: 'line-through', color: '#98a2b3' } : undefined}>
              {formatTime(row.startTime)} – {formatTime(row.endTime)}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'BỆNH NHÂN',
      key: 'patient',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.patientFullName}</Typography.Text>
          {/* Age and gender are not in this response, and no endpoint gives a doctor
              a patient's profile, so the row carries the patient id only. */}
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            Mã BN: {row.patientId}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      key: 'status',
      width: 160,
      render: (_, row) => {
        const status = receptionStatus(row);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: 'LÝ DO KHÁM BỆNH',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string, row) =>
        row.status === 'CANCELLED' ? (
          <Typography.Text type="secondary" italic>
            {reason}
          </Typography.Text>
        ) : (
          reason
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) =>
        isReadyToExamine(row) ? (
          <Button
            type="primary"
            onClick={() => navigate(`/doctor/appointments/${row.appointmentId}/examine`)}
          >
            Khám
          </Button>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {todayQuery.isError && (
        <Alert type="error" showIcon message={errorMessage(todayQuery.error)} />
      )}

      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} lg={12}>
          {profile.data && (
            <Space size={10} wrap>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                {profile.data.specialty}
              </Tag>
              <Typography.Text type="secondary">
                Số giấy phép {profile.data.licenseNumber}
              </Typography.Text>
            </Space>
          )}
        </Col>

        <Col xs={24} lg={12}>
          {/* Derived from the weekly schedule; the design's room number does not exist. */}
          <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Space size={8}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    display: 'inline-block',
                    background: shiftActive ? '#52c41a' : '#d0d5dd',
                  }}
                />
                <span>
                  {todayShift
                    ? shiftActive
                      ? 'Đang trong ca làm việc'
                      : 'Hôm nay có ca làm việc'
                    : 'Hôm nay không có ca làm việc'}
                </span>
              </Space>
              {todayShift && (
                <Tag style={{ marginInlineEnd: 0 }}>
                  {formatTime(todayShift.startTime)} – {formatTime(todayShift.endTime)}
                </Tag>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <SummaryTile
            featured
            label="Tổng số ca khám hôm nay"
            value={`${active.length} ca khám`}
            sub="Ca khám chuẩn 30 phút"
            icon={<CalendarOutlined />}
            loading={todayQuery.isPending}
            onClick={() => navigate('/doctor/appointments')}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Chờ khám"
            value={`${waiting} bệnh nhân`}
            sub={
              readyNow > 0 ? (
                <Space size={6}>
                  <WarningOutlined />
                  <span>Cần khám ngay: {readyNow} ca đã tới giờ</span>
                </Space>
              ) : (
                'Chưa có ca nào tới giờ khám'
              )
            }
            icon={<HourglassOutlined />}
            iconColor="#d48806"
            iconBg="#fffbe6"
            loading={todayQuery.isPending}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SummaryTile
            label="Đã khám xong"
            value={`${done} ca`}
            sub="Đã ghi bệnh án"
            icon={<CheckCircleOutlined />}
            iconColor="#389e0d"
            iconBg="#f6ffed"
            loading={todayQuery.isPending}
          />
        </Col>
      </Row>

      <Card
        title={
          <Space direction="vertical" size={0}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Lịch khám hôm nay</span>
            <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              Thứ tự tiếp nhận bệnh nhân theo khung giờ đã đặt
            </Typography.Text>
          </Space>
        }
        extra={
          <Button type="link" onClick={() => navigate('/doctor/appointments')}>
            Xem toàn bộ lịch
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table<DoctorAppointment>
          rowKey="appointmentId"
          columns={columns}
          dataSource={rows}
          loading={todayQuery.isPending}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Hôm nay bạn không có ca khám nào"
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
}
