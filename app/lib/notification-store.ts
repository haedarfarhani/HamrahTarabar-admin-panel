'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import {
  AdminNotificationItem,
  NotificationAlertDto,
  NotificationAlertStatus,
  getAdminNotifications,
  getMyUnreadNotificationCount,
  getNotificationAlerts,
  markAllNotificationsReadByAdmin,
  markNotificationReadByAdmin,
} from '@/app/lib/api';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';

/** فاصله‌ی polling وضعیت اعلان‌ها (میلی‌ثانیه) */
export const NOTIFICATION_POLL_INTERVAL_MS = 30000;

interface LoadMyAlertsOptions {
  status?: NotificationAlertStatus | '';
  page?: number;
  pageSize?: number;
}

interface NotificationState {
  /** تعداد موارد نیازمند پیگیری (از داشبورد مدیریتی) */
  badge: number;
  /** تعداد اعلان‌های خوانده‌نشده‌ی کاربر جاری */
  unreadCount: number;
  /** اعلان‌های نیازمند پیگیری (بار، پیشنهاد، پشتیبانی، نظر) */
  dashboardItems: AdminNotificationItem[];
  /** اعلان‌های کاربر جاری */
  myAlerts: NotificationAlertDto[];
  myAlertsTotal: number;
  myAlertsTotalPages: number;
  summaryLoading: boolean;
  alertsLoading: boolean;
  error: string | null;
  loadSummary: () => Promise<void>;
  loadMyAlerts: (options?: LoadMyAlertsOptions) => Promise<void>;
  markRead: (alertId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  badge: 0,
  unreadCount: 0,
  dashboardItems: [],
  myAlerts: [],
  myAlertsTotal: 0,
  myAlertsTotalPages: 1,
  summaryLoading: false,
  alertsLoading: false,
  error: null,

  /** بارگذاری هم‌زمان بج داشبورد و شمار اعلان‌های خوانده‌نشده */
  loadSummary: async () => {
    set({ summaryLoading: true });
    try {
      const [dashboard, unread] = await Promise.allSettled([
        getAdminNotifications(),
        getMyUnreadNotificationCount(),
      ]);

      let badge = 0;
      let dashboardItems: AdminNotificationItem[] = [];
      let unreadCount = 0;

      if (dashboard.status === 'fulfilled' && dashboard.value.success && dashboard.value.data) {
        badge = dashboard.value.data.badge ?? 0;
        dashboardItems = dashboard.value.data.items ?? [];
      }

      if (unread.status === 'fulfilled' && unread.value.success) {
        unreadCount = typeof unread.value.data === 'number' ? unread.value.data : 0;
      }

      set({ badge, dashboardItems, unreadCount });
    } catch {
      // خطای شبکه نباید کل پنل را از کار بیندازد؛ فقط شمارنده صفر می‌شود.
      set({ badge: 0, dashboardItems: [], unreadCount: 0 });
    } finally {
      set({ summaryLoading: false });
    }
  },

  loadMyAlerts: async (options = {}) => {
    const { status = '', page = 1, pageSize = 20 } = options ?? {};
    set({ alertsLoading: true, error: null });
    try {
      const response = await getNotificationAlerts({ status, page, pageSize });
      if (response.success && response.data) {
        set({
          myAlerts: response.data.items ?? [],
          myAlertsTotal: response.data.totalCount ?? 0,
          myAlertsTotalPages: response.data.totalPages ?? 1,
        });
      }
    } catch (err: unknown) {
      set({ error: extractApiErrorMessage(err, 'خطا در دریافت اعلان‌ها') });
    } finally {
      set({ alertsLoading: false });
    }
  },

  /** علامت‌گذاری یک اعلان به‌عنوان خوانده‌شده (خوش‌بینانه + همگام با سرور) */
  markRead: async (alertId: string) => {
    const { myAlerts, unreadCount } = get();
    const target = myAlerts.find((item) => item.id === alertId);
    if (!target || target.readAtUtc) return;

    set({
      myAlerts: myAlerts.map((item) =>
        item.id === alertId ? { ...item, readAtUtc: new Date().toISOString() } : item
      ),
      unreadCount: Math.max(unreadCount - 1, 0),
    });

    try {
      await markNotificationReadByAdmin(alertId);
    } catch (err: unknown) {
      set({ error: extractApiErrorMessage(err, 'خطا در علامت‌گذاری اعلان') });
      await get().loadSummary();
    }
  },

  markAllRead: async () => {
    const { myAlerts } = get();
    const readAt = new Date().toISOString();
    set({
      myAlerts: myAlerts.map((item) => ({ ...item, readAtUtc: item.readAtUtc ?? readAt })),
      unreadCount: 0,
    });

    try {
      await markAllNotificationsReadByAdmin();
    } catch (err: unknown) {
      set({ error: extractApiErrorMessage(err, 'خطا در خواندن همه‌ی اعلان‌ها') });
      await get().loadSummary();
    }
  },

  clearError: () => set({ error: null }),
}));

/** polling دوره‌ای وضعیت اعلان‌ها — یک‌بار در هر صفحه mount می‌شود */
export function useNotificationPolling(intervalMs: number = NOTIFICATION_POLL_INTERVAL_MS) {
  const loadSummary = useNotificationStore((state) => state.loadSummary);

  useEffect(() => {
    loadSummary();
    const timer = window.setInterval(() => {
      loadSummary();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [loadSummary, intervalMs]);
}
