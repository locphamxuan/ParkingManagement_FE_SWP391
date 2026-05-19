export interface AdminModuleFlow {
  id: string;
  tabKey: string;
  title: string;
  description: string;
  actionLabel: string;
  available: boolean;
  fr: string;
}

export const adminFlowModules: AdminModuleFlow[] = [
  {
    id: 'adm-overview',
    tabKey: 'overview',
    title: 'Toan canh he thong',
    description: 'Tong quan da toa nha, canh bao van hanh va suc khoe he thong.',
    actionLabel: 'Mo bang',
    available: true,
    fr: 'FR-ADM-03',
  },
  {
    id: 'adm-buildings',
    tabKey: 'buildings',
    title: 'Quan ly toa nha',
    description: 'Them/sua/kich hoat toa nha theo mo hinh franchise.',
    actionLabel: 'Quan ly',
    available: true,
    fr: 'FR-ADM-01',
  },
  {
    id: 'adm-managers',
    tabKey: 'managers',
    title: 'Gan manager',
    description: 'Gan tai khoan manager vao tung toa nha, 1 manager co the quan ly nhieu toa.',
    actionLabel: 'Phan quyen',
    available: true,
    fr: 'FR-ADM-02',
  },
  {
    id: 'adm-revenue',
    tabKey: 'revenue',
    title: 'Bao cao doanh thu',
    description: 'Tong hop doanh thu lien toa nha tu shift revenues, payments va distributions.',
    actionLabel: 'Xem bao cao',
    available: true,
    fr: 'FR-ADM-03',
  },
  {
    id: 'adm-wallet',
    tabKey: 'wallet',
    title: 'System wallet',
    description: 'Theo doi so du vi tong, tien da phan phoi va cac dot doi soat.',
    actionLabel: 'Theo doi',
    available: true,
    fr: 'FR-ADM-04',
  },
  {
    id: 'adm-policies',
    tabKey: 'policies',
    title: 'Policy push',
    description: 'Day khung gia moi den toa nha va theo doi lich su thay doi.',
    actionLabel: 'Day chinh sach',
    available: true,
    fr: 'FR-ADM-06',
  },
  {
    id: 'adm-audits',
    tabKey: 'audits',
    title: 'Audit logs',
    description: 'Truy vet thay doi quan trong: gia, quyen han, hoan phi, thao tac he thong.',
    actionLabel: 'Kiem tra',
    available: true,
    fr: 'FR-ADM-05',
  },
];

export const adminKpis = [
  { id: 'buildings', label: 'Toa nha dang hoat dong', value: 12, trend: '+2 thang nay' },
  { id: 'managers', label: 'Manager dang phan quyen', value: 18, trend: '3 nguoi quan ly da toa' },
  { id: 'revenue', label: 'Doanh thu hom nay', value: '328.4M VND', trend: '+9.2% so voi hom qua' },
  { id: 'alerts', label: 'Canh bao can xu ly', value: 4, trend: '2 muc do cao' },
] as const;

export const buildingRows = [
  {
    id: 'B001',
    name: 'PBMS Riverside',
    city: 'TP.HCM',
    capacity: 820,
    openHours: '05:00 - 23:30',
    status: 'active',
    manager: 'Tran Minh Quan',
  },
  {
    id: 'B002',
    name: 'PBMS Midtown',
    city: 'Da Nang',
    capacity: 640,
    openHours: '24/7',
    status: 'active',
    manager: 'Nguyen Thu Ha',
  },
  {
    id: 'B003',
    name: 'PBMS Landmark East',
    city: 'Ha Noi',
    capacity: 510,
    openHours: '06:00 - 22:00',
    status: 'paused',
    manager: 'Le Hoang Nam',
  },
] as const;

export const managerAssignments = [
  {
    manager: 'Tran Minh Quan',
    account: 'quan.tm@pbms.vn',
    buildings: ['PBMS Riverside', 'PBMS District 7'],
    status: 'active',
  },
  {
    manager: 'Nguyen Thu Ha',
    account: 'ha.nt@pbms.vn',
    buildings: ['PBMS Midtown'],
    status: 'active',
  },
  {
    manager: 'Le Hoang Nam',
    account: 'nam.lh@pbms.vn',
    buildings: ['PBMS Landmark East'],
    status: 'review',
  },
] as const;

export const revenueSnapshots = [
  { period: 'Tuan nay', gross: '2.41B', distribution: '1.96B', pending: '140M' },
  { period: 'Thang nay', gross: '9.84B', distribution: '8.12B', pending: '320M' },
  { period: 'Quy nay', gross: '28.6B', distribution: '24.1B', pending: '1.1B' },
] as const;

export const walletSnapshots = [
  { label: 'So du he thong', value: '4.82B VND' },
  { label: 'Da phan phoi', value: '132.7B VND' },
  { label: 'Cho doi soat', value: '410M VND' },
  { label: 'Dot phan phoi tiep theo', value: '19:00 - Thu 2' },
] as const;

export const policyPushLogs = [
  {
    id: 'PPL-1732',
    actor: 'admin.root@pbms.vn',
    building: 'PBMS Riverside',
    policy: 'CAR_WEEKDAY_V3',
    oldValue: '25k/h -> 110k/day',
    newValue: '28k/h -> 120k/day',
    pushedAt: '18/05/2026 09:14',
  },
  {
    id: 'PPL-1731',
    actor: 'admin.root@pbms.vn',
    building: 'PBMS Midtown',
    policy: 'BIKE_NIGHT_V2',
    oldValue: '6k/h',
    newValue: '7k/h',
    pushedAt: '18/05/2026 08:47',
  },
] as const;

export const auditRows = [
  {
    id: 'AUD-55611',
    actor: 'admin.root@pbms.vn',
    action: 'UPDATE_PRICE_POLICY',
    target: 'price_policies',
    impact: 'Raising car weekday rate in 2 buildings',
    at: '18/05/2026 09:14',
    severity: 'high',
  },
  {
    id: 'AUD-55605',
    actor: 'finance.bot@pbms.vn',
    action: 'REVENUE_DISTRIBUTION',
    target: 'revenue_distributions',
    impact: 'Distributed 640M to 5 buildings',
    at: '18/05/2026 07:00',
    severity: 'medium',
  },
  {
    id: 'AUD-55592',
    actor: 'admin.root@pbms.vn',
    action: 'ASSIGN_MANAGER',
    target: 'building_managers',
    impact: 'Assigned manager to PBMS District 7',
    at: '17/05/2026 16:27',
    severity: 'low',
  },
] as const;

export const guardrails = [
  'The online card code belongs to authenticated users and is linked to account + plate.',
  'Walk-in guest vehicles must always be tracked by one parking session per visit.',
  'Guest temporary card/session code expires immediately after checkout completes.',
  'Any new entry after checkout must create a brand new parking session and new temporary code.',
] as const;
