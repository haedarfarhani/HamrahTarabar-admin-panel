import { ApiResponse, LoginRequest, RegisterRequest, AuthData, TokenData, UserProfile, UserResponseDto, UpdateProfileDto, ChangePasswordDto, ProvinceDto, CityDto, VehicleTypeDto, CargoLoadDto, CreateCargoLoadDto, UpdateCargoLoadDto, CargoTypeDto, CargoStatusUpdateDto, AdminUserDto, RoleDto, RoleDetailDto, CreateRoleDto, UpdateRoleDto, PermissionDto, CreatePermissionDto, UpdatePermissionDto, CreateUserDto, EditUserDto, LockUserRequestDto, CargoLoadDtoPagedResult, CargoApprovalResponseDto, CargoStatus, CargoStatusCountDto, CargoStatusName, ReviewStatus, ReviewAdminDto, ReviewAdminDtoPagedResult } from '@/app/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5007';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || '1';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/api/v${API_VERSION}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: ApiResponse<T>;

  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    data = text ? JSON.parse(text) : { success: response.ok, data: null };
  } else {
    data = { success: response.ok, data: null, message: response.statusText };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      ...data,
    };
  }

  return data;
}

async function apiAuthRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v${API_VERSION}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: ApiResponse<T>;

  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    data = text ? JSON.parse(text) : { success: response.ok, data: null };
  } else {
    data = { success: response.ok, data: null, message: response.statusText };
  }

  if (response.status === 401 && !isRetry) {
    const refreshSuccess = await tryRefreshToken();
    if (refreshSuccess) {
      return apiAuthRequest<T>(endpoint, options, true);
    }
    clearTokens();
    window.location.href = '/login';
    throw { status: 401, ...data };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      ...data,
    };
  }

  return data;
}

async function tryRefreshToken(): Promise<boolean> {
  const storedRefreshToken = getStoredRefreshToken();
  if (!storedRefreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v${API_VERSION}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!response.ok) return false;

    const result = await response.json();
    if (result.success && result.data) {
      storeTokens(result.data.accessToken, result.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Auth APIs
export async function login(credentials: LoginRequest): Promise<ApiResponse<AuthData>> {
  return apiRequest<AuthData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(userData: RegisterRequest): Promise<ApiResponse<AuthData>> {
  return apiRequest<AuthData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function refreshToken(refreshToken: string): Promise<ApiResponse<TokenData>> {
  return apiRequest<TokenData>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutServer(refreshToken: string): Promise<ApiResponse<null>> {
  return apiRequest<null>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function forgotPassword(phoneNumber: string): Promise<ApiResponse<null>> {
  return apiRequest<null>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}

export async function resetPassword(data: { phoneNumber: string; otpCode: string; newPassword: string }): Promise<ApiResponse<null>> {
  return apiRequest<null>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<ApiResponse<UserProfile>> {
  return apiRequest<UserProfile>('/auth/me', {
    method: 'GET',
  });
}

// Token helpers
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
}

// User APIs
export async function getCurrentUser(): Promise<ApiResponse<UserResponseDto>> {
  return apiAuthRequest<UserResponseDto>('/Users/current');
}

export async function updateProfile(data: UpdateProfileDto): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>('/Users/current', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: ChangePasswordDto): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>('/Users/current/password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Regular User Management APIs
export async function getAllUsers(): Promise<ApiResponse<AdminUserDto[]>> {
  return apiAuthRequest<AdminUserDto[]>('/Users');
}

export async function getUserById(userId: string): Promise<ApiResponse<UserResponseDto>> {
  return apiAuthRequest<UserResponseDto>(`/Users/${userId}`);
}

export async function createUser(data: CreateUserDto): Promise<ApiResponse<AdminUserDto>> {
  return apiAuthRequest<AdminUserDto>('/Users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(userId: string, data: EditUserDto): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}`, {
    method: 'DELETE',
  });
}

export async function activateUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}/activate`, {
    method: 'PATCH',
  });
}

export async function deactivateUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}/deactivate`, {
    method: 'PATCH',
  });
}

export async function lockUser(userId: string, durationDays: number, reason?: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}/lock`, {
    method: 'PATCH',
    body: JSON.stringify({ durationDays, reason }),
  });
}

export async function unlockUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}/unlock`, {
    method: 'PATCH',
  });
}

export async function blockUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}/block`, {
    method: 'PATCH',
  });
}

export async function unblockUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Users/${userId}/unblock`, {
    method: 'PATCH',
  });
}

// Admin Users APIs
export async function getAdminUsers(): Promise<ApiResponse<AdminUserDto[]>> {
  return apiAuthRequest<AdminUserDto[]>('/AdminUsers');
}

