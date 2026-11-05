'use client';

import { useState, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
  Skeleton,
  LinearProgress,
  alpha,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as ActivateIcon,
  PersonOff as DeactivateIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  ManageAccounts as RolesIcon,
  Lock as LockIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  FilterAltOff as ClearFilterIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import RegisterUserModal from '@/app/components/admin/RegisterUserModal';
import {
  getAllUsers,
  deleteUser,
  activateUser,
  deactivateUser,
  lockUser,
  blockUser,
  getRoles,
  getUserTypes,
  addUserRole,
  removeUserRole,
  updateUser,
} from '@/app/lib/api';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';
import { AdminUserDto, RoleDto, UsersQueryParams, UsersSortBy, UserTypeDto, EditUserDto } from '@/app/types/api';
import { toUserTypeOptions, FALLBACK_USER_TYPES, UserTypeOption } from '@/app/lib/user-types';

type StatusFilter = 'all' | 'active' | 'pending' | 'locked' | 'banned';
type SortField = 'userName' | 'createdDate' | 'lastLoginDate';
type SortDir = 'asc' | 'desc';
type StatusTone = 'success' | 'warning' | 'info' | 'error' | 'default';

interface UserSort {
  field: SortField;
  sort: SortDir;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'همه وضعیت‌ها' },
  { value: 'active', label: 'فعال' },
  { value: 'pending', label: 'در انتظار تایید' },
  { value: 'locked', label: 'قفل‌شده' },
  { value: 'banned', label: 'بن‌شده' },
];

/** نگاشت فیلد ستون به sortBy بک‌اند */
const SORT_FIELD_MAP: Record<SortField, UsersSortBy> = {
  userName: 'username',
  createdDate: 'createdDate',
  lastLoginDate: 'lastLogin',
};

const DEFAULT_SORT: UserSort = { field: 'createdDate', sort: 'desc' };
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const AVATAR_GRADIENTS: [string, string][] = [
  ['#6366f1', '#4338ca'],
  ['#0ea5e9', '#0369a1'],
  ['#10b981', '#047857'],
  ['#f59e0b', '#b45309'],
  ['#ec4899', '#be185d'],
  ['#8b5cf6', '#6d28d9'],
  ['#14b8a6', '#0f766e'],
  ['#ef4444', '#b91c1c'],
];

const faNum = (value: number) => value.toLocaleString('fa-IR');

function avatarColors(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function userInitials(user: AdminUserDto): string {
  const parts = (user.fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    return `${parts[0].charAt(0)}${parts[1]?.charAt(0) ?? ''}`;
  }
  return user.userName?.charAt(0)?.toUpperCase() ?? '?';
}

function getStatusMeta(user: AdminUserDto): { label: string; tone: StatusTone } {
  if (user.isDeleted) return { label: 'حذف‌شده', tone: 'default' };
  if (user.isBlocked) return { label: 'بن‌شده', tone: 'error' };
  if (user.isLockedOut) return { label: 'قفل موقت', tone: 'warning' };
  if (!user.isActive) return { label: 'در انتظار تایید', tone: 'info' };
  return { label: 'فعال', tone: 'success' };
}

function toIsoStartOfDay(value: Dayjs | null): string | undefined {
  return value ? value.startOf('day').toISOString() : undefined;
}

function toIsoEndOfDay(value: Dayjs | null): string | undefined {
  return value ? value.endOf('day').toISOString() : undefined;
}

const formatFaDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('fa-IR') : '-';

/** بج وضعیت با نقطه‌ی رنگی — سبک‌تر و مدرن‌تر از Chip پیش‌فرض */
function StatusPill({ user }: { user: AdminUserDto }) {
  const theme = useTheme();
  const { label, tone } = getStatusMeta(user);
  const main = tone === 'default' ? theme.palette.text.secondary : theme.palette[tone].main;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.1,
        py: 0.35,
        borderRadius: 999,
        bgcolor: alpha(main, 0.12),
        border: `1px solid ${alpha(main, 0.2)}`,
        color: main,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: main,
          boxShadow: `0 0 0 3px ${alpha(main, 0.18)}`,
        }}
      />
      {label}
    </Box>
  );
}

