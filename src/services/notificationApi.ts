import { api } from '@/services/client/apiClient';

export type AppNotificationType =
  | 'checkin_rejected'
  | 'checkout_rejected'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_slot_released'
  | 'subscription_overage'
  | 'incident_update'
  | 'incident_resolved'
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

/** Short label by notification type (used for notification bell and notifications page). */
export const NOTIFICATION_TYPE_LABEL: Record<AppNotificationType, string> = {
  checkin_rejected: 'Check-in Rejected',
  checkout_rejected: 'Check-out Rejected',
  subscription_expiring: 'Sub Expiring',
  subscription_expired: 'Sub Expired',
  subscription_slot_released: 'Slot Released',
  subscription_overage: 'Sub Overage',
  incident_update: 'Incident Update',
  incident_resolved: 'Incident Resolved',
  feedback_reply: 'Feedback Reply',
  general: 'General',
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
