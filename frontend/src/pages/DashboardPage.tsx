import { Alert, Card, Descriptions, Space, Tag, Typography } from 'antd';

import { useAuth } from '../auth/useAuth';
import type { Role } from '../types/api';

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  PATIENT: 'Bệnh nhân',
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN: 'purple',
  DOCTOR: 'blue',
  RECEPTIONIST: 'orange',
  PATIENT: 'green',
};

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Phiên đăng nhập hiện tại">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="User ID">{user.userId}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={ROLE_COLOR[user.role]}>{ROLE_LABEL[user.role]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={user.status === 'ACTIVE' ? 'green' : 'red'}>{user.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Họ tên">
            {user.fullName ?? (
              <Typography.Text type="secondary">
                Không có — vai trò này chưa có bảng profile
              </Typography.Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Alert
        type="info"
        showIcon
        message="Các chức năng cho vai trò này đã sẵn sàng"
        description={
          user.role === 'PATIENT' ? (
            <>
              Vào <b>Tìm bác sĩ</b> để chọn bác sĩ và đặt lịch, sau đó theo dõi hoặc hủy lịch ở{' '}
              <b>Lịch hẹn của tôi</b>. Lịch mới đặt ở trạng thái <b>Chờ xác nhận</b> cho đến khi lễ
              tân xác nhận. Sau khi khám xong, kết quả nằm ở <b>Bệnh án</b> và <b>Đơn thuốc</b>.
            </>
          ) : user.role === 'RECEPTIONIST' ? (
            <>
              Vào <b>Quản lý lịch hẹn</b> để xác nhận hoặc hủy lịch của toàn phòng khám, và đặt lịch
              hộ bệnh nhân đã có tài khoản. Lễ tân được hủy kể cả sát giờ khám, khác với bệnh nhân
              bị giới hạn 2 tiếng.
            </>
          ) : user.role === 'DOCTOR' ? (
            <>
              Vào <b>Lịch khám của tôi</b> để xem lịch được phân. Nút <b>Khám</b> chỉ hiện với lịch
              đã được lễ tân xác nhận và đã tới giờ; bấm vào đó để ghi bệnh án rồi kê đơn thuốc. Ghi
              bệnh án đồng thời chuyển lịch sang <b>Đã khám</b> và không hoàn tác được. Ở{' '}
              <b>Hồ sơ của tôi</b> bạn xem được lịch làm việc hàng tuần và tự sửa họ tên, số điện
              thoại, phần giới thiệu.
            </>
          ) : (
            <>
              Vào <b>Quản lý nhân sự</b> để tạo tài khoản bác sĩ, lễ tân và khóa hoặc mở khóa tài
              khoản. Tài khoản bị khóa không đăng nhập được nhưng dữ liệu lịch sử vẫn giữ nguyên.
              Vào <b>Lịch làm việc</b> để thiết lập ca khám hàng tuần cho từng bác sĩ — các ca 30
              phút mà bệnh nhân đặt được sinh ra từ đó.
            </>
          )
        }
      />
    </Space>
  );
}
