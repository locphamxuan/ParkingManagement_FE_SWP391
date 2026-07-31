import { create } from 'zustand';
import {
  listVehicles,
  addVehicle,
  updateVehicle,
  removeVehicle,
  setDefaultVehicle,
  refreshVehicleQr,
  fetchVehicleCatalog,
  type Vehicle,
  type VehicleCategory,
  type VehicleInput,
  type VehicleUpdateInput,
} from '@/services/vehicleService';

/**
 * NGUỒN DUY NHẤT về phương tiện của người dùng đang đăng nhập.
 *
 * Trước đây danh sách biển số nằm trong `AuthSession` — tức là ảnh chụp tại thời
 * điểm login, không đổi cho tới khi đăng nhập lại, nên màn hình có thể hiện xe đã
 * xoá hoặc thiếu xe vừa thêm. Store này gọi API thật và mọi thao tác (thêm/sửa/xoá)
 * đều ghi lại danh sách server trả về, nên UI không bao giờ lệch với backend.
 */
interface VehicleState {
  vehicles: Vehicle[];
  categories: VehicleCategory[];
  /** Hạn dùng mã QR (ngày) do backend cấu hình — UI hiển thị đúng con số này. */
  qrTtlDays: number;
  isLoading: boolean;
  /** Đã nạp lần nào chưa — để phân biệt "chưa gọi API" với "gọi rồi, không có xe". */
  isLoaded: boolean;
  error: string | null;

  load: (options?: { force?: boolean }) => Promise<void>;
  add: (input: VehicleInput) => Promise<Vehicle>;
  update: (vehicleId: string, input: VehicleUpdateInput) => Promise<Vehicle>;
  remove: (vehicleId: string) => Promise<void>;
  setDefault: (vehicleId: string) => Promise<void>;
  refreshQr: (vehicleId: string) => Promise<Vehicle>;
  reset: () => void;
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const replaceOne = (vehicles: Vehicle[], updated: Vehicle) =>
  vehicles.map((v) => (v._id === updated._id ? updated : v));

export const useVehicleStore = create<VehicleState>()((set, get) => ({
  vehicles: [],
  categories: [],
  qrTtlDays: 0,
  isLoading: false,
  isLoaded: false,
  error: null,

  async load(options) {
    if (get().isLoading) return;
    if (get().isLoaded && !options?.force) return;

    set({ isLoading: true, error: null });
    try {
      // Danh mục loại xe hiếm khi đổi nhưng vẫn lấy từ backend để dropdown và
      // danh sách xe không bao giờ nói hai chuyện khác nhau về loại xe.
      const [vehicles, catalog] = await Promise.all([listVehicles(), fetchVehicleCatalog()]);
      set({
        vehicles,
        categories: catalog.categories,
        qrTtlDays: catalog.qrTtlDays,
        isLoading: false,
        isLoaded: true,
      });
    } catch (error) {
      set({ isLoading: false, error: messageOf(error, 'Không tải được danh sách phương tiện') });
    }
  },

  async add(input) {
    const created = await addVehicle(input);
    // Thêm xe có thể đổi cờ mặc định (xe đầu tiên) → đọc lại cho chắc.
    set({ vehicles: await listVehicles(), isLoaded: true, error: null });
    return created;
  },

  async update(vehicleId, input) {
    const updated = await updateVehicle(vehicleId, input);
    set((state) => ({ vehicles: replaceOne(state.vehicles, updated), error: null }));
    return updated;
  },

  async remove(vehicleId) {
    set({ vehicles: await removeVehicle(vehicleId), isLoaded: true, error: null });
  },

  async setDefault(vehicleId) {
    set({ vehicles: await setDefaultVehicle(vehicleId), isLoaded: true, error: null });
  },

  async refreshQr(vehicleId) {
    const updated = await refreshVehicleQr(vehicleId);
    set((state) => ({ vehicles: replaceOne(state.vehicles, updated), error: null }));
    return updated;
  },

  reset() {
    set({ vehicles: [], isLoaded: false, error: null });
  },
}));

// Đăng xuất → xoá dữ liệu xe của tài khoản cũ, tránh rò sang tài khoản đăng nhập kế tiếp.
if (typeof window !== 'undefined') {
  window.addEventListener('auth-unauthorized', () => {
    useVehicleStore.getState().reset();
  });
}
