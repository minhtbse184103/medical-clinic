import {
  CalendarOutlined,
  IdcardOutlined,
  LockOutlined,
  MoonOutlined,
  SaveOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo } from 'react';

import { doctorApi } from '../api/doctor';
import { doctorsApi } from '../api/doctors';
import { useAuth } from '../auth/useAuth';
import { PageHeader } from '../components/PageHeader';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { DAY_OF_WEEK_LABEL } from '../lib/appointmentStatus';
import { formatDate, formatDateTime, formatTime } from '../lib/datetime';
import { sessionCapacity } from '../lib/slots';
import type { DayOfWeek, DoctorSchedule, UpdateDoctorProfileRequest } from '../types/api';

const PANEL_BG = '#f8fafc';

const WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

/** One line of the weekly roster: a session of a day, or a day with no session at all. */
interface RosterRow {
  key: string;
  dayOfWeek: DayOfWeek;
  schedule: DoctorSchedule | null;
}

function buildRoster(schedules: DoctorSchedule[]): RosterRow[] {
  return WEEK.flatMap<RosterRow>((day) => {
    const ofDay = schedules
      .filter((schedule) => schedule.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (ofDay.length === 0) {
      return [{ key: day, dayOfWeek: day, schedule: null }];
    }
    return ofDay.map((schedule) => ({
      key: `${day}-${schedule.scheduleId}`,
      dayOfWeek: day,
      schedule,
    }));
  });
}

/** Morning or afternoon, decided by the start time; the API has no session name. */
const isMorning = (schedule: DoctorSchedule) => schedule.startTime < '12:00:00';

function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
        {label}
      </Typography.Text>
      <div style={{ marginTop: 4, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

const rosterColumns: ColumnsType<RosterRow> = [
  {
    title: 'THỨ TRONG TUẦN',
    dataIndex: 'dayOfWeek',
    key: 'dayOfWeek',
    width: 150,
    render: (day: DayOfWeek, row) => (
      <Tag color={row.schedule ? 'blue' : 'default'} style={{ marginInlineEnd: 0 }}>
        {DAY_OF_WEEK_LABEL[day]}
      </Tag>
    ),
  },
  {
    title: 'CA LÀM VIỆC',
    key: 'session',
    width: 170,
    render: (_, row) =>
      row.schedule ? (
        <Space size={6}>
          {isMorning(row.schedule) ? (
            <SunOutlined style={{ color: '#f59e0b' }} />
          ) : (
            <MoonOutlined style={{ color: '#6366f1' }} />
          )}
          <span>{isMorning(row.schedule) ? 'Ca sáng' : 'Ca chiều'}</span>
        </Space>
      ) : (
        <Typography.Text type="secondary">Không có ca</Typography.Text>
      ),
  },
  {
    title: 'KHUNG GIỜ TIẾP NHẬN KHÁM',
    key: 'time',
    render: (_, row) =>
      row.schedule ? (
        <div>
          <div>
            {formatTime(row.schedule.startTime)} – {formatTime(row.schedule.endTime)}
          </div>
          {/* Derived, not stored: the number of 30-minute visits the window holds. */}
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            Tối đa {sessionCapacity(row.schedule)} ca khám 30 phút
          </Typography.Text>
        </div>
      ) : (
        <Typography.Text type="secondary">—</Typography.Text>
      ),
  },
  {
    title: 'TRẠNG THÁI CA',
    key: 'status',
    width: 140,
    render: (_, row) =>
      row.schedule ? (
        <Tag color="green" style={{ marginInlineEnd: 0 }}>
          Đang áp dụng
        </Tag>
      ) : (
        <Tag style={{ marginInlineEnd: 0 }}>Nghỉ</Tag>
      ),
  },
];

export function DoctorProfilePage() {
  const [form] = Form.useForm<UpdateDoctorProfileRequest>();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { message } = AntdApp.useApp();

  const profileQuery = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorApi.profile(),
  });

  // The weekly schedule is read through the existing per-doctor endpoint, using the
  // doctorId that the profile call returns, so there is no duplicate endpoint for it.
  const schedulesQuery = useQuery({
    queryKey: ['doctor-schedules', profileQuery.data?.doctorId],
    queryFn: () => doctorsApi.schedules(profileQuery.data!.doctorId),
    enabled: profileQuery.data !== undefined,
  });

  const roster = useMemo(() => buildRoster(schedulesQuery.data ?? []), [schedulesQuery.data]);
  const sessionCount = schedulesQuery.data?.length ?? 0;

  /** Also backs "Khôi phục ban đầu", which puts the last saved values back in the form. */
  const resetForm = useCallback(() => {
    if (profileQuery.data) {
      form.setFieldsValue({
        fullName: profileQuery.data.fullName,
        phone: profileQuery.data.phone ?? undefined,
        bio: profileQuery.data.bio ?? undefined,
      });
    }
  }, [profileQuery.data, form]);

  useEffect(resetForm, [resetForm]);

  const updateMutation = useMutation({
    mutationFn: (values: UpdateDoctorProfileRequest) => doctorApi.updateProfile(values),
    onSuccess: async (updated) => {
      message.success('Đã cập nhật hồ sơ.');
      queryClient.setQueryData(['doctor-profile'], updated);
      // The header and the public doctor directory both show the name.
      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      await refreshUser();
    },
    onError: (error) => {
      if (!applyFieldErrors(form, error)) {
        message.error(errorMessage(error));
      }
    },
  });

  if (profileQuery.isPending) {
    return <Skeleton active />;
  }

  if (profileQuery.isError) {
    return <Alert type="error" showIcon message={errorMessage(profileQuery.error)} />;
  }

  const profile = profileQuery.data;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: 'Hồ sơ & Lịch làm việc' }]} />

      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col xs={24} lg={16}>
          <PageHeader
            title="Hồ sơ cá nhân & Lịch làm việc"
            description="Thông tin chuyên môn và lịch trực do quản trị viên phân bổ; bạn tự cập nhật thông tin liên lạc và phần giới thiệu."
          />
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small" styles={{ body: { padding: '10px 16px' } }}>
            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
              <div>
                <Typography.Text strong>BS. {profile.fullName}</Typography.Text>
                <div style={{ color: '#667085', fontSize: 13 }}>{profile.specialty}</div>
              </div>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                Bác sĩ
              </Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space size={8}>
            <IdcardOutlined style={{ color: '#1677ff' }} />
            <span>Thông tin do quản trị viên quản lý</span>
          </Space>
        }
        extra={
          <Tag icon={<LockOutlined />} style={{ marginInlineEnd: 0 }}>
            Chỉ đọc
          </Tag>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          message="Lưu ý"
          description="Chuyên khoa và số chứng chỉ hành nghề là thông tin hành nghề nên chỉ quản trị viên sửa được. Email là tài khoản đăng nhập và cũng không đổi tại đây. Cần thay đổi thì liên hệ quản trị viên."
        />

        <Card size="small" style={{ background: PANEL_BG }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <InfoField label="Email đăng nhập">{profile.email}</InfoField>
            </Col>
            <Col xs={24} md={8}>
              <InfoField label="Chuyên khoa công tác">{profile.specialty}</InfoField>
            </Col>
            <Col xs={24} md={8}>
              {/* Academic titles and the issuing authority are not stored anywhere. */}
              <InfoField label="Số chứng chỉ hành nghề">
                <Typography.Text style={{ color: '#1677ff' }}>
                  {profile.licenseNumber}
                </Typography.Text>
              </InfoField>
            </Col>
            <Col xs={24} md={8}>
              <InfoField label="Trạng thái tài khoản">
                <Tag
                  color={profile.status === 'ACTIVE' ? 'green' : 'red'}
                  style={{ marginInlineEnd: 0 }}
                >
                  {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </Tag>
              </InfoField>
            </Col>
            <Col xs={24} md={8}>
              <InfoField label="Ngày gia nhập hệ thống">{formatDate(profile.createdAt)}</InfoField>
            </Col>
            <Col xs={24} md={8}>
              <InfoField label="Mã bác sĩ">#{profile.doctorId}</InfoField>
            </Col>
          </Row>
        </Card>
      </Card>

      <Card
        title={
          <Space size={8}>
            <UserOutlined style={{ color: '#1677ff' }} />
            <span>Thông tin cá nhân & Giới thiệu chuyên môn</span>
          </Space>
        }
        extra={
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            Cập nhật gần nhất: {formatDateTime(profile.updatedAt)}
          </Typography.Text>
        }
      >
        <Form form={form} layout="vertical" onFinish={(values) => updateMutation.mutate(values)}>
          <Row gutter={20}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên bác sĩ"
                extra="Tên hiển thị trên lịch hẹn, bệnh án và đơn thuốc kê cho bệnh nhân."
                rules={[
                  { required: true, message: 'Vui lòng nhập họ tên.' },
                  { max: 150, message: 'Họ tên tối đa 150 ký tự.' },
                ]}
              >
                <Input maxLength={150} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại liên lạc"
                extra="Dùng để lễ tân liên hệ khi cần điều phối lịch khám."
                rules={[{ max: 30, message: 'Số điện thoại tối đa 30 ký tự.' }]}
              >
                <Input maxLength={30} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="bio"
            label="Giới thiệu chuyên môn & Kinh nghiệm lâm sàng"
            extra="Nội dung này hiển thị công khai cho bệnh nhân trên trang đặt lịch."
          >
            {/* No length limit server-side (the column is TEXT), so this counts without capping. */}
            <Input.TextArea rows={5} showCount />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={resetForm} disabled={updateMutation.isPending}>
              Khôi phục ban đầu
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updateMutation.isPending}
            >
              Lưu thay đổi
            </Button>
          </Space>
        </Form>
      </Card>

      <Card
        title={
          <Space size={8}>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span>Lịch làm việc hàng tuần</span>
          </Space>
        }
        extra={
          <Tag color={sessionCount > 0 ? 'blue' : 'default'} style={{ marginInlineEnd: 0 }}>
            {sessionCount} ca trong tuần
          </Tag>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ca làm việc do quản trị viên xếp"
          description="Bạn không tự đổi được lịch tại đây. Các ca khám 30 phút mà bệnh nhân đặt được sinh ra từ khung giờ này; ca đã có lịch hẹn thì không xóa được."
        />

        {schedulesQuery.isError ? (
          <Alert type="error" showIcon message={errorMessage(schedulesQuery.error)} />
        ) : sessionCount === 0 && !schedulesQuery.isFetching ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bạn chưa được xếp ca làm việc nào"
          />
        ) : (
          <Table<RosterRow>
            rowKey="key"
            size="middle"
            pagination={false}
            columns={rosterColumns}
            dataSource={roster}
            loading={schedulesQuery.isFetching}
          />
        )}
      </Card>
    </Space>
  );
}
