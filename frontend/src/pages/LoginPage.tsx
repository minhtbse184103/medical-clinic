import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, App as AntdApp, Button, Card, Form, Input, Typography } from 'antd';
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
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Đăng nhập
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Nhập email và mật khẩu để vào hệ thống.
        </Typography.Paragraph>

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
            <Input prefix={<MailOutlined />} placeholder="admin@clinic.local" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng nhập
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </Typography.Paragraph>

        <Alert
          type="info"
          style={{ marginTop: 16 }}
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
      </Card>
    </AuthLayout>
  );
}
