import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';

import { patientApi } from '../api/patient';
import { useAuth } from '../auth/useAuth';
import { PageHeader } from '../components/PageHeader';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { toApiDate } from '../lib/datetime';
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

export function PatientProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { message } = AntdApp.useApp();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => patientApi.profile(),
  });

  // The form is filled once the profile arrives, and again whenever the server returns
  // an updated version, so what is on screen always matches what was saved.
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        fullName: data.fullName,
        phone: data.phone ?? undefined,
        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
        gender: data.gender ?? undefined,
        address: data.address ?? undefined,
      });
    }
  }, [data, form]);

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

  if (isPending) {
    return <Skeleton active />;
  }

  if (isError) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Hồ sơ của tôi"
        description="Thông tin này hiển thị cho bác sĩ khi bạn đến khám."
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <Typography.Text type="secondary">Email:</Typography.Text>
            <Typography.Text strong>{data.email}</Typography.Text>
            <Tag color={data.status === 'ACTIVE' ? 'green' : 'red'}>{data.status}</Tag>
          </Space>
          <Typography.Text type="secondary">
            Email và mật khẩu không sửa được ở màn hình này.
          </Typography.Text>

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

            <Form.Item name="dateOfBirth" label="Ngày sinh">
              {/* The backend rejects a future date of birth with @PastOrPresent. */}
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(value) => value.isAfter(dayjs(), 'day')}
              />
            </Form.Item>

            <Form.Item name="gender" label="Giới tính">
              <Select allowClear options={GENDER_OPTIONS} placeholder="Chọn giới tính" />
            </Form.Item>

            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[{ max: 500, message: 'Địa chỉ tối đa 500 ký tự.' }]}
            >
              <Input.TextArea rows={2} maxLength={500} showCount />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Lưu thay đổi
            </Button>
          </Form>
        </Space>
      </Card>
    </Space>
  );
}