export async function deleteAdminUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/AdminUsers/${userId}`, {
    method: 'DELETE',
  });
}

export async function activateAdminUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/AdminUsers/${userId}/activate`, {
    method: 'PATCH',
  });
}

export async function deactivateAdminUser(userId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/AdminUsers/${userId}/deactivate`, {
    method: 'PATCH',
  });
}

export async function addUserRole(userId: string, roleId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/AdminUsers/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleId }),
  });
}

export async function removeUserRole(userId: string, roleId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/AdminUsers/${userId}/roles/${roleId}`, {
    method: 'DELETE',
  });
}

// Roles APIs
export async function getRoles(): Promise<ApiResponse<RoleDto[]>> {
  return apiAuthRequest<RoleDto[]>('/Roles');
}

export async function getRoleById(roleId: string): Promise<ApiResponse<RoleDetailDto>> {
  return apiAuthRequest<RoleDetailDto>(`/Roles/${roleId}`);
}

export async function createRole(data: CreateRoleDto): Promise<ApiResponse<RoleDto>> {
  return apiAuthRequest<RoleDto>('/Roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(roleId: string, data: UpdateRoleDto): Promise<ApiResponse<RoleDto>> {
  return apiAuthRequest<RoleDto>(`/Roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRole(roleId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Roles/${roleId}`, {
    method: 'DELETE',
  });
}

export async function addRolePermission(roleId: string, permissionId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Roles/${roleId}/permissions/${permissionId}`, {
    method: 'POST',
  });
}

export async function removeRolePermission(roleId: string, permissionId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Roles/${roleId}/permissions/${permissionId}`, {
    method: 'DELETE',
  });
}

export async function getRolePermissions(roleId: string): Promise<ApiResponse<PermissionDto[]>> {
  return apiAuthRequest<PermissionDto[]>(`/Roles/${roleId}/permissions`);
}

// Permissions APIs
export async function getPermissions(): Promise<ApiResponse<PermissionDto[]>> {
  return apiAuthRequest<PermissionDto[]>('/Permissions');
}

export async function getPermissionsByCategory(): Promise<ApiResponse<PermissionDto[]>> {
  return apiAuthRequest<PermissionDto[]>('/Permissions/by-category');
}

export async function getPermissionById(permissionId: string): Promise<ApiResponse<PermissionDto>> {
  return apiAuthRequest<PermissionDto>(`/Permissions/${permissionId}`);
}

export async function createPermission(data: CreatePermissionDto): Promise<ApiResponse<PermissionDto>> {
  return apiAuthRequest<PermissionDto>('/Permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePermission(permissionId: string, data: UpdatePermissionDto): Promise<ApiResponse<PermissionDto>> {
  return apiAuthRequest<PermissionDto>(`/Permissions/${permissionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePermission(permissionId: string): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/Permissions/${permissionId}`, {
    method: 'DELETE',
  });
}

const CARGO_STATUS_VALUES: Record<CargoStatusName, number> = {
  PendingReview: 2,
  Published: 4,
  Rejected: 5,
  Cancelled: 6,
  Expired: 7,
  Completed: 8,
  Unpublished: 11,
  SoftDeleted: 12,
};

const toCargoStatusValue = (status: CargoStatus | CargoStatusName): number =>
  typeof status === 'number' ? status : CARGO_STATUS_VALUES[status];

// Cargo APIs
export async function getAllCargos(): Promise<ApiResponse<CargoLoadDto[]>> {
  return apiAuthRequest<CargoLoadDto[]>('/cargos');
}

export async function getStatusCounts(): Promise<ApiResponse<CargoStatusCountDto>> {
  return apiAuthRequest<CargoStatusCountDto>('/cargos/status-counts');
}

async function getCargosPagedByStatus(
  statuses: number[],
  page: number,
  pageSize: number
): Promise<ApiResponse<CargoLoadDtoPagedResult>> {
  const response = await apiAuthRequest<CargoLoadDto[]>('/cargos');
  const wanted = new Set(statuses);
  const filtered = (response.data ?? []).filter((item) => wanted.has(item.status) && item.status !== 12);
  const safePage = page < 1 ? 1 : page;
  const safeSize = pageSize < 1 ? 20 : pageSize;
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safeSize));
  const start = (safePage - 1) * safeSize;

  return {
    success: response.success,
    message: response.message,
    errors: response.errors,
    data: {
      items: filtered.slice(start, start + safeSize),
      totalCount,
      page: safePage,
      pageSize: safeSize,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
  };
}

export interface AdminCargoFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  statuses?: number[];
  originProvince?: string;
  destinationProvince?: string;
  vehicleType?: string;
  cargoTypeId?: string;
  isUrgent?: boolean;
  freightCastType?: string;
  loadingFrom?: string;
  loadingTo?: string;
  minWeight?: string;
  maxWeight?: string;
}

