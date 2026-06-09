import { api } from './apiClient';

export interface AppNotification {
  _id: string;
  type: 'checkin_rejected' | 'checkout_rejected' | 'general';
  title: string;
  message: string;
  plateNumber?: string | null;
  isRead: boolean;
  createdAt: string;
}

type Wrap<T> = { data?: T };

export const notificationApi = {
  list: () =>
    api.get<Wrap<{ items: AppNotification[]; unread: number }>>('/users/notifications'),
  markRead: (id: string) =>
    api.patch<Wrap<AppNotification>>(`/users/notifications/${id}/read`),
  markAllRead: () =>
    api.patch<Wrap<{ ok: boolean }>>('/users/notifications/read-all'),
};
