import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/auth';
import { AuthLayout } from '../layouts/AuthLayout';
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
    <AuthLayout>
      <Typography.Title level={2} style={{ marginBottom: 6, fontWeight: 700 }}>
        Tạo tài khoản
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 28 }}>
        Đăng ký để đặt lịch khám và theo dõi bệnh án
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
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu.' },
            { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự.' },
          ]}
        >
          <Input.Password
            size="large"
            variant="filled"
            prefix={<LockOutlined style={{ color: '#98a2b3' }} />}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }]}
        >
          <Input
            size="large"
            variant="filled"
            prefix={<UserOutlined style={{ color: '#98a2b3' }} />}
            placeholder="Nguyễn Văn A"
          />
        </Form.Item>

        <Form.Item name="phone" label="Số điện thoại">
          <Input
            size="large"
            variant="filled"
            prefix={<PhoneOutlined style={{ color: '#98a2b3' }} />}
            placeholder="09xxxxxxxx"
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker
                size="large"
                variant="filled"
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gender" label="Giới tính">
              <Select
                size="large"
                variant="filled"
                allowClear
                options={GENDER_OPTIONS}
                placeholder="Chọn"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Địa chỉ">
          <Input.TextArea variant="filled" rows={2} placeholder="Số nhà, đường, quận, tỉnh" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          style={{ height: 48, fontWeight: 600, marginTop: 4 }}
        >
          Đăng ký
        </Button>
      </Form>

      <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </Typography.Paragraph>
    </AuthLayout>
  );
}
