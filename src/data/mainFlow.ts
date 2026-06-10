export interface LegacyModule {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  available: boolean;
}

export const mainFlowModules: LegacyModule[] = [
  {
    id: 'auth',
    title: 'Đăng nhập / Đăng ký',
    description: 'Vào hệ thống bằng tài khoản cá nhân hoặc tạo tài khoản mới.',
    actionLabel: 'Mở form',
    available: true,
  },
  {
    id: 'profile',
    title: 'Hồ sơ cá nhân',
    description: 'Xem thông tin tài khoản và trạng thái đăng nhập.',
    actionLabel: 'Xem ngay',
    available: true,
  },
  {
    id: 'wallet',
    title: 'Ví tiền',
    description: 'Xem số dư và lịch sử giao dịch.',
    actionLabel: 'Mở ví',
    available: true,
  },
  {
    id: 'buildings',
    title: 'Bãi đỗ / Tòa nhà',
    description: 'Danh sách bãi đang hoạt động, tầng và chỗ đỗ xe.',
    actionLabel: 'Xem tòa nhà',
    available: true,
  },
  {
    id: 'packages',
    title: 'Gói dịch vụ',
    description: 'Đăng ký các gói gửi xe dài hạn của cư dân theo tuần, tháng, năm với mức giá ưu đãi cực hấp dẫn.',
    actionLabel: 'Xem gói ngay',
    available: true,
  },
  {
    id: 'reservations',
    title: 'Đặt chỗ trước',
    description: 'Đặt trước chỗ đỗ theo nhu cầu của khách hàng.',
    actionLabel: 'Đặt chỗ ngay',
    available: true,
  },
  {
    id: 'sessions',
    title: 'Phiên gửi xe',
    description: 'Theo dõi xe vào, xe ra và lịch sử gửi xe.',
    actionLabel: 'Sắp ra mắt',
    available: false,
  },

  {
    id: 'notifications',
    title: 'Thông báo',
    description: 'Nhận thông báo và nhắc việc từ hệ thống.',
    actionLabel: 'Sắp ra mắt',
    available: false,
  },
];

