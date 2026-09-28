export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T | null;
  errors?: string[];
  traceId?: string;
  timestamp?: string;
  meta?: PaginationMeta | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AuthData {
  userId: string;
  userName: string;
  phoneNumber: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  issuedAt: string;
  roles: string[];
  requiresRegistration: boolean;
  permissions?: string[];
  userTypeId?: string;
  userTypeName?: string;
  panelRoute?: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  issuedAt: string;
}

export interface UserProfile {
  userId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  createdAt: string;
  userTypeId?: string;
  userTypeName?: string;
  panelRoute?: string;
}

export interface UserResponseDto {
  userId: string;
  userName: string;
  fullName: string;
  phoneNumber: string;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  livingProvince: string;
  livingCity: string;
  livingAddress: string;
  livingLatitude: number;
  livingLongitude: number;
  vehicleType: string;
  vehicleSubType: string;
  isActive: boolean;
  createdDate: string;
  lastLoginDate: string;
  roles: string[];
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  livingProvince?: string;
  livingCity?: string;
  livingAddress?: string;
  livingLatitude?: number;
  livingLongitude?: number;
  vehicleType?: string;
  vehicleSubType?: string;
  timeZone?: string;
  preferredLanguage?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Admin User Management Types
export interface AdminUserDto {
  userId: string;
  userName: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  isDeleted: boolean;
  isLockedOut?: boolean;
  roles: string[];
  createdDate: string;
  lastLoginDate: string;
  userTypeId?: string;
  userTypeName?: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  isSystemRole?: boolean;
  isActive?: boolean;
  createdDate?: string;
  permissions?: string[];
}

export interface RoleDetailDto {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  permissionsList?: PermissionDto[];
  isSystemRole?: boolean;
  isActive?: boolean;
  createdDate?: string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  isSystemRole?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name: string;
  description: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface PermissionDto {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemPermission?: boolean;
  isActive?: boolean;
  createdDate?: string;
}

export interface CreatePermissionDto {
  name: string;
  description: string;
  category: string;
  isSystemPermission?: boolean;
}

export interface UpdatePermissionDto {
  name: string;
  description: string;
  category: string;
  isActive?: boolean;
}

export interface CreateUserDto {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles?: string[];
}

export interface EditUserDto {
  userName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
  userTypeId?: string;
  vehicleType?: string;
  vehicleSubType?: string;
  preferredLanguage?: string;
  timeZone?: string;
}

export interface LockUserRequestDto {
  durationDays: number;
  reason?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  livingProvince: string;
  livingCity: string;
  livingAddress?: string;
  livingLatitude?: number;
  livingLongitude?: number;
  vehicleType?: string;
  vehicleSubType?: string;
  userTypeId?: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  otpCode: string;
  newPassword: string;
}

export interface DecodedToken {
  userId: string;
  userName: string;
  fullName: string;
  roles: string[];
  exp: number;
  iat: number;
}

export interface ProvinceDto {
  id: string;
  name: string;
}

export interface CityDto {
  id: string;
  name: string;
  cityName: string;
  provinceId: string;
  latitude?: number;
  longitude?: number;
}

export interface VehicleTypeDto {
  id: string;
  name: string;
  icon?: string;
  maxLoadCapacity: number;
  description?: string;
  isActive?: boolean;
  subTypes?: VehicleSubTypeDto[];
}

export interface VehicleSubTypeDto {
  id: string;
  name: string;
  vehicleTypeId: string;
  vehicleTypeName?: string;
  description?: string;
  maxLoadCapacity?: number;
  displayOrder?: number;
  isActive?: boolean;
}

// Cargo Types
export type CargoStatus =
  | 4   // Published
  | 5   // Rejected
  | 6   // Cancelled
  | 7   // Expired
  | 8   // Completed
  | 9   // InProgress
  | 10  // Edited
  | 11; // Unpublished

export type FreightCastType = 'PerTon' | 'TotalLoad' | 'Negotiable' | 'PerKilometer' | 'Fixed';

export type CargoStatusName =
  | 'Published'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired'
  | 'Completed'
  | 'InProgress'
  | 'Edited'
  | 'Unpublished';

export type CargoWeightUnit = 'Ton' | 'Kilometer';

export type CurrencyType = 'Toman' | 'Rial';

export interface CargoLoadDto {
  cargoLoadID: string;
  ownerUserID: string;
  originProvince: string;
  originCity: string;
  originAddress: string;
  originLatitude: number;
  originLongitude: number;
  destinationProvince: string;
  destinationCity: string;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  cargoTypeID: string;
  cargoWeight: number;
  cargoWeightUnit: CargoWeightUnit;
  cargoVolume: number;
  cargoDescription: string;
  packagingType: string;
  vehicleType: string;
  vehicleSubType: string;
  vehicleSpecialRequirements: string;
  freightCastType: FreightCastType;
  freightCastTypeCode?: number;
  freightCastTypeKey?: string;
  freightCastTypeLabel?: string;
  freightCast: number;
  freightAmount?: number;
  currency: CurrencyType;
  currencyLabel?: string;
  freightDisplayText?: string;
  isNegotiableFreight?: boolean;
  loadingDate: string;
  loadingTime: string;
  loadingDateEnd: string;
  loadingInstructions: string;
  contactPhoneNumber: string;
  displayPhoneNumber: boolean;
  receiveSMS: boolean;
  contactPersonName: string;
  status: CargoStatus;
  statusNote: string;
  rejectionReason: string;
  isDraft: boolean;
  publishedDate: string;
  expiryDate: string;
  isActive: boolean;
  viewCount: number;
  interestedDriversCount: number;
  isUrgent: boolean;
  requiresInsurance: boolean;
  requiresPermit: boolean;
  referenceNumber: string;
  createdDate: string;
  modifiedDate: string;
}

export interface CreateCargoLoadDto {
  originProvince: string;
  originCity: string;
  originAddress?: string;
  originFullAddress?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationProvince: string;
  destinationCity: string;
  destinationAddress?: string;
  destinationFullAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  cargoTypeID: string;
  cargoWeight: number;
  cargoWeightUnit?: CargoWeightUnit;
  cargoVolume?: number;
  cargoDescription?: string;
  packagingType?: string;
  vehicleType: string;
  vehicleSubType: string;
  vehicleSpecialRequirements?: string;
  freightCastType: FreightCastType;
  freight?: number;
  currency?: CurrencyType;
  loadingDate?: string;
  loadingTime?: string;
  loadingDateEnd?: string;
  loadingInstructions?: string;
  contactPhoneNumber: string;
  displayPhoneNumber?: boolean;
  receiveSMS?: boolean;
  contactPersonName?: string;
  isDraft?: boolean;
  expiryDate?: string;
  isUrgent?: boolean;
  requiresInsurance?: boolean;
  requiresPermit?: boolean;
  referenceNumber?: string;
}

export interface UpdateCargoLoadDto {
  originProvince?: string;
  originCity?: string;
  originAddress?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationProvince?: string;
  destinationCity?: string;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  cargoTypeID?: string;
  cargoWeight?: number;
  cargoWeightUnit?: CargoWeightUnit;
  cargoVolume?: number;
  cargoDescription?: string;
  packagingType?: string;
  vehicleType?: string;
  vehicleSubType?: string;
  vehicleSpecialRequirements?: string;
  freightCastType?: FreightCastType;
  freight?: number;
  currency?: CurrencyType;
  loadingDate?: string;
  loadingTime?: string;
  loadingDateEnd?: string;
  loadingInstructions?: string;
  contactPhoneNumber?: string;
  displayPhoneNumber?: boolean;
  receiveSMS?: boolean;
  contactPersonName?: string;
  isDraft?: boolean;
  expiryDate?: string;
  isUrgent?: boolean;
  requiresInsurance?: boolean;
  requiresPermit?: boolean;
  referenceNumber?: string;
}

export interface CargoTypeDto {
  cargoTypeID: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CargoStatusUpdateDto {
  status: CargoStatus | CargoStatusName;
  reason?: string;
}

export interface CargoStatusRequestDto {
  statuses: (CargoStatus | CargoStatusName)[];
}

export interface CargoLoadDtoPagedResult {
  items: CargoLoadDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CargoApprovalResponseDto {
  cargoLoadID: string;
  referenceNumber: string | null;
  status: CargoStatus;
  statusNote: string | null;
  rejectionReason: string | null;
  rejectedBy: string | null;
  rejectedDate: string | null;
  modifiedDate: string;
  ownerName: string | null;
  cargoTypeName: string | null;
}

export interface CargoStatusCountDto {
  draft: number;
  underReview: number;
  approved: number;
  rejected: number;
  published: number;
  cancelled: number;
  expired: number;
  completed: number;
}

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ReviewerDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ReviewAdminDto {
  id: string;
  reviewer: ReviewerDto | null;
  rating: number;
  comment: string | null;
  createdDate: string;
  ownerUserId: string;
  ownerFullName: string;
  status: ReviewStatus;
  reviewDate: string | null;
}

export interface ReviewAdminDtoPagedResult {
  items: ReviewAdminDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
