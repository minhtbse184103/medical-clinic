import { CalendarOutlined, FileTextOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { Col, Row, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

const HIGHLIGHTS = [
  {
    icon: <CalendarOutlined />,
    title: 'Đặt lịch trực tuyến',
    text: 'Chọn bác sĩ theo chuyên khoa và giữ chỗ ca khám 30 phút.',
  },
  {
    icon: <FileTextOutlined />,
    title: 'Bệnh án của bạn',
    text: 'Xem lại chẩn đoán và hướng điều trị sau mỗi lần khám.',
  },
  {
    icon: <MedicineBoxOutlined />,
    title: 'Đơn thuốc rõ ràng',
    text: 'Liều dùng, tần suất và thời gian uống đầy đủ.',
  },
];

/**
 * Two-column shell for the signed-out screens. The left panel is hidden below the lg
 * breakpoint, so on a phone the form gets the whole width.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Row style={{ minHeight: '100vh' }}>
      <Col
        xs={0}
        lg={10}
        style={{
          background: 'linear-gradient(160deg, #1677ff 0%, #0958d9 60%, #003eb3 100%)',
          color: '#fff',
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Space direction="vertical" size="large">
          <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
            Medical Clinic
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: 0 }}>
            Hệ thống quản lý phòng khám: đặt lịch, khám bệnh, kê đơn và tra cứu bệnh án trên cùng
            một nơi.
          </Typography.Paragraph>

          <Space direction="vertical" size="middle" style={{ marginTop: 16 }}>
            {HIGHLIGHTS.map((item) => (
              <Space key={item.title} align="start" size="middle">
                <span style={{ fontSize: 20, color: '#fff' }}>{item.icon}</span>
                <Space direction="vertical" size={0}>
                  <Typography.Text strong style={{ color: '#fff' }}>
                    {item.title}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {item.text}
                  </Typography.Text>
                </Space>
              </Space>
            ))}
          </Space>
        </Space>
      </Col>

      <Col
        xs={24}
        lg={14}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f4f6f9',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>{children}</div>
      </Col>
    </Row>
  );
}