export async function searchAdminCargos(
  filters: AdminCargoFilters
): Promise<ApiResponse<CargoLoadDtoPagedResult>> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(filters.pageSize ?? 20));
  if (filters.search) params.set('search', filters.search);
  filters.statuses?.forEach((status) => params.append('statuses', String(status)));
  if (filters.originProvince) params.set('originProvince', filters.originProvince);
  if (filters.destinationProvince) params.set('destinationProvince', filters.destinationProvince);
  if (filters.vehicleType) params.set('vehicleType', filters.vehicleType);
  if (filters.cargoTypeId) params.set('cargoTypeId', filters.cargoTypeId);
  if (filters.isUrgent !== undefined) params.set('isUrgent', String(filters.isUrgent));
  if (filters.freightCastType) params.set('freightCastType', filters.freightCastType);
  if (filters.loadingFrom) params.set('loadingFrom', filters.loadingFrom);
  if (filters.loadingTo) params.set('loadingTo', filters.loadingTo);
  if (filters.minWeight) params.set('minWeight', filters.minWeight);
  if (filters.maxWeight) params.set('maxWeight', filters.maxWeight);
  return apiAuthRequest<CargoLoadDtoPagedResult>(`/cargos/admin?${params.toString()}`);
}

export async function getCargosByStatus(
  statuses: CargoStatus[],
  page: number = 1,
  pageSize: number = 100
): Promise<ApiResponse<CargoLoadDtoPagedResult>> {
  return getCargosPagedByStatus(statuses, page, pageSize);
}

export async function getCargosByStatusNames(
  statuses: CargoStatusName[],
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<CargoLoadDtoPagedResult>> {
  return getCargosPagedByStatus(statuses.map(toCargoStatusValue), page, pageSize);
}

export async function getCargoById(id: string): Promise<ApiResponse<CargoLoadDto>> {
  return apiRequest<CargoLoadDto>(`/cargos/${id}`);
}

export async function createCargo(data: CreateCargoLoadDto): Promise<ApiResponse<CargoLoadDto>> {
  return apiAuthRequest<CargoLoadDto>('/cargos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCargo(id: string, data: UpdateCargoLoadDto): Promise<ApiResponse<CargoLoadDto>> {
  return apiAuthRequest<CargoLoadDto>(`/cargos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCargo(id: string): Promise<ApiResponse<null>> {
  return apiAuthRequest<null>(`/cargos/${id}`, {
    method: 'DELETE',
  });
}

export async function getCargoTypes(): Promise<ApiResponse<CargoTypeDto[]>> {
  return apiRequest<CargoTypeDto[]>('/cargos/cargo-types');
}

export async function updateCargoStatus(id: string, data: CargoStatusUpdateDto): Promise<ApiResponse<string>> {
  return apiAuthRequest<string>(`/cargos/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, status: toCargoStatusValue(data.status) }),
  });
}

// Cargo Approval APIs
export async function getPendingCargos(): Promise<ApiResponse<CargoApprovalResponseDto[]>> {
  return apiAuthRequest<CargoApprovalResponseDto[]>('/CargoApproval/pending');
}

export async function approveCargo(id: string): Promise<ApiResponse<CargoApprovalResponseDto>> {
  return apiAuthRequest<CargoApprovalResponseDto>(`/CargoApproval/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectCargo(id: string, reason?: string): Promise<ApiResponse<CargoApprovalResponseDto>> {
  return apiAuthRequest<CargoApprovalResponseDto>(`/CargoApproval/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || null }),
  });
}

// Review APIs
export async function getReviews(
  status?: ReviewStatus,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<ReviewAdminDtoPagedResult>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (status) params.set('status', status);
  return apiAuthRequest<ReviewAdminDtoPagedResult>(`/reviews?${params.toString()}`);
}

export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<ApiResponse<ReviewAdminDto>> {
  const statusValue = status === 'Approved' ? 2 : status === 'Rejected' ? 3 : 1;
  return apiAuthRequest<ReviewAdminDto>(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: statusValue }),
  });
}

// Vehicle APIs
export async function getVehicleTypes(): Promise<ApiResponse<VehicleTypeDto[]>> {
  return apiRequest<VehicleTypeDto[]>('/vehicle-types');
}

export async function getProvinces(): Promise<ApiResponse<ProvinceDto[]>> {
  return apiRequest<ProvinceDto[]>('/provinces');
}

export async function getCitiesByProvince(provinceId: string): Promise<ApiResponse<CityDto[]>> {
  return apiRequest<CityDto[]>(`/provinces/${provinceId}/cities`);
}

export interface SupportConversation {
  id: string;
  userId: string;
  userFullName: string;
  userPhone?: string | null;
  userKind: number;
  userKindLabel: string;
  status: number;
  statusLabel: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdDate: string;
  unreadCount: number;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderKind: number;
  senderName: string;
  text: string;
  sentAt: string;
  isRead: boolean;
}

