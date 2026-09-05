import { Col, Row } from 'antd';
import type { ReactNode } from 'react';

import { BrandMark, PulseIcon } from '../components/BrandMark';

/** Honest capability claims. The mock's "500+ Hospitals" would be a fabricated statistic. */
const HIGHLIGHTS = [
  { value: '4', label: 'Vai trò' },
  { value: '30′', label: 'Mỗi ca khám' },
  { value: '24/7', label: 'Đặt lịch online' },
];

/**
 * Two-column shell for the signed-out screens: the form on the left, a blue panel on the
 * right introducing the product. The panel is hidden below the lg breakpoint so a phone
 * gives the form the whole width.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#e8f1fb', padding: 24 }}>
      <Row
        style={{
          minHeight: 'calc(100vh - 48px)',
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(16, 24, 40, 0.08)',
          overflow: 'hidden',
        }}
      >
        <Col xs={24} lg={12} style={{ padding: 40, display: 'flex', flexDirection: 'column' }}>
          <BrandMark />

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBlock: 32,
            }}
          >
            <div style={{ width: '100%', maxWidth: 420 }}>{children}</div>
          </div>
        </Col>

        <Col xs={0} lg={12} style={{ padding: 12 }}>
          <div
            style={{
              height: '100%',
              borderRadius: 20,
              padding: 56,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              /* Layered gradients stand in for the photograph in the mock; see the README. */
              background:
                'radial-gradient(120% 90% at 50% 0%, #4096ff 0%, rgba(64,150,255,0) 60%),' +
                'linear-gradient(160deg, #1677ff 0%, #0958d9 55%, #002c8c 100%)',
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              <PulseIcon size={38} />
            </div>

            <h2 style={{ fontSize: 38, lineHeight: 1.2, fontWeight: 700, margin: 0 }}>
              Quản lý phòng khám
              <br />
              trên một hệ thống
            </h2>

            <p
              style={{
                marginTop: 20,
                marginBottom: 0,
                fontSize: 16,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.82)',
                maxWidth: 440,
              }}
            >
              Đặt lịch khám, xác nhận lịch hẹn, ghi bệnh án và kê đơn thuốc — bệnh nhân, lễ tân,
              bác sĩ và quản trị viên dùng chung một nơi.
            </p>

            <div style={{ display: 'flex', gap: 48, marginTop: 48 }}>
              {HIGHLIGHTS.map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{item.value}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                    {item.label}
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
