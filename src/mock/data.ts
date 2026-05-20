import type {
  AuditLog,
  Building,
  FraudAlert,
  MonitoringMetric,
  RevenuePoint,
  UserRecord,
} from '@/types';

export const dashboardStats = [
  { key: 'buildings', label: 'Tổng số tòa nhà', value: '24', delta: '+2 tháng này' },
  { key: 'sessions', label: 'Phiên đỗ đang hoạt động', value: '1,483', delta: '+7.9% hôm nay' },
  { key: 'occupancy', label: 'Tỉ lệ chiếm dụng', value: '78.4%', delta: 'Cao điểm lúc 18:00' },
  { key: 'revenue', label: 'Doanh thu hôm nay', value: '1.86B VND', delta: '+11.2% so với hôm trước' },
  { key: 'wallet', label: 'Ví hệ thống', value: '5.42B VND', delta: 'Đang chờ phân phối 420M' },
  { key: 'users', label: 'Người dùng hoạt động', value: '38,920', delta: '+312 mới' },
  { key: 'reservations', label: 'Đặt trước đang hoạt động', value: '562', delta: '84 hết hạn trong 30m' },
  { key: 'fraud', label: 'Cảnh báo gian lận', value: '9', delta: '2 nguy cấp' },
] as const;

export const revenueTrend: RevenuePoint[] = [
  { date: 'Mon', revenue: 1280, occupancy: 68, sessions: 1140 },
  { date: 'Tue', revenue: 1334, occupancy: 70, sessions: 1182 },
  { date: 'Wed', revenue: 1410, occupancy: 74, sessions: 1240 },
  { date: 'Thu', revenue: 1498, occupancy: 78, sessions: 1328 },
  { date: 'Fri', revenue: 1682, occupancy: 82, sessions: 1421 },
  { date: 'Sat', revenue: 1914, occupancy: 85, sessions: 1562 },
  { date: 'Sun', revenue: 1860, occupancy: 81, sessions: 1483 },
];

export const paymentMethodDistribution = [
  { name: 'Ví ứng dụng', value: 42 },
  { name: 'QR', value: 31 },
  { name: 'Tiền mặt', value: 19 },
  { name: 'Thẻ ngân hàng', value: 8 },
];

export const buildings: Building[] = [
  {
    id: 'BLD-001',
    name: 'PBMS Riverside One',
    address: 'District 1, Ho Chi Minh City',
    floors: 8,
    occupancyRate: 82,
    status: 'active',
    manager: 'Nguyen Minh Quan',
    revenueToday: 132000000,
  },
  {
    id: 'BLD-002',
    name: 'PBMS Midtown Hub',
    address: 'Hai Chau, Da Nang',
    floors: 6,
    occupancyRate: 76,
    status: 'active',
    manager: 'Tran Thu Ha',
    revenueToday: 98000000,
  },
  {
    id: 'BLD-003',
    name: 'PBMS Landmark East',
    address: 'Nam Tu Liem, Ha Noi',
    floors: 9,
    occupancyRate: 63,
    status: 'maintenance',
    manager: 'Le Hoang Nam',
    revenueToday: 71000000,
  },
  {
    id: 'BLD-004',
    name: 'PBMS Smart Port',
    address: 'Hai Phong Port Zone',
    floors: 7,
    occupancyRate: 88,
    status: 'warning',
    manager: 'Pham Gia Bao',
    revenueToday: 125000000,
  },
  {
    id: 'BLD-005',
    name: 'PBMS South Gateway',
    address: 'District 7, Ho Chi Minh City',
    floors: 5,
    occupancyRate: 59,
    status: 'inactive',
    manager: 'Vo Nhat Linh',
    revenueToday: 46000000,
  },
];

export const users: UserRecord[] = [
  {
    id: 'USR-1001',
    name: 'Do Minh Hai',
    email: 'hai.dm@pbms.com',
    role: 'manager',
    status: 'active',
    walletBalance: 5600000,
    linkedPlates: ['51H-90812', '51K-22111'],
  },
  {
    id: 'USR-1002',
    name: 'Pham Thi An',
    email: 'an.pt@pbms.com',
    role: 'staff',
    status: 'active',
    walletBalance: 900000,
    linkedPlates: ['43A-56892'],
  },
  {
    id: 'USR-1003',
    name: 'Le Quoc Khanh',
    email: 'khanh.lq@pbms.com',
    role: 'user',
    status: 'blocked',
    walletBalance: 120000,
    linkedPlates: ['30F-18221'],
  },
  {
    id: 'USR-1004',
    name: 'Nguyen Bao Chau',
    email: 'chau.nb@pbms.com',
    role: 'user',
    status: 'pending',
    walletBalance: 2300000,
    linkedPlates: ['59A-11229', '59A-33828'],
  },
  {
    id: 'USR-1005',
    name: 'Tran Van Son',
    email: 'son.tv@pbms.com',
    role: 'manager',
    status: 'active',
    walletBalance: 17500000,
    linkedPlates: ['77C-45612'],
  },
];

