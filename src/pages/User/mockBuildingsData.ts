export type BuildingStatus = 'active' | 'inactive' | 'maintenance';

export interface UserBuilding {
  _id: string;
  name: string;
  code?: string;
  totalFloors?: number;
  status?: BuildingStatus;
  operatingHours?: { open?: string; close?: string };
  pricing?: {
    hourlyRate?: number;
    dailyCap?: number | null;
    motorcycleMultiplier?: number;
  };
  address?: { fullAddress?: string; street?: string; district?: string; city?: string };
  contactPhone?: string;
}

export interface UserPricePolicy {
  _id: string;
  name: string;
  vehicleType?: { name?: string; code?: string } | string | null;
  hourlyRate?: number;
  dailyCap?: number | null;
  timeWindow?: { from?: string; to?: string };
  isActive?: boolean;
}

export interface UserBuildingContact {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface UserReservationPolicy {
  minAdvanceMinutes: number;
  maxAdvanceHours: number;
  maxHoldMinutes: number;
  isActive: boolean;
}

export interface UserBuildingView {
  building: UserBuilding;
  pricePolicies: UserPricePolicy[];
  reservationPolicy?: UserReservationPolicy;
  team?: {
    managers: UserBuildingContact[];
    staff: UserBuildingContact[];
  };
  slots: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    maintenance: number;
  };
}

