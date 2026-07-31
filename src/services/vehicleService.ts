import { api } from '@/services/client/apiClient';

/**
 * Phương tiện của người dùng — khớp collection `Vehicle` ở backend.
 *
 * Trước đây frontend giữ một bản sao danh sách biển số trong phiên đăng nhập, nên
 * số liệu hiển thị là ảnh chụp lúc login chứ không phải trạng thái thật. Giờ mọi
 * màn hình đọc qua service này (và `vehicleStore`), tức là luôn lấy dữ liệu sống.
 */
export interface Vehicle {
  _id: string;
  plateNumber: string;
  category: VehicleCategoryCode;
  brand: string | null;
  isDefault: boolean;
  /** Token QR gắn theo xe. Backend tự cấp lại khi hết hạn, client không phải xử lý. */
  qrCode: string;
  qrIssuedAt?: string;
  /** Mốc hết hạn token QR (mặc định 2 ngày). Dùng để hiển thị đếm ngược. */
  qrExpiresAt: string | null;
}

/** Danh sách này do backend quyết định — đây chỉ là kiểu để TypeScript kiểm tra. */
export type VehicleCategoryCode =
  | 'motorcycle'
  | 'ebike'
  | 'emotorbike'
  | 'car'
  | 'suv'
  | 'truck'
  | 'other';

export interface VehicleCategory {
  code: VehicleCategoryCode;
  label: string;
}

export interface VehicleCatalog {
  categories: VehicleCategory[];
  /** Số ngày hiệu lực của mã QR, để UI nói đúng con số thay vì ghi cứng "2 ngày". */
  qrTtlDays: number;
}

export interface VehicleInput {
  plateNumber: string;
  category?: VehicleCategoryCode;
  brand?: string | null;
}

export type VehicleUpdateInput = Omit<VehicleInput, 'plateNumber'>;

interface Wrap<T> {
  data?: T;
}

/** Danh mục thể loại xe + hạn dùng QR. Nguồn từ backend, không chép cứng ở client. */
export async function fetchVehicleCatalog(): Promise<VehicleCatalog> {
  const res = await api.get<Wrap<VehicleCatalog>>('/users/vehicle-categories');
  return {
    categories: res?.data?.categories ?? [],
    qrTtlDays: res?.data?.qrTtlDays ?? 0,
  };
}

export async function listVehicles(): Promise<Vehicle[]> {
  const res = await api.get<Wrap<{ vehicles: Vehicle[] }>>('/users/vehicles');
  return res?.data?.vehicles ?? [];
}

export async function addVehicle(input: VehicleInput): Promise<Vehicle> {
  const res = await api.post<Wrap<{ vehicle: Vehicle }>>('/users/vehicles', {
    ...input,
    plateNumber: input.plateNumber.trim().toUpperCase(),
  });
  return res.data!.vehicle;
}

export async function updateVehicle(
  vehicleId: string,
  input: VehicleUpdateInput
): Promise<Vehicle> {
  const res = await api.put<Wrap<{ vehicle: Vehicle }>>(`/users/vehicles/${vehicleId}`, input);
  return res.data!.vehicle;
}

/** Trả về danh sách CÒN LẠI sau khi xoá (backend trả luôn để client khỏi gọi lại). */
export async function removeVehicle(vehicleId: string): Promise<Vehicle[]> {
  const res = await api.delete<Wrap<{ vehicles: Vehicle[] }>>(`/users/vehicles/${vehicleId}`);
  return res?.data?.vehicles ?? [];
}

export async function setDefaultVehicle(vehicleId: string): Promise<Vehicle[]> {
  const res = await api.patch<Wrap<{ vehicles: Vehicle[] }>>(
    `/users/vehicles/${vehicleId}/default`
  );
  return res?.data?.vehicles ?? [];
}

/** Huỷ token QR cũ ngay và lấy token mới — dùng khi chủ xe nghi mã bị chụp trộm. */
export async function refreshVehicleQr(vehicleId: string): Promise<Vehicle> {
  const res = await api.post<Wrap<{ vehicle: Vehicle }>>(
    `/users/vehicles/${vehicleId}/qr/refresh`
  );
  return res.data!.vehicle;
}

/** Số mili-giây còn lại của mã QR; <= 0 nghĩa là đã hết hạn. */
export function qrTimeRemainingMs(vehicle: Pick<Vehicle, 'qrExpiresAt'>): number {
  if (!vehicle.qrExpiresAt) return 0;
  return new Date(vehicle.qrExpiresAt).getTime() - Date.now();
}
