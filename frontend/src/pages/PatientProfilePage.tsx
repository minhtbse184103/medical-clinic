import {
  CalendarOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  HomeOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { appointmentsApi } from '../api/appointments';
import { patientApi } from '../api/patient';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { formatDate, formatDateTime, formatTime, toApiDate } from '../lib/datetime';
import { initials } from '../lib/user';
import type { Gender, UpdatePatientProfileRequest } from '../types/api';

/** The picker works with Dayjs; the API takes a yyyy-MM-dd string. */
interface ProfileFormValues extends Omit<UpdatePatientProfileRequest, 'dateOfBirth'> {
  dateOfBirth?: Dayjs;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

/** Read-only row in the account identity card. */
function IdentityRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
        {label}
      </Typography.Text>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}

export function PatientProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => patientApi.profile(),
  });

  const lastVisit = useQuery({
    queryKey: ['my-appointments-last-visit'],
    queryFn: () =>
      appointmentsApi.mine({ page: 0, size: 1, status: 'COMPLETED', sort: 'appointmentDate,desc' }),
    select: (page) => page.content[0],
  });

  const nextVisit = useQuery({
    queryKey: ['my-appointments-upcoming'],
    queryFn: () =>
      appointmentsApi.mine({
        page: 0,
        size: 20,
        fromDate: toApiDate(dayjs()),
        sort: 'appointmentDate,asc',
      }),
    select: (page) =>
      page.content.find((row) => row.status === 'PENDING' || row.status === 'CONFIRMED'),
  });

  // Filled once the profile arrives, and again whenever the server returns an updated
  // version, so what is on screen always matches what was saved.
  useEffect(() => {
    if (profile.data) {
      form.setFieldsValue({
        fullName: profile.data.fullName,
        phone: profile.data.phone ?? undefined,
        dateOfBirth: profile.data.dateOfBirth ? dayjs(profile.data.dateOfBirth) : undefined,
        gender: profile.data.gender ?? undefined,
        address: profile.data.address ?? undefined,
      });
    }
  }, [profile.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      patientApi.updateProfile({
        ...values,
        dateOfBirth: values.dateOfBirth ? toApiDate(values.dateOfBirth) : undefined,
      }),
    onSuccess: async (updated) => {
      message.success('Đã cập nhật hồ sơ.');
      queryClient.setQueryData(['my-profile'], updated);
      // The header shows the name from /auth/me, so the identity is re-read after a rename.
      await refreshUser();
    },
    onError: (updateError) => {
      if (!applyFieldErrors(form, updateError)) {
        message.error(errorMessage(updateError));
      }
    },
  });

  const copyPatientId = async () => {
    if (!profile.data) return;
    try {
      await navigator.clipboard.writeText(String(profile.data.patientId));
      message.success('Đã sao chép mã hồ sơ.');
    } catch {
      message.error('Trình duyệt không cho phép sao chép.');
    }
  };

  if (profile.isPending) {
    return <Skeleton active />;
  }

  if (profile.isError || !profile.data) {
    return <Alert type="error" showIcon message={errorMessage(profile.error)} />;
  }

  const data = profile.data;
  const age = data.dateOfBirth ? dayjs().diff(dayjs(data.dateOfBirth), 'year') : null;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/', title: <HomeOutlined />, onClick: () => navigate('/') },
          { title: 'Hồ sơ cá nhân' },
        ]}
      />

      <Card>
        <Space
          align="center"
          size={16}
          wrap
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Space align="center" size={16}>
            <Avatar size={56} style={{ background: '#1677ff', fontWeight: 700, fontSize: 20 }}>
              {initials(data.fullName)}
            </Avatar>
            <div>
              <Space size={10} wrap>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Hồ sơ cá nhân
                </Typography.Title>
                <Tag color={data.status === 'ACTIVE' ? 'green' : 'red'} style={{ marginInlineEnd: 0 }}>
                  {data.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                </Tag>
              </Space>
              <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                Cập nhật thông tin liên lạc để bác sĩ và lễ tân xác định đúng người bệnh.
              </Typography.Paragraph>
            </div>
          </Space>

          {lastVisit.data && (
            <Card size="small" styles={{ body: { padding: '10px 16px' } }}>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                Lượt khám gần nhất
              </Typography.Text>
              <div style={{ fontWeight: 600 }}>
                {formatDate(lastVisit.data.appointmentDate)}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                {lastVisit.data.doctorSpecialty}
              </Typography.Text>
            </Card>
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card
            title={
              <Space size={10}>
                <IdcardOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Thông tin tài khoản</span>
              </Space>
            }
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* The real record id, not an invented health-identifier format. */}
              <IdentityRow label="MÃ HỒ SƠ BỆNH NHÂN">
                <Space>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    #{data.patientId}
                  </Typography.Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={copyPatientId} />
                </Space>
              </IdentityRow>

              <IdentityRow label="EMAIL ĐĂNG NHẬP">
                <Space size={8}>
                  <MailOutlined style={{ color: '#98a2b3' }} />
                  <Typography.Text>{data.email}</Typography.Text>
                </Space>
              </IdentityRow>

              <IdentityRow label="NGÀY TẠO HỒ SƠ">
                <Typography.Text>{formatDateTime(data.createdAt)}</Typography.Text>
              </IdentityRow>

              <IdentityRow label="CẬP NHẬT GẦN NHẤT">
                <Typography.Text>{formatDateTime(data.updatedAt)}</Typography.Text>
              </IdentityRow>

              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="Email và mật khẩu không đổi được ở đây"
                description="Email là định danh đăng nhập của tài khoản. Cần thay đổi, vui lòng liên hệ quầy lễ tân."
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={15}>
          <Card
            title={
              <Space size={10}>
                <UserOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Thông tin cá nhân &amp; Liên lạc</span>
              </Space>
            }
            extra={
              <Typography.Text type="danger" style={{ fontSize: 13 }}>
                * Trường bắt buộc
              </Typography.Text>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => updateMutation.mutate(values)}
              requiredMark
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên bệnh nhân"
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ tên.' },
                      { max: 150, message: 'Họ tên tối đa 150 ký tự.' },
                    ]}
                    extra="Tên này hiển thị cho bác sĩ và lễ tân khi bạn đến khám."
                  >
                    <Input
                      size="large"
                      variant="filled"
                      prefix={<UserOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  {/* Required here but optional in the API: a clinic needs a way to reach the patient. */}
                  <Form.Item
                    name="phone"
                    label="Số điện thoại liên hệ"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại.' },
                      { max: 30, message: 'Số điện thoại tối đa 30 ký tự.' },
                    ]}
                    extra="Lễ tân dùng số này để liên hệ khi cần đổi lịch."
                  >
                    <Input
                      size="large"
                      variant="filled"
                      prefix={<PhoneOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Ngày sinh"
                    extra={
                      age === null
                        ? 'Không chọn được ngày trong tương lai.'
                        : `Không chọn được ngày trong tương lai. Tuổi hiện tại: ${age}.`
                    }
                  >
                    <DatePicker
                      size="large"
                      variant="filled"
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="DD/MM/YYYY"
                      disabledDate={(value) => value.isAfter(dayjs(), 'day')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="gender" label="Giới tính">
                    <Radio.Group size="large" optionType="button" buttonStyle="solid">
                      {GENDER_OPTIONS.map((option) => (
                        <Radio.Button key={option.value} value={option.value}>
                          {option.label}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="Địa chỉ liên hệ"
                rules={[{ max: 500, message: 'Địa chỉ tối đa 500 ký tự.' }]}
              >
                <Input.TextArea
                  variant="filled"
                  rows={3}
                  maxLength={500}
                  showCount
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                />
              </Form.Item>

              <Divider />

              <Space
                align="center"
                style={{ width: '100%', justifyContent: 'space-between' }}
                wrap
              >
                <Space size={8} style={{ color: '#667085' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Lần sửa đổi gần nhất: {formatDateTime(data.updatedAt)}</span>
                </Space>
                <Space>
                  <Button
                    size="large"
                    onClick={() =>
                      form.setFieldsValue({
                        fullName: data.fullName,
                        phone: data.phone ?? undefined,
                        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
                        gender: data.gender ?? undefined,
                        address: data.address ?? undefined,
                      })
                    }
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={updateMutation.isPending}
                  >
                    Lưu thay đổi
                  </Button>
                </Space>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>

      {nextVisit.data && (
        <Card>
          <Space
            align="center"
            size={16}
            wrap
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Space align="start" size={12}>
              <Avatar style={{ background: '#eff6ff', color: '#1677ff' }} icon={<CalendarOutlined />} />
              <div>
                <Typography.Text strong>Bạn có lịch hẹn sắp tới</Typography.Text>
                <div style={{ color: '#667085' }}>
                  {formatTime(nextVisit.data.startTime)} – {formatTime(nextVisit.data.endTime)},{' '}
                  {dayjs(nextVisit.data.appointmentDate).format('dddd, DD/MM/YYYY')} với BS.{' '}
                  {nextVisit.data.doctorFullName}
                </div>
              </div>
            </Space>
            <Button onClick={() => navigate('/appointments')}>Xem chi tiết lịch hẹn</Button>
          </Space>
        </Card>
      )}
    </Space>
  );
}
