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
    description: 'Tạo tài khoản hoặc đăng nhập để trải nghiệm đầy đủ tính năng của hệ thống.',
    actionLabel: 'Đăng nhập',
    available: true,
  },
  {
    id: 'profile',
    title: 'Hồ sơ cá nhân',
    description: 'Cập nhật thông tin cá nhân, liên kết biển số xe và quản lý phương tiện của bạn.',
    actionLabel: 'Xem hồ sơ',
    available: true,
  },
  {
    id: 'wallet',
    title: 'Ví điện tử',
    description: 'Nạp tiền, xem số dư và theo dõi toàn bộ lịch sử giao dịch thanh toán.',
    actionLabel: 'Mở ví',
    available: true,
  },
  {
    id: 'buildings',
    title: 'Bãi đỗ xe',
    description: 'Xem danh sách bãi đỗ đang hoạt động, vị trí, giờ hoạt động và tình trạng chỗ trống.',
    actionLabel: 'Tìm bãi đỗ',
    available: true,
  },
  {
    id: 'packages',
    title: 'Gói dài hạn',
    description: 'Mua gói gửi xe theo tháng hoặc năm — một biển số, một gói, giá cố định ưu đãi hơn đỗ theo giờ.',
    actionLabel: 'Xem gói',
    available: true,
  },
  {
    id: 'reservations',
    title: 'Đặt chỗ trước',
    description: 'Đặt trước ô đỗ xe theo giờ, đặt cọc và check-in khi đến đúng thời điểm đã hẹn.',
    actionLabel: 'Đặt chỗ',
    available: true,
  },
  {
    id: 'sessions',
    title: 'Lịch sử gửi xe',
    description: 'Xem lại các lượt xe vào/ra, thời gian đỗ và phí đã thanh toán.',
    actionLabel: 'Sắp ra mắt',
    available: false,
  },
  {
    id: 'feedback',
    title: 'Đánh giá dịch vụ',
    description: 'Chia sẻ trải nghiệm gửi xe — đánh giá và phản hồi giúp chúng tôi cải thiện chất lượng.',
    actionLabel: 'Đánh giá',
    available: true,
  },
  {
    id: 'notifications',
    title: 'Thông báo',
    description: 'Nhận thông báo từ hệ thống về đặt chỗ, gói dài hạn và cập nhật tài khoản.',
    actionLabel: 'Sắp ra mắt',
    available: false,
  },
];