function UserAvatar({ user, size = 42 }: { user: AdminUserDto; size?: number }) {
  const [from, to] = avatarColors(user.userId || user.userName || 'user');
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        fontWeight: 800,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 4px 10px ${alpha(from, 0.35)}`,
      }}
    >
      {userInitials(user)}
    </Avatar>
  );
}

interface UserActionsProps {
  user: AdminUserDto;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onMenu: (event: ReactMouseEvent<HTMLElement>) => void;
}

function UserActions({ user, busy, onView, onEdit, onToggleActive, onMenu }: UserActionsProps) {
  const theme = useTheme();
  const iconSx = {
    color: 'text.secondary',
    transition: 'all 0.15s ease',
    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' },
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Tooltip title="مشاهده جزئیات">
        <IconButton
          size="small"
          aria-label="مشاهده جزئیات"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
          sx={iconSx}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="ویرایش کاربر">
        <IconButton
          size="small"
          aria-label="ویرایش کاربر"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          sx={iconSx}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}>
        <span>
          <IconButton
            size="small"
            aria-label={user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
            disabled={busy}
            onClick={(event) => {
              event.stopPropagation();
              onToggleActive();
            }}
            sx={{
              color: user.isActive ? 'warning.main' : 'success.main',
              '&:hover': {
                bgcolor: alpha(user.isActive ? theme.palette.warning.main : theme.palette.success.main, 0.12),
              },
            }}
          >
            {user.isActive ? <DeactivateIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="عملیات بیشتر">
        <IconButton
          size="small"
          aria-label="عملیات بیشتر"
          onClick={(event) => {
            event.stopPropagation();
            onMenu(event);
          }}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function MobileMeta({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 10.5 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        dir={ltr ? 'ltr' : undefined}
        sx={{ fontWeight: 600, fontSize: 12.5, textAlign: ltr ? 'right' : 'inherit' }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function RegularUsersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ── Server-driven state ──
  const [page, setPage] = useState(1); // یک-مبنا برای API
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<UserSort>(DEFAULT_SORT);

  // ── Filters ──
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState('');
  const [userTypeId, setUserTypeId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createdFrom, setCreatedFrom] = useState<Dayjs | null>(null);
  const [createdTo, setCreatedTo] = useState<Dayjs | null>(null);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  // نوع‌های کاربری فیلتر از GET /api/v1/UserTypes (بدون هاردکد)
  const [userTypeOptions, setUserTypeOptions] = useState<UserTypeOption[]>(() =>
    toUserTypeOptions(FALLBACK_USER_TYPES)
  );

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // منوی عملیات ردیف
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuUser, setMenuUser] = useState<AdminUserDto | null>(null);

  // فرم ویرایش کامل — همه‌ی فیلدهای EditUserDto
  const [editForm, setEditForm] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    userTypeId: '',
    vehicleType: '',
    vehicleSubType: '',
    preferredLanguage: '',
    timeZone: '',
  });

  const showToast = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const fetchUsers = useCallback(async () => {
    try {
      setTableLoading(true);
      setError(null);
      const params: UsersQueryParams = {
        search: search || undefined,
        roleId: roleId || undefined,
        role: roleId ? roles.find((r) => r.id === roleId)?.name : undefined,
        userTypeId: userTypeId || undefined,
        page,
        pageSize,
        sortBy: SORT_FIELD_MAP[sort.field],
        sortDir: sort.sort,
        createdFrom: toIsoStartOfDay(createdFrom),
        createdTo: toIsoEndOfDay(createdTo),
      };
      // سلکت وضعیت → ترکیب isActive/isLockedOut/isBlocked
      if (statusFilter === 'active') params.isActive = true;
      else if (statusFilter === 'pending') params.isActive = false;
      else if (statusFilter === 'locked') params.isLockedOut = true;
      else if (statusFilter === 'banned') params.isBlocked = true;

      const res = await getAllUsers(params);
      if (res.success) {
        setUsers(res.data ?? []);
        setTotalCount(res.meta?.totalCount ?? res.data?.length ?? 0);
      }
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'خطا در دریافت لیست کاربران'));
    } finally {
      setTableLoading(false);
    }
  }, [page, pageSize, search, roleId, roles, userTypeId, statusFilter, createdFrom, createdTo, sort]);

  useEffect(() => {
    // واکشی لیست نقش‌ها و نوع‌های کاربری برای دراپ‌داون‌های فیلتر (یک‌بار)
    getRoles()
      .then((res) => {
        if (res.success && res.data) setRoles(res.data);
      })
      .catch(() => undefined);
    getUserTypes()
      .then((res) => {
        const live: UserTypeDto[] | undefined = res.success ? res.data ?? undefined : undefined;
        if (live && live.length > 0) setUserTypeOptions(toUserTypeOptions(live));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // واکشی صفحه‌ی جاری با فیلتر/سورت/صفحه‌بندی سمت‌سرور
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  // debounce جست‌وجو — مثل صفحه بارها
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  /** تغییر هر فیلتر → بازگشت به صفحه‌ی اول */
  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRoleId('');
    setUserTypeId('');
    setStatusFilter('all');
    setCreatedFrom(null);
    setCreatedTo(null);
    setSort(DEFAULT_SORT);
    setPage(1);
  };

  const activeFilterCount = [
    search.trim(),
    roleId,
    userTypeId,
    statusFilter !== 'all' ? statusFilter : '',
    createdFrom,
    createdTo,
  ].filter(Boolean).length;

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, sort: prev.sort === 'asc' ? 'desc' : 'asc' }
        : { field, sort: 'asc' }
    );
    setPage(1);
  };

  const openMenu = (event: ReactMouseEvent<HTMLElement>, user: AdminUserDto) => {
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const runMenuAction = (action: (user: AdminUserDto) => void) => {
    if (!menuUser) return;
    const target = menuUser;
    closeMenu();
    action(target);
  };

  /** باز کردن دیالوگ ویرایش کامل — PATCH /api/v1/Users/{userId} */
  const openEditDialog = (user: AdminUserDto) => {
    const parts = (user.fullName || '').split(' ');
    setSelectedUser(user);
    setEditForm({
      userName: user.userName || '',
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      phoneNumber: user.phoneNumber || '',
      userTypeId: user.userTypeId || '',
      // آیتم‌های لیست فیلد وسیله نقلیه ندارند؛ خالی می‌ماند مگر ادمین مقدار جدید بدهد
      vehicleType: '',
      vehicleSubType: '',
      preferredLanguage: '',
      timeZone: '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      showToast('نام و نام خانوادگی الزامی است', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const body: EditUserDto = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      };
      if (editForm.userName.trim()) body.userName = editForm.userName.trim();
      if (editForm.phoneNumber.trim()) body.phoneNumber = editForm.phoneNumber.trim();
      if (editForm.userTypeId) body.userTypeId = editForm.userTypeId;
      if (editForm.vehicleType.trim()) body.vehicleType = editForm.vehicleType.trim();
      if (editForm.vehicleSubType.trim()) body.vehicleSubType = editForm.vehicleSubType.trim();
      if (editForm.preferredLanguage.trim()) body.preferredLanguage = editForm.preferredLanguage.trim();
      if (editForm.timeZone.trim()) body.timeZone = editForm.timeZone.trim();
      const response = await updateUser(selectedUser.userId, body);
      if (response.success) {
        setEditDialogOpen(false);
        setSelectedUser(null);
        showToast('کاربر با موفقیت ویرایش شد', 'success');
        fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در ویرایش کاربر'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const response = await deleteUser(selectedUser.userId);
      if (response.success) {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        showToast('کاربر با موفقیت حذف شد', 'success');
        // اگر آخرین رکورد صفحه بود، به صفحه‌ی قبل برمی‌گردیم
        if (users.length <= 1 && page > 1) setPage(page - 1);
        else fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در حذف کاربر'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: AdminUserDto) => {
    setActionLoading(true);
    try {
      const response = user.isActive ? await deactivateUser(user.userId) : await activateUser(user.userId);
      if (response.success) {
        showToast(user.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد', 'success');
        fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در تغییر وضعیت'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async (user: AdminUserDto) => {
    const days = prompt('مدت زمان قفل (روز):', '1');
    if (!days) return;
    setActionLoading(true);
    try {
      const response = await lockUser(user.userId, Number(days));
      if (response.success) {
        showToast('کاربر قفل شد', 'success');
        fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در قفل کردن کاربر'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async (user: AdminUserDto) => {
    if (!confirm(`آیا از بلاک کردن کاربر ${user.userName} اطمینان دارید؟`)) return;
    setActionLoading(true);
    try {
      const response = await blockUser(user.userId);
      if (response.success) {
        showToast('کاربر بلاک شد', 'success');
        fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در بلاک کردن کاربر'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /** افزودن نقش — POST /api/v1/AdminUsers/{userId}/roles */
  const handleAddRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    setActionLoading(true);
    try {
      const response = await addUserRole(selectedUser.userId, selectedRoleId);
      if (response.success) {
        const addedRole = roles.find((r) => r.id === selectedRoleId);
        const nextRoles = [...(selectedUser.roles ?? []), addedRole?.name ?? ''];
        setSelectedUser({ ...selectedUser, roles: nextRoles });
        setSelectedRoleId('');
        showToast('نقش با موفقیت اضافه شد', 'success');
        fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در اضافه کردن نقش'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /** حذف نقش — DELETE /api/v1/AdminUsers/{userId}/roles/{roleId} */
  const handleRemoveRole = async (roleName: string) => {
    if (!selectedUser) return;
    const role = roles.find((r) => r.name === roleName);
    if (!role) return;
    setActionLoading(true);
    try {
      const response = await removeUserRole(selectedUser.userId, role.id);
      if (response.success) {
        setSelectedUser({ ...selectedUser, roles: (selectedUser.roles ?? []).filter((r) => r !== roleName) });
        showToast('نقش با موفقیت حذف شد', 'success');
        fetchUsers();
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در حذف نقش'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
    },
  };

  const sortDirection = (field: SortField): SortDir =>
    sort.field === field ? sort.sort : 'asc';

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  const emptyState = (
    <Box sx={{ textAlign: 'center', py: { xs: 6, md: 9 }, px: 3 }}>
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          mx: 'auto',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.info.main, 0.08),
          border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
        }}
      >
        <PeopleIcon sx={{ fontSize: 40, color: alpha(theme.palette.info.main, 0.55) }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
        کاربری یافت نشد
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75, mb: 2.5 }}>
        {activeFilterCount > 0
          ? 'با فیلترهای انتخاب‌شده نتیجه‌ای پیدا نشد؛ فیلترها را پاک کنید.'
          : 'هنوز کاربری ثبت نشده است. با دکمه «کاربر جدید» شروع کنید.'}
      </Typography>
      {activeFilterCount > 0 && (
        <Button variant="outlined" color="inherit" startIcon={<ClearFilterIcon />} onClick={clearFilters} sx={{ borderRadius: 2 }}>
          پاک کردن فیلترها
        </Button>
      )}
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* ── Page Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                boxShadow: `0 6px 18px ${alpha(theme.palette.info.main, 0.35)}`,
              }}
            >
              <PeopleIcon sx={{ color: '#fff', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                کاربران عادی
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <Box
                  component="span"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.success.main, 0.18)}`,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {faNum(totalCount)} کاربر ثبت شده
                  {users.length > 0 ? ` · ${faNum(users.length)} در این صفحه` : ''}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="بروزرسانی لیست">
              <IconButton
                onClick={() => fetchUsers()}
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.16) },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                px: 2.5,
                boxShadow: `0 4px 14px ${alpha(theme.palette.info.main, 0.35)}`,
              }}
            >
              کاربر جدید
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── Filter Panel ── */}
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: isDark
              ? `linear-gradient(180deg, ${alpha(theme.palette.info.main, 0.05)}, transparent)`
              : `linear-gradient(180deg, ${alpha(theme.palette.info.main, 0.035)}, transparent)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ fontSize: 20, color: 'info.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                جستجو و فیلتر
              </Typography>
              {activeFilterCount > 0 && (
                <Chip
                  size="small"
                  label={`${faNum(activeFilterCount)} فیلتر فعال`}
                  color="info"
                  sx={{ height: 22, fontWeight: 700, fontSize: 11 }}
                />
              )}
            </Box>
            <Button
              size="small"
              color="inherit"
              startIcon={<ClearFilterIcon />}
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              sx={{ borderRadius: 2, color: activeFilterCount === 0 ? 'text.disabled' : 'text.secondary' }}
            >
              حذف فیلترها
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                placeholder="جستجو در نام، نام کاربری یا موبایل..."
                size="small"
                fullWidth
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: 'text.disabled', ml: 0.5, mr: 0.5 }} />,
                    endAdornment: searchInput ? (
                      <IconButton size="small" aria-label="پاک کردن جستجو" onClick={() => setSearchInput('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ) : undefined,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="نقش"
                value={roleId}
                sx={fieldSx}
                onChange={(event) => {
                  setRoleId(event.target.value);
                  resetPage();
                }}
              >
                <MenuItem value="">همه نقش‌ها</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                    {role.description ? ` - ${role.description}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="نوع کاربر"
                value={userTypeId}
                sx={fieldSx}
                onChange={(event) => {
                  setUserTypeId(event.target.value);
                  resetPage();
                }}
              >
                <MenuItem value="">همه انواع</MenuItem>
                {userTypeOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <DatePicker
                label="ثبت‌نام از تاریخ"
                value={createdFrom}
                format="YYYY/MM/DD"
                slotProps={{ textField: { size: 'small', fullWidth: true, sx: fieldSx } }}
                onChange={(value) => {
                  setCreatedFrom(value && dayjs(value).isValid() ? dayjs(value) : null);
                  resetPage();
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <DatePicker
                label="ثبت‌نام تا تاریخ"
                value={createdTo}
                format="YYYY/MM/DD"
                slotProps={{ textField: { size: 'small', fullWidth: true, sx: fieldSx } }}
                onChange={(value) => {
                  setCreatedTo(value && dayjs(value).isValid() ? dayjs(value) : null);
                  resetPage();
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', height: '100%' }}>
                {STATUS_OPTIONS.map((option) => {
                  const active = statusFilter === option.value;
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onClick={() => {
                        setStatusFilter(option.value);
                        resetPage();
                      }}
                      color={active ? 'info' : 'default'}
                      variant={active ? 'filled' : 'outlined'}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: 12,
                        height: 30,
                        borderColor: active ? 'transparent' : 'divider',
                        color: active ? '#fff' : 'text.secondary',
                        bgcolor: active ? undefined : 'transparent',
                        '&:hover': {
                          bgcolor: active ? undefined : alpha(theme.palette.info.main, 0.08),
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* ── Users List ── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Card header */}
          <Box
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 1.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: isDark ? alpha('#fff', 0.02) : alpha(theme.palette.info.main, 0.025),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                فهرست کاربران
              </Typography>
              <Chip
                label={`${faNum(totalCount)} نفر`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: 'info.main',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {tableLoading && <CircularProgress size={16} thickness={5} />}
              <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' } }}>
                مرتب‌سازی: {sort.field === 'userName' ? 'نام کاربری' : sort.field === 'createdDate' ? 'تاریخ عضویت' : 'آخرین ورود'}
                {' · '}
                {sort.sort === 'asc' ? 'صعودی' : 'نزولی'}
              </Typography>
            </Box>
          </Box>

          {tableLoading && <LinearProgress sx={{ height: 2 }} />}

          {!tableLoading && users.length === 0
            ? emptyState
            : (
              <>
                {/* Desktop table */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Table size="medium" sx={{ minWidth: 860 }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          '& th': {
                            py: 1.4,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'text.secondary',
                            bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.012),
                            borderColor: 'divider',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      >
                        <TableCell sx={{ pr: 2.5 }}>
                          <TableSortLabel
                            active={sort.field === 'userName'}
                            direction={sortDirection('userName')}
                            onClick={() => toggleSort('userName')}
                            sx={{ '&.MuiTableSortLabel-root': { fontWeight: 800 } }}
                          >
                            کاربر
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>تماس</TableCell>
                        <TableCell>نوع کاربر</TableCell>
                        <TableCell>وضعیت</TableCell>
                        <TableCell sx={{ display: { md: 'none', lg: 'table-cell' } }}>نقش‌ها</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sort.field === 'createdDate'}
                            direction={sortDirection('createdDate')}
                            onClick={() => toggleSort('createdDate')}
                            sx={{ '&.MuiTableSortLabel-root': { fontWeight: 800 } }}
                          >
                            تاریخ عضویت
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sort.field === 'lastLoginDate'}
                            direction={sortDirection('lastLoginDate')}
                            onClick={() => toggleSort('lastLoginDate')}
                            sx={{ '&.MuiTableSortLabel-root': { fontWeight: 800 } }}
                          >
                            آخرین ورود
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="left" sx={{ pl: 2.5 }}>
                          عملیات
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableLoading && users.length === 0
                        ? Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={`skeleton-${index}`}>
                              {Array.from({ length: 8 }).map((__, cellIndex) => (
                                <TableCell key={cellIndex} sx={{ py: 1.6, borderColor: 'divider' }}>
                                  <Skeleton variant="rounded" height={28} />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        : users.map((user) => (
                            <TableRow
                              key={user.userId}
                              hover
                              sx={{
                                transition: 'background-color 0.15s ease',
                                '&:last-child td': { borderBottom: 0 },
                                '& td': { py: 1.5, borderColor: 'divider' },
                                opacity: tableLoading ? 0.55 : 1,
                              }}
                            >
                              <TableCell sx={{ pr: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                  <UserAvatar user={user} />
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }} noWrap>
                                      {user.fullName || user.userName}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block', lineHeight: 1.4, fontSize: 11.5 }}
                                      noWrap
                                    >
                                      @{user.userName}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  dir="ltr"
                                  sx={{
                                    display: 'inline-block',
                                    fontWeight: 600,
                                    fontSize: 12.5,
                                    fontVariantNumeric: 'tabular-nums',
                                    color: user.phoneNumber ? 'text.primary' : 'text.disabled',
                                  }}
                                >
                                  {user.phoneNumber || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {user.userTypeName ? (
                                  <Chip
                                    label={user.userTypeName}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 24,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      borderRadius: 1.5,
                                      borderColor: 'divider',
                                    }}
                                  />
                                ) : (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <StatusPill user={user} />
                              </TableCell>
                              <TableCell sx={{ display: { md: 'none', lg: 'table-cell' } }}>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 190 }}>
                                  {(user.roles ?? []).slice(0, 2).map((role) => (
                                    <Chip
                                      key={role}
                                      label={role}
                                      size="small"
                                      sx={{
                                        height: 21,
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        color: 'primary.main',
                                      }}
                                    />
                                  ))}
                                  {(user.roles?.length ?? 0) > 2 && (
                                    <Chip
                                      label={`+${faNum((user.roles?.length ?? 0) - 2)}`}
                                      size="small"
                                      sx={{ height: 21, fontSize: 10.5, fontWeight: 700 }}
                                    />
                                  )}
                                  {(user.roles?.length ?? 0) === 0 && (
                                    <Typography variant="caption" color="text.disabled">بدون نقش</Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: 12.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                  {formatFaDate(user.createdDate)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: 12.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                  {formatFaDate(user.lastLoginDate)}
                                </Typography>
                              </TableCell>
                              <TableCell align="left" sx={{ pl: 2 }}>
                                <UserActions
                                  user={user}
                                  busy={actionLoading}
                                  onView={() => {
                                    setSelectedUser(user);
                                    setViewDialogOpen(true);
                                  }}
                                  onEdit={() => openEditDialog(user)}
                                  onToggleActive={() => handleToggleActive(user)}
                                  onMenu={(event) => openMenu(event, user)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile cards */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1.5 }}>
                  {tableLoading && users.length === 0
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                          key={`card-skeleton-${index}`}
                          variant="rounded"
                          height={132}
                          sx={{ borderRadius: 2.5, mb: 1.5 }}
                        />
                      ))
                    : users.map((user) => (
                        <Box
                          key={user.userId}
                          sx={{
                            p: 1.75,
                            mb: 1.5,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.012),
                            opacity: tableLoading ? 0.55 : 1,
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              borderColor: alpha(theme.palette.info.main, 0.4),
                              boxShadow: `0 6px 18px ${alpha(theme.palette.info.main, 0.1)}`,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <UserAvatar user={user} size={46} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                {user.fullName || user.userName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                                @{user.userName}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <StatusPill user={user} />
                              <IconButton
                                size="small"
                                aria-label="عملیات بیشتر"
                                onClick={(event) => openMenu(event, user)}
                                sx={{ color: 'text.secondary', ml: 0.25 }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1.25 }} />

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                              gap: 1,
                              mb: 1.25,
                            }}
                          >
                            <MobileMeta label="موبایل" value={user.phoneNumber || '—'} ltr />
                            <MobileMeta label="نوع کاربر" value={user.userTypeName || '—'} />
                            <MobileMeta label="عضویت" value={formatFaDate(user.createdDate)} />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10.5 }}>
                              آخرین ورود: {formatFaDate(user.lastLoginDate)}
                            </Typography>
                            <UserActions
                              user={user}
                              busy={actionLoading}
                              onView={() => {
                                setSelectedUser(user);
                                setViewDialogOpen(true);
                              }}
                              onEdit={() => openEditDialog(user)}
                              onToggleActive={() => handleToggleActive(user)}
                              onMenu={(event) => openMenu(event, user)}
                            />
                          </Box>
                        </Box>
                      ))}
                </Box>
              </>
            )}

          {/* Footer / pagination */}
          {totalCount > 0 && (
            <Box
              sx={{
                px: { xs: 1.5, md: 2.5 },
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.012),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  نمایش {faNum(rangeStart)} تا {faNum(rangeEnd)} از {faNum(totalCount)} کاربر
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    تعداد در صفحه:
                  </Typography>
                  <TextField
                    select
                    size="small"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    sx={{
                      width: 82,
                      '& .MuiOutlinedInput-root': { borderRadius: 2, height: 32 },
                      '& .MuiSelect-select': { py: 0.5, fontSize: 12.5, fontWeight: 600 },
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option} sx={{ fontSize: 12.5 }}>
                        {faNum(option)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              <Pagination
                count={totalPages}
                page={page}
                onChange={(_event, value) => setPage(value)}
                color="primary"
                shape="rounded"
                size="small"
                showFirstButton
                showLastButton
                siblingCount={0}
                sx={{
                  '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 600 },
                }}
              />
            </Box>
          )}
        </Paper>

        {/* ── Row Actions Menu ── */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          slotProps={{ paper: { sx: { minWidth: 215, borderRadius: 2.5, mt: 0.5 } } }}
        >
          <MenuItem
            onClick={() =>
              runMenuAction((user) => {
                setSelectedUser(user);
                setSelectedRoleId('');
                setRolesDialogOpen(true);
              })
            }
          >
            <ListItemIcon><RolesIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="مدیریت نقش‌ها" slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />
          </MenuItem>
          <MenuItem onClick={() => runMenuAction(handleLock)}>
            <ListItemIcon><LockIcon fontSize="small" sx={{ color: 'warning.main' }} /></ListItemIcon>
            <ListItemText primary="قفل موقت" slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />
          </MenuItem>
          <MenuItem onClick={() => runMenuAction(handleBlock)}>
            <ListItemIcon><BlockIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText primary="بلاک دائم" slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() =>
              runMenuAction((user) => {
                setSelectedUser(user);
                setDeleteDialogOpen(true);
              })
            }
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primary="حذف کاربر" slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />
          </MenuItem>
        </Menu>

        {/* ── Dialogs ── */}
        <RegisterUserModal
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            showToast('کاربر ساخته شد، در انتظار فعال‌سازی', 'success');
            fetchUsers();
          }}
          onError={(message) => showToast(message, 'error')}
        />

        {/* View Details Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3.5, overflow: 'hidden' } } }}
        >
          {selectedUser && (
            <>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                  color: '#fff',
                  px: 3,
                  py: 3,
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ position: 'absolute', top: 8, left: 8, color: '#fff' }}
                  aria-label="بستن"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
                <Avatar
                  sx={{
                    width: 84,
                    height: 84,
                    bgcolor: '#fff',
                    color: 'info.main',
                    fontSize: 32,
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 1,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
                  }}
                >
                  {userInitials(selectedUser)}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {selectedUser.fullName || selectedUser.userName}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  @{selectedUser.userName}
                </Typography>
              </Box>
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">شماره تلفن</Typography>
                    <Typography variant="body1" dir="ltr" sx={{ fontWeight: 600 }}>
                      {selectedUser.phoneNumber || '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">وضعیت حساب</Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <StatusPill user={selectedUser} />
                      {selectedUser.isDeleted && <Chip label="حذف شده" color="error" size="small" />}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">تاریخ عضویت</Typography>
                    <Typography variant="body2">{formatFaDate(selectedUser.createdDate)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">آخرین ورود</Typography>
                    <Typography variant="body2">{formatFaDate(selectedUser.lastLoginDate)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      نقش‌های اختصاص یافته
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selectedUser.roles?.length > 0 ? (
                        selectedUser.roles.map((role) => (
                          <Chip key={role} label={role} size="small" color="info" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.disabled">بدون نقش</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={() => setViewDialogOpen(false)} color="inherit">بستن</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Edit Dialog — ویرایش کامل PATCH /api/v1/Users/{userId} */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="info" />
            ویرایش کامل کاربر
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="نام کاربری" value={editForm.userName} onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="شماره تلفن" value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} fullWidth dir="ltr" size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="نام *" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} fullWidth required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="نام خانوادگی *" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} fullWidth required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth size="small" label="نوع کاربر" value={editForm.userTypeId} onChange={(e) => setEditForm({ ...editForm, userTypeId: e.target.value })}>
                  <MenuItem value="">بدون تغییر</MenuItem>
                  {userTypeOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="زبان ترجیحی" value={editForm.preferredLanguage} onChange={(e) => setEditForm({ ...editForm, preferredLanguage: e.target.value })} fullWidth size="small" dir="ltr" placeholder="مثال: fa" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="نوع وسیله نقلیه" value={editForm.vehicleType} onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="زیرنوع وسیله نقلیه" value={editForm.vehicleSubType} onChange={(e) => setEditForm({ ...editForm, vehicleSubType: e.target.value })} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="منطقه زمانی" value={editForm.timeZone} onChange={(e) => setEditForm({ ...editForm, timeZone: e.target.value })} fullWidth size="small" dir="ltr" placeholder="مثال: Asia/Tehran" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit">انصراف</Button>
            <Button variant="contained" color="info" onClick={handleEdit} disabled={actionLoading} sx={{ borderRadius: 2, px: 4 }}>
              {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ذخیره تغییرات'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Roles Dialog */}
        <Dialog
          open={rolesDialogOpen}
          onClose={() => setRolesDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RolesIcon color="primary" /> مدیریت نقش‌های کاربر
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedUser && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  نقش‌های فعلی {selectedUser.fullName || selectedUser.userName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {selectedUser.roles?.length > 0 ? (
                    selectedUser.roles.map((roleName) => {
                      const roleObj = roles.find((r) => r.name === roleName);
                      const hasPanelAccess = roleObj?.canAccessAdminPanel;
                      return (
                        <Chip
                          key={roleName}
                          label={hasPanelAccess ? `${roleName} · دسترسی پنل` : roleName}
                          onDelete={() => handleRemoveRole(roleName)}
                          disabled={actionLoading}
                          color={hasPanelAccess ? 'secondary' : 'primary'}
                          sx={{ borderRadius: 2 }}
                        />
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.disabled">بدون نقش</Typography>
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>افزودن نقش جدید</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="انتخاب نقش"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    sx={fieldSx}
                  >
                    {(selectedUser.roles?.length
                      ? roles.filter((r) => !selectedUser.roles?.includes(r.name))
                      : roles
                    ).map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}{role.description ? ` - ${role.description}` : ''}
                        {role.canAccessAdminPanel ? ' (دسترسی پنل دارد)' : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button variant="contained" onClick={handleAddRole} disabled={!selectedRoleId || actionLoading} sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
                    {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'افزودن'}
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setRolesDialogOpen(false)} color="inherit">بستن</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon /> حذف کاربر
          </DialogTitle>
          <DialogContent>
            <Typography>
              آیا از حذف کاربر <strong>{selectedUser?.userName}</strong> اطمینان دارید؟
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              این عمل قابل بازگشت نیست.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">انصراف</Button>
            <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading} sx={{ borderRadius: 2 }}>
              {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'حذف قطعی'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
