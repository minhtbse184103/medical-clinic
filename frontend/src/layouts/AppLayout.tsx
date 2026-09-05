import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App as AntdApp, Avatar, Button, Layout, Menu, Space, Tag, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';


import { useAuth } from '../auth/useAuth';
import { PulseIcon } from '../components/BrandMark';
import { PageLoading } from '../components/SuspendedPage';
import { initials, ROLE_COLOR, ROLE_LABEL } from '../lib/user';
import type { Role } from '../types/api';

/** Names the area of the system the signed-in role is working in. */
const PORTAL_LABEL: Record<Role, string> = {
  PATIENT: 'Cổng thông tin bệnh nhân ngoại trú',
  DOCTOR: 'Khu vực khám chữa bệnh',
  RECEPTIONIST: 'Quầy tiếp nhận bệnh nhân',
  ADMIN: 'Khu vực quản trị hệ thống',
};

const { Header, Sider, Content } = Layout;

/**
 * Navigation per role. Only routes that actually exist are listed, so no menu entry
 * can lead to a 404; later phases add their own entries alongside their screens.
 */
const MENU_BY_ROLE: Record<Role, MenuProps['items']> = {
  PATIENT: [
    { key: '/', icon: <HomeOutlined />, label: 'Trang chủ' },
    { key: '/doctors', icon: <CalendarOutlined />, label: 'Đặt lịch khám' },
    { key: '/appointments', icon: <ClockCircleOutlined />, label: 'Lịch hẹn của tôi' },
    { key: '/medical-records', icon: <FileTextOutlined />, label: 'Bệnh án điện tử' },
    { key: '/prescriptions', icon: <MedicineBoxOutlined />, label: 'Đơn thuốc' },
    { key: '/profile', icon: <IdcardOutlined />, label: 'Cài đặt tài khoản' },
  ],
  DOCTOR: [
    { key: '/', icon: <UserOutlined />, label: 'Tổng quan' },
    { key: '/doctor/appointments', icon: <CalendarOutlined />, label: 'Lịch khám của tôi' },
    { key: '/doctor/profile', icon: <IdcardOutlined />, label: 'Hồ sơ của tôi' },
    { key: '/doctors', icon: <MedicineBoxOutlined />, label: 'Danh sách bác sĩ' },
  ],
  RECEPTIONIST: [
    { key: '/', icon: <UserOutlined />, label: 'Tổng quan' },
    {
      key: '/receptionist/appointments',
      icon: <CalendarOutlined />,
      label: 'Quản lý lịch hẹn',
    },
    { key: '/doctors', icon: <MedicineBoxOutlined />, label: 'Danh sách bác sĩ' },
  ],
  ADMIN: [
    { key: '/', icon: <UserOutlined />, label: 'Tổng quan' },
    { key: '/admin/staff', icon: <TeamOutlined />, label: 'Quản lý nhân sự' },
    { key: '/admin/schedules', icon: <CalendarOutlined />, label: 'Lịch làm việc' },
    { key: '/doctors', icon: <MedicineBoxOutlined />, label: 'Danh sách bác sĩ' },
  ],
};

/** Keeps "Tìm bác sĩ" highlighted while on a doctor detail page such as /doctors/3. */
function selectedMenuKey(items: MenuProps['items'], pathname: string): string {
  const keys = (items ?? [])
    .map((item) => String(item?.key ?? ''))
    .filter((key) => key !== '/' && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length);

  return keys[0] ?? pathname;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntdApp.useApp();

  if (!user) {
    return null;
  }

  // ADMIN and RECEPTIONIST have no profile table, so fullName is null for them.
  const displayName = user.fullName ?? user.email;

  const handleLogout = async () => {
    await logout();
    message.success('Đã đăng xuất.');
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        {/* Same mark as the sign-in screen, so the product reads the same on both sides. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PulseIcon size={20} />
          </div>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Medical Clinic</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey(MENU_BY_ROLE[user.role], location.pathname)]}
          items={MENU_BY_ROLE[user.role]}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingInline: 24,
            borderBottom: '1px solid #eaecf0',
          }}
        >
          <Space size={8} style={{ color: '#475467' }}>
            <CheckCircleOutlined style={{ color: '#0d9488' }} />
            <span>{PORTAL_LABEL[user.role]}</span>
          </Space>

          <Space size={16} align="center">
            <Space size={10} align="center">
              <Avatar size={38} style={{ background: '#0d9488', fontWeight: 600 }}>
                {initials(displayName)}
              </Avatar>
              <span style={{ lineHeight: 1.35 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{displayName}</span>
                  <Tag color={ROLE_COLOR[user.role]} style={{ marginInlineEnd: 0 }}>
                    {ROLE_LABEL[user.role]}
                  </Tag>
                </div>
              </span>
            </Space>

            <Tooltip title="Đăng xuất">
              <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} />
            </Tooltip>
          </Space>
        </Header>

        <Content style={{ margin: 24 }}>
          {/* Pages are lazily loaded, so the layout stays on screen while a chunk arrives. */}
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
