import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Segmented,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/auth';
import { AuthLayout } from '../layouts/AuthLayout';
import { REGISTER_PANEL } from '../layouts/authPanels';
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
    <AuthLayout panel={REGISTER_PANEL}>
      <Typography.Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>
        Đăng ký tài khoản
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 24 }}>
        Điền thông tin cá nhân để đặt lịch khám và tra cứu hồ sơ bệnh án trực tuyến.
      </Typography.Paragraph>

      {generalError && (
        <Alert type="error" message={generalError} showIcon style={{ marginBottom: 20 }} />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={submitting}
        requiredMark
      >
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }]}
        >
          <Input
            size="large"
            variant="filled"
            prefix={<UserOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
            placeholder="Nguyễn Văn A"
            style={{ height: 48 }}
          />
        </Form.Item>

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
            placeholder="benhnhan@gmail.com"
            autoComplete="email"
            style={{ height: 48 }}
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
            prefix={<LockOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            style={{ height: 48 }}
          />
        </Form.Item>

        {/* Required here but optional in the API: a clinic needs a way to reach the patient. */}
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại.' },
            { max: 30, message: 'Số điện thoại tối đa 30 ký tự.' },
          ]}
        >
          <Input
            size="large"
            variant="filled"
            prefix={<PhoneOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
            placeholder="0912 345 678"
            style={{ height: 48 }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={11}>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker
                size="large"
                variant="filled"
                style={{ width: '100%', height: 48 }}
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
                disabledDate={(value) => value.isAfter(dayjs(), 'day')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={13}>
            <Form.Item name="gender" label="Giới tính">
              <Segmented block size="large" options={GENDER_OPTIONS} style={{ height: 48 }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Địa chỉ cư trú"
          rules={[{ max: 500, message: 'Địa chỉ tối đa 500 ký tự.' }]}
        >
          <Input
            size="large"
            variant="filled"
            prefix={<EnvironmentOutlined style={{ color: '#98a2b3', marginRight: 6 }} />}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
            style={{ height: 48 }}
          />
        </Form.Item>

        {/*
          The design placed terms-of-service and privacy-policy links here. Neither document
          exists, so this states what is actually true of the data instead.
        */}
        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}
        >
          Thông tin bạn nhập được dùng để xác định đúng người bệnh khi khám và chỉ hiển thị cho
          bác sĩ đã khám cho bạn.
        </Typography.Paragraph>

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
          Đăng ký tài khoản
        </Button>
      </Form>

      <Typography.Paragraph style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
      </Typography.Paragraph>
    </AuthLayout>
  );
}
