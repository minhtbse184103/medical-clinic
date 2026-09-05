import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { doctorApi } from '../api/doctor';
import { doctorsApi } from '../api/doctors';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { DAY_OF_WEEK_LABEL } from '../lib/appointmentStatus';
import { formatTime } from '../lib/datetime';
import type { DayOfWeek, DoctorSchedule, UpdateDoctorProfileRequest } from '../types/api';

const scheduleColumns: ColumnsType<DoctorSchedule> = [
  {
    title: 'Thứ',
    dataIndex: 'dayOfWeek',
    key: 'dayOfWeek',
    render: (day: DayOfWeek) => DAY_OF_WEEK_LABEL[day],
  },
  {
    title: 'Giờ làm việc',
    key: 'time',
    render: (_, schedule) => `${formatTime(schedule.startTime)} – ${formatTime(schedule.endTime)}`,
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

  useEffect(() => {
    if (profileQuery.data) {
      form.setFieldsValue({
        fullName: profileQuery.data.fullName,
        phone: profileQuery.data.phone ?? undefined,
        bio: profileQuery.data.bio ?? undefined,
      });
    }
  }, [profileQuery.data, form]);

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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Hồ sơ của tôi
      </Typography.Title>

      <Card title="Thông tin do quản trị viên quản lý">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
          <Descriptions.Item label="Chuyên khoa">{profile.specialty}</Descriptions.Item>
          <Descriptions.Item label="Số giấy phép">{profile.licenseNumber}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={profile.status === 'ACTIVE' ? 'green' : 'red'}>{profile.status}</Tag>
          </Descriptions.Item>
        </Descriptions>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          Chuyên khoa và số giấy phép là thông tin chứng chỉ hành nghề nên chỉ quản trị viên đổi
          được. Cần thay đổi thì liên hệ quản trị viên.
        </Typography.Paragraph>
      </Card>

      <Card title="Thông tin tôi tự cập nhật">
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 480 }}
          onFinish={(values) => updateMutation.mutate(values)}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên.' },
              { max: 150, message: 'Họ tên tối đa 150 ký tự.' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ max: 30, message: 'Số điện thoại tối đa 30 ký tự.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="bio" label="Giới thiệu" extra="Nội dung này hiển thị cho bệnh nhân.">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
            Lưu thay đổi
          </Button>
        </Form>
      </Card>

      <Card title="Lịch làm việc hàng tuần">
        {schedulesQuery.isError ? (
          <Alert type="error" showIcon message={errorMessage(schedulesQuery.error)} />
        ) : schedulesQuery.data && schedulesQuery.data.length === 0 ? (
          <Empty description="Bạn chưa được xếp ca làm việc nào" />
        ) : (
          <Table<DoctorSchedule>
            rowKey="scheduleId"
            size="small"
            pagination={false}
            columns={scheduleColumns}
            dataSource={schedulesQuery.data}
            loading={schedulesQuery.isFetching}
          />
        )}
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          Ca làm việc do quản trị viên xếp. Các ca khám 30 phút mà bệnh nhân đặt được sinh ra từ
          lịch này.
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
