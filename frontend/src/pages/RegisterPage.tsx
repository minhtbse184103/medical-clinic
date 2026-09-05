import { Alert, App as AntdApp, Button, Card, DatePicker, Flex, Form, Input, Select, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/auth';
import { errorMessage } from '../lib/apiError';
import { applyFieldErrors } from '../lib/formErrors';
import { toApiDate } from '../lib/datetime';
import type { Gender, RegisterPatientRequest } from '../types/api';

/** Form shape: the picker works with Dayjs, the API wants a yyyy-MM-dd string. */
interface RegisterFormValues extends Omit<RegisterPatientRequest, 'dateOfBirth'> {
  dateOfBirth?: Dayjs;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export function RegisterPage() {
  const [form] = Form.useForm<RegisterFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const handleSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true);
    setGeneralError(null);

    try {
      await authApi.register({
        ...values,
        dateOfBirth: values.dateOfBirth ? toApiDate(values.dateOfBirth) : undefined,
      });

      message.success('Đăng ký thành công. Mời bạn đăng nhập.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (!applyFieldErrors(form, error)) {
        setGeneralError(errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#f0f2f5', padding: 24 }}>
      <Card style={{ width: 480 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Đăng ký bệnh nhân
        </Typography.Title>

        {generalError && (
          <Alert type="error" message={generalError} showIcon style={{ marginBottom: 16 }} />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={submitting}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email.' },
              { type: 'email', message: 'Email không hợp lệ.' },
            ]}
          >
            <Input autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu.' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự.' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Ngày sinh">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select allowClear options={GENDER_OPTIONS} placeholder="Chọn giới tính" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng ký
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography.Paragraph>
      </Card>
    </Flex>
  );
}