export interface SupportPage {
  items: SupportConversation[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function getSupportQueue(params: {
  status?: number;
  userKind?: number;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
}): Promise<ApiResponse<SupportPage>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', String(params.status));
  if (params.userKind) query.set('userKind', String(params.userKind));
  if (params.search) query.set('search', params.search);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', '30');
  return apiAuthRequest<SupportPage>(`/support/conversations/queue?${query.toString()}`);
}

export async function getSupportQueueCount(): Promise<ApiResponse<{ count: number }>> {
  return apiAuthRequest<{ count: number }>('/support/conversations/queue-count');
}

export async function getSupportMessages(id: string): Promise<ApiResponse<SupportMessage[]>> {
  return apiAuthRequest<SupportMessage[]>(`/support/conversations/${id}/messages`);
}

export async function sendSupportMessage(id: string, text: string): Promise<ApiResponse<SupportMessage>> {
  return apiAuthRequest<SupportMessage>(`/support/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function markSupportRead(id: string): Promise<ApiResponse<{ count: number }>> {
  return apiAuthRequest<{ count: number }>(`/support/conversations/${id}/read`, { method: 'POST' });
}

export async function assignSupportToMe(id: string): Promise<ApiResponse<SupportConversation>> {
  return apiAuthRequest<SupportConversation>(`/support/conversations/${id}/assign`, { method: 'POST' });
}

export async function updateSupportStatus(id: string, status: number): Promise<ApiResponse<SupportConversation>> {
  return apiAuthRequest<SupportConversation>(`/support/conversations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export interface DashboardKpis {
  pendingReview: number;
  published: number;
  completed: number;
  rejected: number;
  cancelled: number;
  expired: number;
  unpublished: number;
  urgentPublished: number;
  cargosToday: number;
  requestsToday: number;
  pendingRequests: number;
  acceptedRequests: number;
  callsToday: number;
  callsTotal: number;
  openSupport: number;
  unreadSupport: number;
  drivers: number;
  loadOwners: number;
  pendingReviews: number;
  reviewsToday: number;
  averageRating: number;
}

export interface DashboardDay {
  date: string;
  cargos: number;
  requests: number;
  calls: number;
}

export interface DashboardNameCount {
  key: string;
  label: string;
  count: number;
}

export interface DashboardLane {
  origin: string;
  destination: string;
  count: number;
}

export interface DashboardCargoItem {
  id: string;
  referenceNumber?: string | null;
  originCity: string;
  originProvince: string;
  destinationCity: string;
  destinationProvince: string;
  vehicleType: string;
  ownerName: string;
  isUrgent: boolean;
  createdAt: string;
  loadingDate?: string | null;
}

export interface DashboardRequestItem {
  id: string;
  cargoId: string;
  driverName: string;
  originCity: string;
  destinationCity: string;
  referenceNumber?: string | null;
  amount?: number | null;
  createdAt: string;
}

export interface DashboardSupportItem {
  id: string;
  userName: string;
  userKind: number;
  status: number;
  lastMessage?: string | null;
  at: string;
  unread: number;
}

export interface DashboardReviewItem {
  id: string;
  ownerName: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  status: number;
  createdAt: string;
}

export interface AdminDashboard {
  generatedAt: string;
  kpis: DashboardKpis;
  activity: DashboardDay[];
  statuses: DashboardNameCount[];
  lanes: DashboardLane[];
  pendingCargos: DashboardCargoItem[];
  urgentCargos: DashboardCargoItem[];
  pendingRequests: DashboardRequestItem[];
  supportQueue: DashboardSupportItem[];
  recentReviews: DashboardReviewItem[];
}

export interface AdminNotificationItem {
  id: string;
  kind: 'cargo' | 'request' | 'support' | 'review' | string;
  title: string;
  body: string;
  href: string;
  at: string;
}

export interface AdminNotifications {
  badge: number;
  items: AdminNotificationItem[];
}

export async function getAdminDashboard(): Promise<ApiResponse<AdminDashboard>> {
  return apiAuthRequest<AdminDashboard>('/admin/dashboard');
}

export async function getAdminNotifications(): Promise<ApiResponse<AdminNotifications>> {
  return apiAuthRequest<AdminNotifications>('/admin/dashboard/notifications');
}

export function supportWebSocketUrl(): string | null {
  const token = getStoredToken();
  if (!token) return null;
  const httpBase = API_BASE_URL.replace(/\/$/, '');
  const wsBase = httpBase.replace(/^http/, 'ws');
  return `${wsBase}/api/v${API_VERSION}/support/ws?access_token=${encodeURIComponent(token)}`;
}
