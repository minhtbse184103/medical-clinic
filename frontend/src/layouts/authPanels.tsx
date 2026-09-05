import { CheckOutlined, FileTextOutlined, LockOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface AuthPanelFeature {
  badge: ReactNode;
  badgeBg: string;
  title: string;
  text: string;
}

export interface AuthPanelStat {
  value: string;
  unit?: string;
  label: string;
}

export interface AuthPanel {
  title: ReactNode;
  description: string;
  features: AuthPanelFeature[];
  stats: AuthPanelStat[];
}

const WHITE_BADGE = 'rgba(255,255,255,0.18)';
const GREEN_BADGE = 'rgba(82, 196, 26, 0.85)';

/*
 * Panel copy states what the system does. Claims from the supplied designs that it cannot
 * back — a 99.4% on-time rate, automatic reminders, lab results, "100% secure" — are
 * replaced with facts, because the interface should not promise features that do not exist.
 */

export const LOGIN_PANEL: AuthPanel = {
  title: (
    <>
      Chăm sóc chu đáo,
      <br />
      Đặt lịch chính xác.
    </>
  ),
  description:
    'Số hóa quy trình khám ngoại trú: đặt lịch theo ca 30 phút, xác nhận và theo dõi lịch hẹn, ghi bệnh án và kê đơn thuốc trên cùng một hệ thống.',
  features: [
    {
      badge: <span style={{ fontSize: 13, fontWeight: 700 }}>30′</span>,
      badgeBg: WHITE_BADGE,
      title: 'Khung giờ tiêu chuẩn',
      text: 'Ca khám 30 phút, đặt trước theo lịch bác sĩ',
    },
    {
      badge: <CheckOutlined style={{ fontSize: 15 }} />,
      badgeBg: GREEN_BADGE,
      title: 'Liên thông 4 vai trò',
      text: 'Bệnh nhân · Lễ tân · Bác sĩ · Quản trị',
    },
  ],
  stats: [
    { value: '30', unit: 'phút', label: 'MỖI CA KHÁM' },
    { value: '4', unit: 'vai trò', label: 'PHÂN QUYỀN' },
    { value: '24/7', label: 'BỆNH ÁN SỐ' },
  ],
};

export const REGISTER_PANEL: AuthPanel = {
  title: (
    <>
      Hồ sơ y tế số hóa,
      <br />
      Khám chữa bệnh an tâm.
    </>
  ),
  description:
    'Hệ thống lưu bệnh án và đơn thuốc theo từng lần khám, đặt lịch theo khung 30 phút tiêu chuẩn và cho phép bạn tra cứu lại bất cứ lúc nào.',
  features: [
    {
      badge: <CheckOutlined style={{ fontSize: 15 }} />,
      badgeBg: GREEN_BADGE,
      title: 'Đặt lịch nhanh',
      text: 'Chọn bác sĩ và giữ chỗ ca khám 30 phút',
    },
    {
      badge: <FileTextOutlined style={{ fontSize: 15 }} />,
      badgeBg: WHITE_BADGE,
      title: 'Bệnh án điện tử',
      text: 'Xem lại chẩn đoán và đơn thuốc mọi lúc',
    },
    {
      badge: <LockOutlined style={{ fontSize: 15 }} />,
      badgeBg: WHITE_BADGE,
      title: 'Bảo mật tài khoản',
      text: 'Mật khẩu mã hóa BCrypt, dữ liệu tách theo vai trò',
    },
  ],
  stats: [
    { value: '30', unit: 'phút', label: 'MỖI CA KHÁM' },
    { value: '4', unit: 'vai trò', label: 'PHÂN QUYỀN' },
    { value: '24/7', label: 'TRA CỨU HỒ SƠ' },
  ],
};
