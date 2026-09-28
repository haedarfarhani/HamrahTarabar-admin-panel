import { create } from 'zustand';
import { AuthData, LoginRequest, RegisterRequest } from '@/app/types/api';
import { login as apiLogin, register as apiRegister, storeTokens, clearTokens, logoutServer, getStoredRefreshToken } from '@/app/lib/api';

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
      set({ error: response.message || 'ورود ناموفق بود', isLoading: false });
      return false;
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      set({
        error: error.errors?.[0] || error.message || 'خطا در اتصال به سرور',
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
      set({ error: response.message || 'ثبت‌نام ناموفق بود', isLoading: false });
      return false;
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      set({
        error: error.errors?.[0] || error.message || 'خطا در اتصال به سرور',
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
