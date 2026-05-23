export interface ManagerModuleFlow {
  id: string;
  tabKey: string;
  title: string;
  description: string;
  actionLabel: string;
  available: boolean;
  fr: string;
}

export const managerFlowModules: ManagerModuleFlow[] = [
  {
    id: 'mgr-overview',
    tabKey: 'overview',
    title: 'Toan canh toa nha',
    description: 'Tong quan tinh trang toa nha, trang thai slot, canh bao va suc khoe he thong.',
    actionLabel: 'Xem chi tiet',
    available: true,
    fr: 'FR-MGR-01',
  },
  {
    id: 'mgr-floors',
    tabKey: 'floors',
    title: 'Quan ly tang va cong',
    description: 'Quan ly tong so tang, loai xe, cong vaon/ra va canh bao ve tinh trang.',
    actionLabel: 'Cap nhat',
    available: true,
    fr: 'FR-MGR-02/03',
  },
  {
    id: 'mgr-slots',
    tabKey: 'slots',
    title: 'Quan ly slot do xe',
    description: 'Xem va cap nhat trang thai slot: trong, dang dung, dat truoc, bao tri.',
    actionLabel: 'Quan ly',
    available: true,
    fr: 'FR-MGR-04',
  },
  {
    id: 'mgr-vehicles',
    tabKey: 'vehicles',
    title: 'Loai phuong tien',
    description: 'Quan ly loai phuong tien duoc phep gui xe tai toa nha nay.',
    actionLabel: 'Chinh sua',
    available: true,
    fr: 'FR-MGR-05',
  },
  {
    id: 'mgr-pricing',
    tabKey: 'pricing',
    title: 'Bang gia va chinh sach',
    description: 'Cau hinh bang gia theo loai xe, khung gio, va lich su thay doi.',
    actionLabel: 'Cap nhat gia',
    available: true,
    fr: 'FR-MGR-06/07',
  },
  {
    id: 'mgr-packages',
    tabKey: 'packages',
    title: 'Goi dai han va dat truoc',
    description: 'Quan ly goi tuan/thang/quy va chinh sach dat chon truoc.',
    actionLabel: 'Quan ly goi',
    available: true,
    fr: 'FR-MGR-08/10',
  },
  {
    id: 'mgr-staff',
    tabKey: 'staff',
    title: 'Quan ly nhan vien va ca lam',
    description: 'Quan ly nhan vien, phan cong ca lam va theo doi chi so lao dong.',
    actionLabel: 'Phan cong',
    available: true,
    fr: 'FR-MGR-11/12',
  },
  {
    id: 'mgr-reports',
    tabKey: 'reports',
    title: 'Bao cao doanh thu',
    description: 'Xem chi tiet doanh thu theo ca, so luot xe va doi soat thu chi.',
    actionLabel: 'Xem bao cao',
    available: true,
    fr: 'FR-MGR-12',
  },
  {
    id: 'mgr-feedback',
    tabKey: 'feedback',
    title: 'Phan hoi tu khach',
    description: 'Xem va phan hoi cac kien nai, phan hoi tu khach hang.',
    actionLabel: 'Xem phan hoi',
    available: true,
    fr: 'FR-MGR-13',
  },
  {
    id: 'mgr-audit',
    tabKey: 'audit',
    title: 'Audit logs',
    description: 'Truy vet cac thay doi quan trong trong toa nha.',
    actionLabel: 'Kiem tra',
    available: true,
    fr: 'FR-MGR-14',
  },
];

export const managerKpis = [
  { id: 'occupancy', label: 'Ty le chiem dung hien tai', value: '82.4%', trend: 'Cao diem luc 18:00' },
  { id: 'revenue', label: 'Doanh thu hom nay', value: '156.2M VND', trend: '+8.3% so voi hom qua' },
  { id: 'sessions', label: 'Phien do dang hoat dong', value: '487', trend: '+5.2% so voi trung binh' },
  { id: 'alerts', label: 'Canh bao can xu ly', value: '3', trend: '2 muc do cao' },
] as const;

export const buildingInfo = {
  id: 'BLD-001',
  name: 'PBMS Riverside One',
  address: 'District 1, Ho Chi Minh City',
  totalFloors: 8,
  totalSlots: 820,
  availableSlots: 147,
  occupancyRate: 82,
  status: 'active',
  openHours: '05:00 - 23:30',
  contact: 'manager@pbms.vn',
} as const;

