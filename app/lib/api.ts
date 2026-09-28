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
  Published: 4,
  Rejected: 5,
  Cancelled: 6,
  Expired: 7,
  Completed: 8,
  InProgress: 9,
  Edited: 10,
  Unpublished: 11,
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

export async function getCargosByStatus(
  statuses: CargoStatus[],
  page: number = 1,
  pageSize: number = 100
): Promise<ApiResponse<CargoLoadDtoPagedResult>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  return apiAuthRequest<CargoLoadDtoPagedResult>(`/cargos/by-status?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify({ statuses }),
  });
}

export async function getCargosByStatusNames(
  statuses: CargoStatusName[],
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<CargoLoadDtoPagedResult>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  return apiAuthRequest<CargoLoadDtoPagedResult>(`/cargos/by-status?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify({ statuses: statuses.map(toCargoStatusValue) }),
  });
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
