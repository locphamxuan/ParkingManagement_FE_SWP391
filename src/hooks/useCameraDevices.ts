import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, loadJson, saveJson } from '@/services/client/storage';

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

const readAssignment = (): CameraAssignment =>
  loadJson<CameraAssignment>(STORAGE_KEYS.staffCameraDevices) ?? {};

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

/**
 * Mở luồng camera cho một vai trò, tự gỡ ràng buộc thiết bị khi thiết bị đó không còn.
 *
 * deviceId được lưu localStorage nên đi theo trình duyệt, không đi theo máy: staff
 * đăng nhập ở máy khác (hoặc rút camera USB) sẽ dính OverconstrainedError, mà bấm
 * Retry lại gửi đúng deviceId cũ nên kẹt vĩnh viễn. Rơi về facingMode để camera vẫn
 * chạy được với thiết bị bất kỳ đang có.
 */
export async function openCameraStream(
  deviceId: string | undefined,
  fallbackFacing: 'user' | 'environment',
  extra: MediaTrackConstraints = {},
): Promise<MediaStream> {
  const attempt = (constraint: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({ video: { ...constraint, ...extra } });

  try {
    return await attempt(videoConstraintFor(deviceId, fallbackFacing));
  } catch (err) {
    const name = (err as { name?: string })?.name ?? '';
    const deviceGone = name === 'OverconstrainedError' || name === 'NotFoundError';
    if (!deviceId || !deviceGone) throw err;
    return attempt(videoConstraintFor(undefined, fallbackFacing));
  }
}

/**
 * Kiểm tra trước khi gọi getUserMedia — tránh treo mù 8 giây cho 2 lỗi phổ biến mà
 * trình duyệt không luôn báo lỗi rõ ràng/nhanh:
 *  - Không có camera device nào (enumerateDevices rỗng videoinput).
 *  - Quyền camera đã bị chặn ở cấp hệ điều hành/trình duyệt (Permissions API).
 * Ném lỗi cùng `name` như DOMException để tái dùng logic xử lý lỗi sẵn có.
 * Bỏ qua an toàn nếu trình duyệt không hỗ trợ API kiểm tra (Firefox không hỗ trợ
 * Permissions API cho 'camera') — để getUserMedia tự báo lỗi như bình thường.
 */
export async function preflightCameraCheck(): Promise<void> {
  if (navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some((d) => d.kind === 'videoinput')) {
        throw Object.assign(new Error('No camera device found'), { name: 'NotFoundError' });
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'NotFoundError') throw err;
      // enumerateDevices tự nó lỗi (hiếm) — bỏ qua, để getUserMedia thử tiếp.
    }
  }

  const permissionsApi = navigator.permissions as (Permissions & { query: (d: { name: string }) => Promise<PermissionStatus> }) | undefined;
  if (permissionsApi?.query) {
    try {
      const status = await permissionsApi.query({ name: 'camera' });
      if (status.state === 'denied') {
        throw Object.assign(new Error('Camera permission denied at OS/browser level'), { name: 'NotAllowedError' });
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'NotAllowedError') throw err;
      // 'camera' không phải tên quyền hợp lệ trên trình duyệt này (vd Firefox) — bỏ qua.
    }
  }
}

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
      saveJson(STORAGE_KEYS.staffCameraDevices, next);
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
