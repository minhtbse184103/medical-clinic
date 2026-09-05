import { CheckOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';

import { BrandMark } from '../components/BrandMark';

interface Feature {
  badge: ReactNode;
  badgeBg: string;
  title: string;
  text: string;
}

const FEATURES: Feature[] = [
  {
    badge: <span style={{ fontSize: 13, fontWeight: 700 }}>30′</span>,
    badgeBg: 'rgba(255,255,255,0.18)',
    title: 'Khung giờ tiêu chuẩn',
    text: 'Ca khám 30 phút, đặt trước theo lịch bác sĩ',
  },
  {
    badge: <CheckOutlined style={{ fontSize: 15 }} />,
    badgeBg: 'rgba(82, 196, 26, 0.85)',
    title: 'Liên thông 4 vai trò',
    text: 'Bệnh nhân · Lễ tân · Bác sĩ · Quản trị',
  },
];

/**
 * Facts about the system, not marketing figures. The mock carried a 99.4% on-time rate;
 * nothing in this system measures punctuality, so it would have been invented.
 */
const STATS = [
  { value: '30', unit: 'phút', label: 'MỖI CA KHÁM' },
  { value: '4', unit: 'vai trò', label: 'PHÂN QUYỀN' },
  { value: '24/7', unit: '', label: 'BỆNH ÁN SỐ' },
];

/**
 * Shell for the signed-out screens: one rounded white container holding the form on the
 * left and an inset blue panel on the right. The panel is hidden below 992px so a phone
 * gives the form the whole width.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f2f4f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Row
        style={{
          width: '100%',
          maxWidth: 1240,
          background: '#fff',
          borderRadius: 28,
          boxShadow: '0 18px 60px rgba(16, 24, 40, 0.10)',
        }}
      >
        <Col
          xs={24}
          lg={12}
          style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 32 }}
        >
          <BrandMark subtitle="Hệ thống quản trị phòng khám" />

          <div style={{ flex: 1 }}>{children}</div>

          <div style={{ borderTop: '1px solid #eaecf0', paddingTop: 20, fontSize: 13 }}>
            <span style={{ color: '#98a2b3' }}>
              © {dayjs().year()} Medical Clinic System
            </span>
          </div>
        </Col>

        <Col xs={0} lg={12} style={{ padding: 24 }}>
          <div
            style={{
              height: '100%',
              borderRadius: 24,
              padding: 48,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: 'linear-gradient(150deg, #2b7fff 0%, #1668dc 55%, #0a4fbd 100%)',
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 36,
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 28 }} />
            </div>

            <h2 style={{ fontSize: 36, lineHeight: 1.25, fontWeight: 700, margin: 0 }}>
              Chăm sóc chu đáo,
              <br />
              Đặt lịch chính xác.
            </h2>

            <p
              style={{
                marginTop: 20,
                marginBottom: 36,
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              Số hóa quy trình khám ngoại trú: đặt lịch theo ca 30 phút, xác nhận và theo dõi lịch
              hẹn, ghi bệnh án và kê đơn thuốc trên cùng một hệ thống.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 14,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.10)',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: feature.badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {feature.badge}
                  </div>
                  <div style={{ lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 600 }}>{feature.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>
                      {feature.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 40,
                marginTop: 36,
                paddingTop: 28,
                borderTop: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                        {stat.unit}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 0.6,
                      color: 'rgba(255,255,255,0.68)',
                      marginTop: 6,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