const BUILDING_MOCK_DATA: UserBuildingView[] = [
  {
    building: {
      _id: 'demo-building-1',
      name: 'PBMS Central Parking',
      code: 'PBMS-01',
      totalFloors: 5,
      status: 'active',
      operatingHours: { open: '06:00', close: '23:00' },
      pricing: { hourlyRate: 15000, dailyCap: 120000, motorcycleMultiplier: 0.45 },
      address: { fullAddress: 'Khu đỗ xe trung tâm, TP. Hồ Chí Minh' },
      contactPhone: '1900 636 447',
    },
    pricePolicies: [
      {
        _id: 'demo-policy-car',
        name: 'O to theo gio',
        vehicleType: { name: 'O to' },
        hourlyRate: 15000,
        dailyCap: 120000,
        timeWindow: { from: '06:00', to: '23:00' },
        isActive: true,
      },
      {
        _id: 'demo-policy-bike',
        name: 'Xe may theo gio',
        vehicleType: { name: 'Xe may' },
        hourlyRate: 7000,
        dailyCap: 50000,
        timeWindow: { from: '06:00', to: '23:00' },
        isActive: true,
      },
    ],
    reservationPolicy: {
      minAdvanceMinutes: 15,
      maxAdvanceHours: 72,
      maxHoldMinutes: 30,
      isActive: true,
    },
    team: {
      managers: [
        {
          _id: 'demo-manager-1',
          fullName: 'Nguyen Quoc Minh',
          email: 'minh.nq@pbms.vn',
          phone: '0901234567',
        },
      ],
      staff: [
        {
          _id: 'demo-staff-1',
          fullName: 'Tran Hoang An',
          email: 'an.th@pbms.vn',
          phone: '0911222333',
        },
        {
          _id: 'demo-staff-2',
          fullName: 'Le Tuan Kiet',
          email: 'kiet.lt@pbms.vn',
          phone: '0933444555',
        },
      ],
    },
    slots: { total: 120, available: 58, occupied: 49, reserved: 9, maintenance: 4 },
  },
  {
    building: {
      _id: 'demo-building-2',
      name: 'Sky Tower Garage',
      code: 'SKY-02',
      totalFloors: 3,
      status: 'active',
      operatingHours: { open: '00:00', close: '23:59' },
      pricing: { hourlyRate: 12000, dailyCap: 100000, motorcycleMultiplier: 0.5 },
      address: { fullAddress: 'Quận 7, TP. Hồ Chí Minh' },
      contactPhone: '028 7300 8899',
    },
    pricePolicies: [
      {
        _id: 'demo-policy-24h',
        name: 'Gui xe 24/7',
        vehicleType: { name: 'Tat ca phuong tien' },
        hourlyRate: 12000,
        dailyCap: 100000,
        timeWindow: { from: '00:00', to: '23:59' },
        isActive: true,
      },
    ],
    reservationPolicy: {
      minAdvanceMinutes: 10,
      maxAdvanceHours: 48,
      maxHoldMinutes: 20,
      isActive: true,
    },
    team: {
      managers: [
        {
          _id: 'demo-manager-2',
          fullName: 'Pham Gia Bao',
          email: 'bao.pg@pbms.vn',
          phone: '0988333444',
        },
      ],
      staff: [
        {
          _id: 'demo-staff-3',
          fullName: 'Vu Khanh Linh',
          email: 'linh.vk@pbms.vn',
          phone: '0977666555',
        },
        {
          _id: 'demo-staff-4',
          fullName: 'Do Quang Huy',
          email: 'huy.dq@pbms.vn',
          phone: '0966888999',
        },
        {
          _id: 'demo-staff-5',
          fullName: 'Nguyen Thanh Dat',
          email: 'dat.nt@pbms.vn',
        },
      ],
    },
    slots: { total: 80, available: 21, occupied: 52, reserved: 5, maintenance: 2 },
  },
  {
    building: {
      _id: 'demo-building-3',
      name: 'FPT Software',
      code: 'FPTS-01',
      totalFloors: 2,
      status: 'active',
      operatingHours: { open: '07:00', close: '21:00' },
      pricing: { hourlyRate: 10000, dailyCap: 80000, motorcycleMultiplier: 0.4 },
      address: { fullAddress: 'Khu công nghệ FPT, Hòa Lạc, Hà Nội' },
      contactPhone: '024 7300 8888',
    },
    pricePolicies: [
      {
        _id: 'demo-policy-fpt-car',
        name: 'O to theo gio',
        vehicleType: { name: 'O to' },
        hourlyRate: 10000,
        dailyCap: 80000,
        timeWindow: { from: '07:00', to: '21:00' },
        isActive: true,
      },
      {
        _id: 'demo-policy-fpt-bike',
        name: 'Xe may theo gio',
        vehicleType: { name: 'Xe may' },
        hourlyRate: 5000,
        dailyCap: 40000,
        timeWindow: { from: '07:00', to: '21:00' },
        isActive: true,
      },
    ],
    reservationPolicy: {
      minAdvanceMinutes: 20,
      maxAdvanceHours: 48,
      maxHoldMinutes: 25,
      isActive: true,
    },
    team: {
      managers: [
        {
          _id: 'demo-manager-3',
          fullName: 'Tran Duc Hieu',
          email: 'hieu.td@fpt.vn',
          phone: '0912345678',
        },
      ],
      staff: [
        {
          _id: 'demo-staff-6',
          fullName: 'Hoang Minh Duc',
          email: 'duc.hm@fpt.vn',
          phone: '0976543210',
        },
      ],
    },
    slots: { total: 50, available: 28, occupied: 18, reserved: 3, maintenance: 1 },
  },
  {
    building: {
      _id: 'demo-building-4',
      name: 'Parking Tower A',
      code: 'PTA',
      totalFloors: 5,
      status: 'active',
      operatingHours: { open: '05:00', close: '23:30' },
      pricing: { hourlyRate: 18000, dailyCap: 150000, motorcycleMultiplier: 0.55 },
      address: { fullAddress: 'Đường Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh' },
      contactPhone: '028 3825 4321',
    },
    pricePolicies: [
      {
        _id: 'demo-policy-pta-car',
        name: 'O to theo gio',
        vehicleType: { name: 'O to' },
        hourlyRate: 18000,
        dailyCap: 150000,
        timeWindow: { from: '05:00', to: '23:30' },
        isActive: true,
      },
      {
        _id: 'demo-policy-pta-bike',
        name: 'Xe may theo gio',
        vehicleType: { name: 'Xe may' },
        hourlyRate: 9000,
        dailyCap: 70000,
        timeWindow: { from: '05:00', to: '23:30' },
        isActive: true,
      },
    ],
    reservationPolicy: {
      minAdvanceMinutes: 15,
      maxAdvanceHours: 72,
      maxHoldMinutes: 30,
      isActive: true,
    },
    team: {
      managers: [
        {
          _id: 'demo-manager-4',
          fullName: 'Nguyen Kim Anh',
          email: 'anh.nk@pbms.vn',
          phone: '0983456789',
        },
      ],
      staff: [
        {
          _id: 'demo-staff-7',
          fullName: 'Tran Thao Linh',
          email: 'linh.tt@pbms.vn',
          phone: '0965432109',
        },
        {
          _id: 'demo-staff-8',
          fullName: 'Pham Hoang Vu',
          email: 'vu.ph@pbms.vn',
          phone: '0934567890',
        },
      ],
    },
    slots: { total: 150, available: 65, occupied: 72, reserved: 10, maintenance: 3 },
  },
];

export async function listUserBuildingViews(): Promise<UserBuildingView[]> {
  return BUILDING_MOCK_DATA;
}

