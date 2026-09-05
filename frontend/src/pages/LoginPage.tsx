import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, App as AntdApp, Button, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../layouts/AuthLayout';
import { applyFieldErrors } from '../lib/formErrors';
import { errorMessage } from '../lib/apiError';
import type { LoginRequest } from '../types/api';

export function LoginPage() {
  const { user, initializing, login } = useAuth();
  const [form] = Form.useForm<LoginRequest>();
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntdApp.useApp();

  if (!initializing && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: LoginRequest) => {
    setSubmitting(true);
    setGeneralError(null);

    try {
      const currentUser = await login(values);
      message.success(`Xin chào ${currentUser.fullName ?? currentUser.email}`);

      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      // Field-level messages land under the inputs; anything else becomes a banner.
      if (!applyFieldErrors(form, error)) {
        setGeneralError(errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Typography.Title level={2} style={{ marginBottom: 6, fontWeight: 700 }}>
        Chào mừng trở lại
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 28 }}>
        Đăng nhập để tiếp tục vào Medical Clinic
      </Typography.Paragraph>

      {generalError && (
        <Alert type="error" message={generalError} showIcon style={{ marginBottom: 20 }} />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={submitting}>
        <Form.Item
          name="email"
          label="Địa chỉ email"
          rules={[
            { required: true, message: 'Vui lòng nhập email.' },
            { type: 'email', message: 'Email không hợp lệ.' },
          ]}
        >
          <Input
            size="large"
            variant="filled"
            prefix={<MailOutlined style={{ color: '#98a2b3' }} />}
            placeholder="Nhập email của bạn"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
        >
          <Input.Password
            size="large"
            variant="filled"
            prefix={<LockOutlined style={{ color: '#98a2b3' }} />}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          style={{ height: 48, fontWeight: 600, marginTop: 4 }}
        >
          Đăng nhập
        </Button>
      </Form>

      <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </Typography.Paragraph>

      <Alert
        type="info"
        style={{ marginTop: 24 }}
        message="Tài khoản demo"
        description={
          <Typography.Text style={{ fontSize: 13 }}>
            <code>admin@clinic.local</code> · <code>doctor1@clinic.local</code> ·{' '}
            <code>receptionist@clinic.local</code> · <code>patient@clinic.local</code>
            <br />
            Mật khẩu chung: <code>Demo@12345</code>
          </Typography.Text>
        }
      />
    </AuthLayout>
  );
}
