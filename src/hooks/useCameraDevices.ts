import { useCallback, useEffect, useState } from 'react';

/**
 * Quản lý việc gán THIẾT BỊ CAMERA VẬT LÝ cho từng vai trò ở màn staff:
 *  - 'plate'    → camera quét biển số
 *  - 'portrait' → camera chân dung tài xế
 *  - 'qr'       → camera quét QR
 *
 * Ở thực tế có 2–3 camera USB → mỗi vai trò gán 1 deviceId riêng để mở đồng thời,
 * mỗi camera ra hình riêng. Trên laptop 1 webcam thì các vai trò trỏ cùng 1 thiết bị.
 * Lựa chọn được lưu localStorage để giữ giữa các phiên.
 */
export type CameraRole = 'plate' | 'portrait' | 'qr';

export type CameraAssignment = Partial<Record<CameraRole, string>>;

const STORAGE_KEY = 'pbms.staffCameraDevices';

const readAssignment = (): CameraAssignment => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as CameraAssignment;
  } catch {
    return {};
  }
};

/**
 * Tạo `video` constraint cho getUserMedia: ưu tiên deviceId đã gán, nếu chưa gán
 * thì fallback theo facingMode (mặc định camera sau cho biển số/QR, camera trước
 * cho chân dung).
 */
export const videoConstraintFor = (
  deviceId: string | undefined,
  fallbackFacing: 'user' | 'environment' = 'environment',
): MediaTrackConstraints =>
  deviceId ? { deviceId: { exact: deviceId } } : { facingMode: fallbackFacing };

export function useCameraDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [assignment, setAssignment] = useState<CameraAssignment>(readAssignment);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === 'videoinput'));
    } catch {
      /* ignore */
    }
  }, []);

  // Tên thiết bị (label) chỉ hiện sau khi đã cấp quyền camera — xin quyền 1 lần rồi liệt kê.
  const requestAndRefresh = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
    } catch {
      /* quyền bị từ chối — vẫn thử liệt kê (label có thể trống) */
    }
    await refresh();
  }, [refresh]);

  const assign = useCallback((role: CameraRole, deviceId: string) => {
    setAssignment((prev) => {
      const next = { ...prev, [role]: deviceId || undefined };
      if (!deviceId) delete next[role];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    navigator.mediaDevices?.addEventListener?.('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
  }, [refresh]);

  return { devices, assignment, assign, refresh, requestAndRefresh };
}
