import { create } from 'zustand';
import { AuthData, LoginRequest, RegisterRequest } from '@/app/types/api';
import { login as apiLogin, register as apiRegister, storeTokens, clearTokens, logoutServer, getStoredRefreshToken } from '@/app/lib/api';
import { extractApiErrorMessage, translateBackendError } from '@/app/lib/admin-user-errors';

interface AuthState {
  user: AuthData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthData | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiLogin(credentials);
      if (response.success && response.data) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
        set({ user: response.data, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: response.message ? translateBackendError(response.message) : 'ورود ناموفق بود', isLoading: false });
      return false;
    } catch (err: unknown) {
      const error = err as { status?: number };
      // بک‌اند مرجع نهایی است: 401 = اعتبارنامه/حساب نامعتبر، 403 = حساب فاقد رول مجاز پنل
      const fallback =
        error.status === 403
          ? 'حساب شما اجازهٔ ورود به پنل ادمین را ندارد.'
          : error.status === 401
            ? 'نام کاربری یا رمز عبور اشتباه است.'
            : 'خطا در اتصال به سرور';
      set({
        // خطای «Account is not active...» (کاربر IsActive=false) به «در انتظار تایید ادمین» ترجمه می‌شود
        error: extractApiErrorMessage(err, fallback),
        isLoading: false,
      });
      return false;
    }
  },

  register: async (data: RegisterRequest): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRegister(data);
      if (response.success && response.data) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
        set({ user: response.data, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: response.message ? translateBackendError(response.message) : 'ثبت‌نام ناموفق بود', isLoading: false });
      return false;
    } catch (err: unknown) {
      set({
        error: extractApiErrorMessage(err, 'خطا در اتصال به سرور'),
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await logoutServer(refreshToken);
      } catch {
        // Ignore server errors - still clear local state
      }
    }
    clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
