import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';

/**
 * Truy cập phương tiện của người dùng đang đăng nhập, tự nạp từ backend lần đầu.
 *
 * Dùng hook này thay vì đọc từ phiên đăng nhập: phiên chỉ mô tả "ai đang đăng nhập",
 * còn danh sách xe thay đổi bất cứ lúc nào nên phải lấy từ API.
 *
 * `auto: false` khi màn hình chỉ muốn đọc state có sẵn mà không kích hoạt request.
 */
export function useVehicles({ auto = true }: { auto?: boolean } = {}) {
  const session = useAuthStore((state) => state.session);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const categories = useVehicleStore((state) => state.categories);
  const qrTtlDays = useVehicleStore((state) => state.qrTtlDays);
  const isLoading = useVehicleStore((state) => state.isLoading);
  const isLoaded = useVehicleStore((state) => state.isLoaded);
  const error = useVehicleStore((state) => state.error);
  const load = useVehicleStore((state) => state.load);
  const add = useVehicleStore((state) => state.add);
  const update = useVehicleStore((state) => state.update);
  const remove = useVehicleStore((state) => state.remove);
  const setDefault = useVehicleStore((state) => state.setDefault);
  const refreshQr = useVehicleStore((state) => state.refreshQr);

  // Chỉ tài khoản khách hàng mới có phương tiện; staff/manager/admin gọi sẽ nhận 403.
  const isCustomer = session?.role === 'user';

  useEffect(() => {
    if (auto && isCustomer) void load();
  }, [auto, isCustomer, load]);

  return {
    vehicles,
    categories,
    qrTtlDays,
    isLoading,
    isLoaded,
    error,
    /** Xe mặc định của tài khoản, hoặc xe đầu tiên nếu chưa đặt mặc định. */
    defaultVehicle: vehicles.find((v) => v.isDefault) || vehicles[0] || null,
    hasVehicles: vehicles.length > 0,
    reload: () => load({ force: true }),
    add,
    update,
    remove,
    setDefault,
    refreshQr,
  };
}
