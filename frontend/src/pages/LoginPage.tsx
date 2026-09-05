import { ArrowRightOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
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
      <Typography.Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>
        Chào mừng quay trở lại
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 28 }}>
        Đăng nhập vào tài khoản để quản lý lịch khám và dữ liệu bệnh án.
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
            prefix={<MailOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
            placeholder="ten@clinic.local"
            autoComplete="email"
            style={{ height: 48 }}
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
            prefix={<LockOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            style={{ height: 48 }}
          />
        </Form.Item>

        {/* True of the system: one sign-in serves all four roles, routed by the JWT role. */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 8,
            background: '#eff6ff',
            color: '#1d4ed8',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d4ed8' }} />
          Hỗ trợ: Bệnh nhân, Bác sĩ, Lễ tân, Quản trị
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          style={{ height: 52, fontWeight: 600, borderRadius: 10 }}
        >
          Đăng nhập
        </Button>
      </Form>

      <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </Typography.Paragraph>

      <div
        style={{
          marginTop: 20,
          padding: 14,
          borderRadius: 10,
          border: '1px dashed #d0d5dd',
          fontSize: 12.5,
          color: '#667085',
          lineHeight: 1.7,
        }}
      >
        <b style={{ color: '#344054' }}>Tài khoản demo</b> — mật khẩu chung{' '}
        <code>Demo@12345</code>
        <br />
        <code>patient@clinic.local</code> · <code>doctor1@clinic.local</code> ·{' '}
        <code>receptionist@clinic.local</code> · <code>admin@clinic.local</code>
      </div>
    </AuthLayout>
  );
}