export const floorData = [
  {
    id: 'F-1',
    name: 'Tang 1',
    totalSlots: 120,
    availableSlots: 18,
    occupancy: 85,
    status: 'active',
    vehicleTypes: ['car', 'suv'],
    gates: ['Gate-1A', 'Gate-1B'],
  },
  {
    id: 'F-2',
    name: 'Tang 2',
    totalSlots: 120,
    availableSlots: 22,
    occupancy: 82,
    status: 'active',
    vehicleTypes: ['car', 'suv'],
    gates: ['Gate-2A', 'Gate-2B'],
  },
  {
    id: 'F-3',
    name: 'Tang 3',
    totalSlots: 110,
    availableSlots: 28,
    occupancy: 75,
    status: 'active',
    vehicleTypes: ['bike', 'car'],
    gates: ['Gate-3A'],
  },
] as const;

export const gateData = [
  {
    id: 'G-1A',
    name: 'Gate-1A',
    floor: 'Tang 1',
    type: 'entrance',
    allowedVehicles: ['car', 'suv', 'truck'],
    status: 'active',
  },
  {
    id: 'G-1B',
    name: 'Gate-1B',
    floor: 'Tang 1',
    type: 'exit',
    allowedVehicles: ['car', 'suv', 'truck'],
    status: 'active',
  },
  {
    id: 'G-3A',
    name: 'Gate-3A',
    floor: 'Tang 3',
    type: 'entrance',
    allowedVehicles: ['bike', 'motorcycle'],
    status: 'active',
  },
] as const;

export const vehicleTypeData = [
  { id: 'VT-1', name: 'Xe oto', code: 'car', maxHeight: '2.0m', maxWidth: '2.5m', status: 'active' },
  { id: 'VT-2', name: 'Xe SUV', code: 'suv', maxHeight: '2.1m', maxWidth: '2.6m', status: 'active' },
  { id: 'VT-3', name: 'Xe mo to', code: 'motorcycle', maxHeight: '1.5m', maxWidth: '1.2m', status: 'active' },
  { id: 'VT-4', name: 'Xe may', code: 'bike', maxHeight: '1.3m', maxWidth: '1.0m', status: 'active' },
] as const;

export const pricingData = [
  {
    id: 'PP-1',
    vehicleType: 'Xe oto',
    timeSlot: '06:00 - 12:00',
    pricePerHour: 25000,
    maxPrice: 110000,
    lastUpdated: '18/05/2026 09:14',
    updatedBy: 'manager@pbms.vn',
  },
  {
    id: 'PP-2',
    vehicleType: 'Xe oto',
    timeSlot: '12:00 - 18:00',
    pricePerHour: 28000,
    maxPrice: 120000,
    lastUpdated: '18/05/2026 09:14',
    updatedBy: 'manager@pbms.vn',
  },
  {
    id: 'PP-3',
    vehicleType: 'Xe mo to',
    timeSlot: '06:00 - 23:30',
    pricePerHour: 6000,
    maxPrice: 30000,
    lastUpdated: '17/05/2026 14:22',
    updatedBy: 'manager@pbms.vn',
  },
] as const;

export const policyPushLogsManager = [
  {
    id: 'PPL-2156',
    policy: 'CAR_WEEKDAY_V3',
    oldValue: '25k/h -> 110k/day',
    newValue: '28k/h -> 120k/day',
    pushedAt: '18/05/2026 09:14',
    status: 'approved',
  },
  {
    id: 'PPL-2154',
    policy: 'BIKE_NIGHT_V2',
    oldValue: '6k/h',
    newValue: '7k/h',
    pushedAt: '18/05/2026 08:47',
    status: 'pending',
  },
] as const;

export const staffData = [
  {
    id: 'STF-1001',
    name: 'Nguyen Van A',
    email: 'a.nv@pbms.vn',
    role: 'staff',
    assignedShifts: ['Sang', 'Chieu'],
    status: 'active',
  },
  {
    id: 'STF-1002',
    name: 'Tran Thi B',
    email: 'b.tt@pbms.vn',
    role: 'shift_leader',
    assignedShifts: ['Dem'],
    status: 'active',
  },
  {
    id: 'STF-1003',
    name: 'Le Van C',
    email: 'c.lv@pbms.vn',
    role: 'staff',
    assignedShifts: ['Sang'],
    status: 'inactive',
  },
] as const;

