import { api } from './apiClient';

export type AppNotificationType =
  | 'checkin_rejected'
  | 'checkout_rejected'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_slot_released'
  | 'subscription_overage'
  | 'reservation_expired'
  | 'reservation_overstay'
  | 'feedback_reply'
  | 'general';

export interface AppNotification {
  _id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  plateNumber?: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Nhãn ngắn theo loại thông báo (dùng chung cho chuông + trang thông báo). */
export const NOTIFICATION_TYPE_LABEL: Record<AppNotificationType, string> = {
  checkin_rejected: 'Từ chối vào',
  checkout_rejected: 'Từ chối ra',
  subscription_expiring: 'Gói sắp hết hạn',
  subscription_expired: 'Gói đã hết hạn',
  subscription_slot_released: 'Thu hồi chỗ đỗ',
  subscription_overage: 'Vượt giờ gói',
  reservation_expired: 'Đặt chỗ hết hạn',
  reservation_overstay: 'Đậu quá giờ',
  feedback_reply: 'Phản hồi đánh giá',
  general: 'Thông báo',
};

type Wrap<T> = { data?: T };

export const notificationApi = {
  list: () =>
    api.get<Wrap<{ items: AppNotification[]; unread: number }>>('/users/notifications'),
  markRead: (id: string) =>
    api.patch<Wrap<AppNotification>>(`/users/notifications/${id}/read`),
  markAllRead: () =>
    api.patch<Wrap<{ ok: boolean }>>('/users/notifications/read-all'),
};