export const transactions = [
  {
    id: 'TX-99121',
    building: 'PBMS Riverside One',
    amount: 420000,
    method: 'Ví ứng dụng',
    status: 'success',
    time: '2026-05-18T09:12:00Z',
  },
  {
    id: 'TX-99120',
    building: 'PBMS Smart Port',
    amount: 680000,
    method: 'QR',
    status: 'success',
    time: '2026-05-18T09:08:00Z',
  },
  {
    id: 'TX-99119',
    building: 'PBMS Midtown Hub',
    amount: 160000,
    method: 'Tiền mặt',
    status: 'manual-review',
    time: '2026-05-18T09:03:00Z',
  },
  {
    id: 'TX-99118',
    building: 'PBMS Landmark East',
    amount: 1200000,
    method: 'Ví ứng dụng',
    status: 'success',
    time: '2026-05-18T08:56:00Z',
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: 'AUD-88231',
    actor: 'admin@gmail.com',
    action: 'PUSH_PRICE_POLICY',
    target: 'price_policies',
    severity: 'high',
    timestamp: '2026-05-18 09:16',
    details: 'Policy CAR_WEEKDAY_V4 pushed to 4 buildings.',
  },
  {
    id: 'AUD-88229',
    actor: 'ops.bot@pbms.com',
    action: 'REVENUE_DISTRIBUTION',
    target: 'revenue_distributions',
    severity: 'medium',
    timestamp: '2026-05-18 07:00',
    details: 'Distributed 680M VND to building wallets.',
  },
  {
    id: 'AUD-88214',
    actor: 'admin@gmail.com',
    action: 'ASSIGN_MANAGER',
    target: 'building_managers',
    severity: 'low',
    timestamp: '2026-05-17 19:24',
    details: 'Manager assigned to BLD-004 and BLD-005.',
  },
  {
    id: 'AUD-88197',
    actor: 'finance@pbms.com',
    action: 'REFUND_APPROVAL',
    target: 'payments',
    severity: 'critical',
    timestamp: '2026-05-17 15:50',
    details: 'Manual refund approved for duplicate deduction incident.',
  },
];

export const fraudAlerts: FraudAlert[] = [
  {
    id: 'FRA-211',
    type: 'Trùng biển số giữa các tòa nhà',
    building: 'PBMS Riverside One',
    severity: 'critical',
    timestamp: '2026-05-18 09:02',
    note: 'Biển 59A-11229 xuất hiện trong 2 phiên hoạt động ở các tòa nhà khác nhau.',
  },
  {
    id: 'FRA-210',
    type: 'Tốc độ hoàn tiền bất thường',
    building: 'PBMS Midtown Hub',
    severity: 'high',
    timestamp: '2026-05-18 08:47',
    note: '4 yêu cầu hoàn tiền được phê duyệt trong 15 phút bởi cùng một tài khoản nhân viên.',
  },
  {
    id: 'FRA-209',
    type: 'Không khớp cổng khuya',
    building: 'PBMS Smart Port',
    severity: 'medium',
    timestamp: '2026-05-18 01:21',
    note: 'Cổng check-in không khớp với cổng loại phương tiện được cấp.',
  },
];

export const monitoringMetrics: MonitoringMetric[] = [
  { id: 'latency', label: 'Độ trễ API', value: '128 ms', trend: '-12 ms', status: 'ok' },
  { id: 'gate', label: 'Trạng thái cổng', value: '62/64 online', trend: '2 cổng suy giảm', status: 'warning' },
  { id: 'camera', label: 'Trạng thái camera', value: '120/120 online', trend: 'Ổn định', status: 'ok' },
  { id: 'server', label: 'Tải server', value: '72%', trend: '+8%', status: 'warning' },
  { id: 'database', label: 'Tải cơ sở dữ liệu', value: '61%', trend: '+3%', status: 'ok' },
  { id: 'uptime', label: 'Thời gian hoạt động', value: '99.87%', trend: 'SLA khỏe mạnh', status: 'ok' },
  { id: 'sessions', label: 'Phiên hoạt động', value: '1,483', trend: '+94', status: 'ok' },
];

export const liveActivities = [
  'Cổng G-01 check-in cho biển 51H-90812 tại BLD-001.',
  'Đặt trước RZ-890 tự hết hạn sau thời gian giữ.',
  'Thẻ tạm phát cho khách walk-in cho biển 59A-56111 đã được sinh.',
  'Đăng ký dài hạn LT-771 được xác thực cho biển 43A-56892.',
  'Hoàn tất thanh toán cho phiên tạm PS-220198.',
];

export const operationalGuardrails = [
  'Mã thẻ online thuộc về tài khoản người dùng đã xác thực và có biển liên kết.',
  'Khách walk-in không có tài khoản chỉ vào qua phiên đỗ.',
  'Mã thẻ/phiên khách tạm hết hạn ngay sau khi thanh toán.',
  'Lần vào mới sau khi thanh toán phải tạo phiên đỗ hoàn toàn mới.',
];