export const shiftData = [
  {
    id: 'SH-001',
    name: 'Sang (05:00 - 13:00)',
    startTime: '05:00',
    endTime: '13:00',
    requiredStaff: 4,
    assignedStaff: 3,
    status: 'active',
  },
  {
    id: 'SH-002',
    name: 'Chieu (13:00 - 20:00)',
    startTime: '13:00',
    endTime: '20:00',
    requiredStaff: 3,
    assignedStaff: 3,
    status: 'active',
  },
  {
    id: 'SH-003',
    name: 'Dem (20:00 - 05:00)',
    startTime: '20:00',
    endTime: '05:00',
    requiredStaff: 2,
    assignedStaff: 2,
    status: 'active',
  },
] as const;

export const revenueReportManager = [
  {
    date: '18/05/2026',
    shift: 'Sang',
    sessions: 245,
    revenue: 52.3,
    outstanding: 2.1,
    reconciled: 50.2,
  },
  {
    date: '18/05/2026',
    shift: 'Chieu',
    sessions: 198,
    revenue: 48.7,
    outstanding: 1.8,
    reconciled: 46.9,
  },
  {
    date: '18/05/2026',
    shift: 'Dem',
    sessions: 126,
    revenue: 28.4,
    outstanding: 0.9,
    reconciled: 27.5,
  },
] as const;

export const feedbackData = [
  {
    id: 'FB-1001',
    customerName: 'Do Minh Hai',
    rating: 4,
    subject: 'Dat do khong co slot',
    message: 'Ung dung hien thi khong chinh xac tinh trang slot',
    date: '18/05/2026 14:23',
    status: 'pending',
  },
  {
    id: 'FB-1002',
    customerName: 'Tran Thu Ha',
    rating: 5,
    subject: 'Dung vao dat truoc thanh cong',
    message: 'Quy trinh dat truoc rat de dung va nhanh chong',
    date: '17/05/2026 10:15',
    status: 'resolved',
  },
] as const;

export const auditLogsManager = [
  {
    id: 'AUD-MG-001',
    actor: 'manager@pbms.vn',
    action: 'UPDATE_PRICE_POLICY',
    target: 'price_policies',
    impact: 'Changed car weekday rate from 25k to 28k per hour',
    at: '18/05/2026 09:14',
    severity: 'high' as const,
  },
  {
    id: 'AUD-MG-002',
    actor: 'manager@pbms.vn',
    action: 'ASSIGN_STAFF',
    target: 'staff_shifts',
    impact: 'Assigned Nguyen Van A to morning shift',
    at: '17/05/2026 15:45',
    severity: 'medium' as const,
  },
  {
    id: 'AUD-MG-003',
    actor: 'system@pbms.vn',
    action: 'SLOT_MAINTENANCE',
    target: 'parking_slots',
    impact: 'Marked slot F-2-145 as under maintenance',
    at: '17/05/2026 08:30',
    severity: 'low' as const,
  },
] as const;

export const slotStatusData = [
  { floor: 'Tang 1', available: 18, occupied: 87, reserved: 12, maintenance: 3 },
  { floor: 'Tang 2', available: 22, occupied: 85, reserved: 10, maintenance: 3 },
  { floor: 'Tang 3', available: 28, occupied: 76, reserved: 4, maintenance: 2 },
] as const;

export const packageData = [
  {
    id: 'PKG-1',
    name: 'Goi hang tuan',
    duration: '7 days',
    slotCount: 1,
    price: 280000,
    description: 'Dat chon 24/7 trong 1 tuan',
    activeSubscriptions: 34,
  },
  {
    id: 'PKG-2',
    name: 'Goi hang thang',
    duration: '30 days',
    slotCount: 1,
    price: 900000,
    description: 'Dat chon 24/7 trong 1 thang',
    activeSubscriptions: 127,
  },
  {
    id: 'PKG-3',
    name: 'Goi hang quy',
    duration: '90 days',
    slotCount: 1,
    price: 2400000,
    description: 'Dat chon 24/7 trong 1 quy',
    activeSubscriptions: 18,
  },
] as const;
