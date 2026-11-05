'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  Switch,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  VpnKey as PermissionIcon,
  Shield as ShieldIcon,
  AdminPanelSettings as PanelAccessIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  addRolePermission,
  removeRolePermission,
  getRolePermissions,
  getPermissions,
} from '@/app/lib/api';
import { RoleDto, RoleDetailDto, CreateRoleDto, PermissionDto } from '@/app/types/api';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';

/** getRoles/create/update نقشِ خلاصه (RoleDto) برمی‌گردانند؛ برای state داخلی به RoleDetailDto نرمال می‌شود */
const toRoleDetail = (role: RoleDto): RoleDetailDto => ({
  ...role,
  permissions: role.permissions ?? [],
});

type AccessFilter = 'all' | 'panel' | 'noPanel';

const faNum = (value: number) => value.toLocaleString('fa-IR');

const ACCESS_OPTIONS: { value: AccessFilter; label: string }[] = [
  { value: 'all', label: 'همه نقش‌ها' },
  { value: 'panel', label: 'با ورود به پنل' },
  { value: 'noPanel', label: 'بدون ورود به پنل' },
];

const EMPTY_FORM: CreateRoleDto = { name: '', description: '', canAccessAdminPanel: false };

/** کارت آماری بالای صفحه */
function RoleStatCard({
  label,
  value,
  icon,
  gradient,
  shadow,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  gradient: string;
  shadow: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        background: gradient,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 6px 20px ${alpha(shadow, 0.28)}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 110,
          height: 110,
          borderRadius: '50%',
          bgcolor: alpha('#fff', 0.08),
          top: -40,
          left: -25,
        }}
      />
      <CardContent
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:last-child': { pb: 2.5 },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            bgcolor: alpha('#fff', 0.18),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

/** کارت نقش در گرید */
function RoleCard({
  role,
  onEdit,
  onDelete,
  onManagePermissions,
  isDark,
}: {
  role: RoleDetailDto;
  onEdit: () => void;
  onDelete: () => void;
  onManagePermissions: () => void;
  isDark: boolean;
}) {
  const theme = useTheme();
  const accent = role.canAccessAdminPanel ? theme.palette.secondary.main : theme.palette.text.secondary;
  const permissionCount = role.permissions?.length ?? 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(accent, 0.45),
          boxShadow: `0 12px 30px ${alpha(accent, 0.14)}`,
        },
      }}
    >
      <Box
        sx={{
          height: 5,
          background: role.canAccessAdminPanel
            ? `linear-gradient(90deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`
            : `linear-gradient(90deg, ${alpha(theme.palette.text.disabled, 0.35)}, ${alpha(theme.palette.text.disabled, 0.6)})`,
        }}
      />

      <CardContent sx={{ p: 2.5, pb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(accent, 0.11),
                color: accent,
                border: `1px solid ${alpha(accent, 0.16)}`,
              }}
            >
              <ShieldIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.35 }} noWrap>
                {role.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                {role.code || 'بدون کد یکتا'}
              </Typography>
            </Box>
          </Box>

          {role.isSystemRole ? (
            <Chip
              icon={<LockIcon sx={{ fontSize: 13 }} />}
              label="سیستمی"
              size="small"
              sx={{
                height: 22,
                fontSize: 10.5,
                fontWeight: 700,
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: 'warning.dark',
                '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
              }}
            />
          ) : (
            <Chip
              label="سفارشی"
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 10.5, fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}
            />
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 2,
            minHeight: 40,
            lineHeight: 1.9,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {role.description || 'توضیحی برای این نقش ثبت نشده است.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 2 }}>
          {role.canAccessAdminPanel ? (
            <Chip
              icon={<PanelAccessIcon sx={{ fontSize: 14 }} />}
              label="ورود به پنل ادمین"
              size="small"
              sx={{
                height: 25,
                fontSize: 10.5,
                fontWeight: 700,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: 'success.dark',
                '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
              }}
            />
          ) : (
            <Chip
              label="فقط عملیات بیرون پنل"
              size="small"
              sx={{
                height: 25,
                fontSize: 10.5,
                fontWeight: 600,
                bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04),
                color: 'text.secondary',
              }}
            />
          )}
          {permissionCount > 0 && (
            <Chip
              icon={<PermissionIcon sx={{ fontSize: 14 }} />}
              label={`${faNum(permissionCount)} دسترسی`}
              size="small"
              sx={{
                height: 25,
                fontSize: 10.5,
                fontWeight: 700,
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: 'secondary.main',
                '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
              }}
            />
          )}
        </Box>
      </CardContent>

      <Divider />

      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.012),
        }}
      >
        <Button
          size="small"
          startIcon={<SecurityIcon />}
          onClick={onManagePermissions}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 12,
            color: 'secondary.main',
            '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.08) },
          }}
        >
          مدیریت دسترسی‌ها
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="ویرایش نقش">
            <IconButton
              size="small"
              onClick={onEdit}
              aria-label="ویرایش نقش"
              sx={{
                color: 'info.main',
                bgcolor: alpha(theme.palette.info.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.16) },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف نقش">
            <IconButton
              size="small"
              onClick={onDelete}
              aria-label="حذف نقش"
              sx={{
                color: 'error.main',
                bgcolor: alpha(theme.palette.error.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.16) },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
}

/** دیالوگ مشترک ایجاد و ویرایش نقش */
function RoleFormDialog({
  open,
  mode,
  roleName,
  formData,
  onChange,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  roleName?: string;
  formData: CreateRoleDto;
  onChange: (data: CreateRoleDto) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const theme = useTheme();
  const isCreate = mode === 'create';
  const accent = theme.palette.secondary.main;

  const fieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
          color: '#fff',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: '50%',
            bgcolor: alpha('#fff', 0.07),
            top: -55,
            left: -30,
          }}
        />
        <IconButton
          onClick={onClose}
          aria-label="بستن"
          sx={{ position: 'absolute', top: 10, left: 10, color: '#fff' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              bgcolor: alpha('#fff', 0.18),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCreate ? <AddIcon /> : <EditIcon />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
              {isCreate ? 'ایجاد نقش جدید' : 'ویرایش نقش'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {isCreate ? 'یک نقش تازه برای گروه‌بندی دسترسی‌ها بسازید' : roleName ? `نقش: ${roleName}` : 'اطلاعات نقش را به‌روز کنید'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="نام نقش"
            placeholder="مثلاً SupportAgent"
            value={formData.name}
            onChange={(event) => onChange({ ...formData, name: event.target.value })}
            fullWidth
            required
            size="small"
            dir="ltr"
            helperText="نام یکتا و انگلیسی؛ در سیستم با همین نام شناخته می‌شود."
            sx={fieldSx}
          />
          <TextField
            label="توضیحات"
            placeholder="این نقش چه کاری انجام می‌دهد؟"
            value={formData.description}
            onChange={(event) => onChange({ ...formData, description: event.target.value })}
            fullWidth
            multiline
            rows={3}
            size="small"
            sx={fieldSx}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: alpha(accent, 0.2),
              bgcolor: alpha(accent, 0.05),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(accent, 0.12),
                  color: accent,
                }}
              >
                <PanelAccessIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.5 }}>
                  اجازهٔ ورود به پنل ادمین
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
                  کاربران این نقش می‌توانند وارد پنل شوند؛ مستقل از دسترسی‌های عملیاتی.
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={formData.canAccessAdminPanel ?? false}
              onChange={(event) => onChange({ ...formData, canAccessAdminPanel: event.target.checked })}
              color="secondary"
              slotProps={{ input: { 'aria-label': 'اجازه ورود به پنل ادمین' } }}
              sx={{ flexShrink: 0 }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
        >
          {isCreate ? 'ایجاد نقش' : 'ذخیره تغییرات'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RolesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetailDto | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateRoleDto>(EMPTY_FORM);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  // لودینگ جداگانه‌ی هر دسترسی تا با یک کلیک کل دیالوگ قفل نشود
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [permissionSearch, setPermissionSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesRes, permissionsRes] = await Promise.all([getRoles(), getPermissions()]);
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data.map(toRoleDetail));
      }
      if (permissionsRes.success && permissionsRes.data) {
        setAllPermissions(permissionsRes.data);
      }
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'خطا در دریافت اطلاعات'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // واکشی اولیه‌ی داده‌ها هنگام باز شدن صفحه
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'نام نقش الزامی است', severity: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await createRole(formData);
      if (response.success && response.data) {
        setRoles([...roles, toRoleDetail(response.data)]);
        setCreateDialogOpen(false);
        setFormData(EMPTY_FORM);
        setSnackbar({ open: true, message: 'نقش با موفقیت ایجاد شد', severity: 'success' });
      }
    } catch (err: unknown) {
      setSnackbar({ open: true, message: extractApiErrorMessage(err, 'خطا در ایجاد نقش'), severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedRole || !formData.name.trim()) return;
    setActionLoading(true);
    try {
      const response = await updateRole(selectedRole.id, formData);
      if (response.success && response.data) {
        const updated = toRoleDetail(response.data);
        setRoles(roles.map((r) => (r.id === selectedRole.id ? updated : r)));
        setEditDialogOpen(false);
        setSelectedRole(null);
        setFormData(EMPTY_FORM);
        setSnackbar({ open: true, message: 'نقش با موفقیت ویرایش شد', severity: 'success' });
      }
    } catch (err: unknown) {
      setSnackbar({ open: true, message: extractApiErrorMessage(err, 'خطا در ویرایش نقش'), severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setActionLoading(true);
    try {
      const response = await deleteRole(selectedRole.id);
      if (response.success) {
        setRoles(roles.filter((r) => r.id !== selectedRole.id));
        setDeleteDialogOpen(false);
        setSelectedRole(null);
        setSnackbar({ open: true, message: 'نقش با موفقیت حذف شد', severity: 'success' });
      }
    } catch (err: unknown) {
      setSnackbar({ open: true, message: extractApiErrorMessage(err, 'خطا در حذف نقش'), severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openPermissionsDialog = async (role: RoleDetailDto) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
    setPermissionSearch('');
    setRolePermissions([]);
    setPermissionsLoading(true);
    try {
      const response = await getRolePermissions(role.id);
      if (response.success && response.data) {
        setRolePermissions(response.data.map((p) => p.id));
      } else {
        setRolePermissions([]);
      }
    } catch {
      setRolePermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  /** انتساب/حذف دسترسی نقش — POST/DELETE /api/v1/Roles/{roleId}/permissions/{permissionId} */
  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    const hasPermission = rolePermissions.includes(permissionId);
    setPendingPermissionId(permissionId);
    try {
      const response = hasPermission
        ? await removeRolePermission(selectedRole.id, permissionId)
        : await addRolePermission(selectedRole.id, permissionId);
      if (response.success) {
        setRolePermissions(
          hasPermission
            ? rolePermissions.filter((id) => id !== permissionId)
            : [...rolePermissions, permissionId]
        );
        setSnackbar({
          open: true,
          message: hasPermission ? 'دسترسی از نقش حذف شد' : 'دسترسی به نقش اضافه شد',
          severity: 'success',
        });
      }
    } catch (err: unknown) {
      setSnackbar({ open: true, message: extractApiErrorMessage(err, 'خطا در تغییر دسترسی'), severity: 'error' });
    } finally {
      setPendingPermissionId(null);
    }
  };

  const openCreateDialog = () => {
    setFormData(EMPTY_FORM);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (role: RoleDetailDto) => {
    setSelectedRole(role);
    // مقدار قبلی بک‌اند در سوییچ نمایش داده می‌شود و در درخواست ویرایش ارسال می‌گردد
    setFormData({
      name: role.name,
      description: role.description,
      canAccessAdminPanel: role.canAccessAdminPanel ?? false,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (role: RoleDetailDto) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    const category = p.category || 'سایر';
    if (!acc[category]) acc[category] = [];
    acc[category].push(p);
    return acc;
  }, {});

  const query = searchQuery.trim().toLowerCase();
  const filteredRoles = roles.filter((role) => {
    const matchesAccess =
      accessFilter === 'all' ||
      (accessFilter === 'panel' ? Boolean(role.canAccessAdminPanel) : !role.canAccessAdminPanel);
    if (!matchesAccess) return false;
    if (!query) return true;
    return [role.name, role.description, role.code ?? ''].some((value) =>
      (value || '').toLowerCase().includes(query)
    );
  });

  const permissionQuery = permissionSearch.trim().toLowerCase();
  const filteredPermissionGroups = Object.entries(groupedPermissions)
    .map(([category, items]) => [
      category,
      items.filter((permission) =>
        !permissionQuery
          ? true
          : [permission.name, permission.description ?? ''].some((value) =>
              (value || '').toLowerCase().includes(permissionQuery)
            )
      ),
    ] as [string, PermissionDto[]])
    .filter(([, items]) => items.length > 0);
  const filteredPermissionCount = filteredPermissionGroups.reduce((sum, [, items]) => sum + items.length, 0);

  const totalRoles = roles.length;
  const panelAccessCount = roles.filter((role) => role.canAccessAdminPanel).length;
  const totalPermissions = allPermissions.length;
  const activePermissionCount = rolePermissions.length;
  const permissionCoverage =
    totalPermissions === 0 ? 0 : Math.round((activePermissionCount / totalPermissions) * 100);

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Skeleton variant="rounded" width={48} height={48} />
          <Box>
            <Skeleton variant="text" width={180} height={32} />
            <Skeleton variant="text" width={120} height={20} />
          </Box>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={250} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
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
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              boxShadow: `0 6px 18px ${alpha(theme.palette.secondary.main, 0.35)}`,
            }}
          >
            <ShieldIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
              نقش‌ها و دسترسی‌ها
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {faNum(totalRoles)} نقش تعریف شده · {faNum(totalPermissions)} دسترسی در سیستم
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="بروزرسانی">
            <IconButton
              onClick={fetchData}
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.16) },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.35)}`,
            }}
          >
            نقش جدید
          </Button>
        </Box>
      </Box>

      {/* ── Stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <RoleStatCard
            label="کل نقش‌ها"
            value={faNum(totalRoles)}
            icon={<ShieldIcon />}
            gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
            shadow="#8b5cf6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <RoleStatCard
            label="نقش‌های با ورود به پنل"
            value={faNum(panelAccessCount)}
            icon={<PanelAccessIcon />}
            gradient="linear-gradient(135deg, #10b981, #047857)"
            shadow="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <RoleStatCard
            label="دسترسی‌های تعریف‌شده"
            value={faNum(totalPermissions)}
            icon={<PermissionIcon />}
            gradient="linear-gradient(135deg, #0ea5e9, #0369a1)"
            shadow="#0ea5e9"
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Toolbar ── */}
      <Card
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 2, md: 2.5 },
          background: isDark
            ? `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.05)}, transparent)`
            : `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.035)}, transparent)`,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="جستجو در نام، کد یا توضیحات نقش..."
            size="small"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{
              flex: 1,
              minWidth: 240,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
              },
            }}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: 'text.disabled', ml: 0.5, mr: 0.5 }} />,
                endAdornment: searchQuery ? (
                  <IconButton size="small" aria-label="پاک کردن جستجو" onClick={() => setSearchQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ) : undefined,
              },
            }}
          />
          <Chip
            label={`${faNum(filteredRoles.length)} از ${faNum(totalRoles)} نقش`}
            size="small"
            sx={{
              height: 28,
              fontWeight: 700,
              fontSize: 11.5,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: 'secondary.main',
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {ACCESS_OPTIONS.map((option) => {
              const active = accessFilter === option.value;
              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => setAccessFilter(option.value)}
                  color={active ? 'secondary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 11.5,
                    height: 30,
                    borderColor: active ? 'transparent' : 'divider',
                    color: active ? '#fff' : 'text.secondary',
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Card>

      {/* ── Roles Grid ── */}
      {roles.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            px: 3,
            borderRadius: 4,
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
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
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              border: `1px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
            }}
          >
            <SecurityIcon sx={{ fontSize: 40, color: alpha(theme.palette.secondary.main, 0.55) }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
            نقشی برای نمایش وجود ندارد
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75, mb: 2.5 }}>
            با دکمه «نقش جدید» اولین نقش را بسازید.
          </Typography>
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ borderRadius: 2 }}>
            ایجاد نقش
          </Button>
        </Box>
      ) : filteredRoles.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            borderRadius: 4,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
          }}
        >
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
            نقشی با این مشخصات پیدا نشد
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            عبارت جستجو یا فیلتر را تغییر دهید.
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setSearchQuery('');
              setAccessFilter('all');
            }}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            حذف فیلترها
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filteredRoles.map((role) => (
            <Grid key={role.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <RoleCard
                role={role}
                onEdit={() => openEditDialog(role)}
                onDelete={() => openDeleteDialog(role)}
                onManagePermissions={() => openPermissionsDialog(role)}
                isDark={isDark}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Create / Edit Dialog ── */}
      <RoleFormDialog
        open={createDialogOpen}
        mode="create"
        formData={formData}
        onChange={setFormData}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
        loading={actionLoading}
      />
      <RoleFormDialog
        open={editDialogOpen}
        mode="edit"
        roleName={selectedRole?.name}
        formData={formData}
        onChange={setFormData}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedRole(null);
        }}
        onSubmit={handleEdit}
        loading={actionLoading}
      />

      {/* ── Delete Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: 'error.main',
            }}
          >
            <DeleteIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            حذف نقش «{selectedRole?.name}»؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.9 }}>
            این عمل قابل بازگشت نیست و دسترسی‌های متصل به این نقش نیز حذف می‌شوند. کاربران دارای این نقش
            دیگر از آن دسترسی‌ها استفاده نخواهند کرد.
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.06),
              border: `1px dashed ${alpha(theme.palette.error.main, 0.25)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'error.main',
            }}
          >
            <WarningIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              پیش از حذف، نقش کاربران را بررسی کنید.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'center' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            حذف قطعی
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Permissions Dialog ── */}
      <Dialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden', maxHeight: '92vh' } } }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
            color: '#fff',
            p: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              bgcolor: alpha('#fff', 0.06),
              top: -90,
              left: -40,
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  flexShrink: 0,
                  bgcolor: alpha('#fff', 0.18),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
                  مدیریت دسترسی‌ها
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                  نقش: {selectedRole?.name}
                  {selectedRole?.canAccessAdminPanel ? ' — دسترسی به پنل دارد' : ''}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${faNum(activePermissionCount)} فعال`}
                size="small"
                sx={{ bgcolor: alpha('#fff', 0.18), color: '#fff', fontWeight: 700, height: 26 }}
              />
              <IconButton onClick={() => setPermissionsDialogOpen(false)} aria-label="بستن" sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mt: 2.5, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                پوشش دسترسی‌های نقش
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {faNum(activePermissionCount)} از {faNum(totalPermissions)} · {faNum(permissionCoverage)}٪
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={permissionCoverage}
              sx={{
                height: 7,
                borderRadius: 999,
                bgcolor: alpha('#fff', 0.22),
                '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 999 },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            bgcolor: 'background.paper',
          }}
        >
          <TextField
            placeholder="جستجوی دسترسی..."
            size="small"
            value={permissionSearch}
            onChange={(event) => setPermissionSearch(event.target.value)}
            sx={{
              flex: 1,
              minWidth: 220,
              '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
            }}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: 'text.disabled', ml: 0.5, mr: 0.5 }} />,
                endAdornment: permissionSearch ? (
                  <IconButton size="small" aria-label="پاک کردن جستجو" onClick={() => setPermissionSearch('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ) : undefined,
              },
            }}
          />
          <Chip
            label={`${faNum(filteredPermissionCount)} دسترسی`}
            size="small"
            sx={{
              height: 26,
              fontWeight: 700,
              fontSize: 11,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: 'secondary.main',
            }}
          />
        </Box>

        <DialogContent sx={{ p: { xs: 2, md: 2.5 }, bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.012) }}>
          {permissionsLoading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid key={i} size={{ xs: 12, md: 6 }}>
                  <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          ) : filteredPermissionGroups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 7 }}>
              <PermissionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700 }}>
                دسترسی‌ای پیدا نشد
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {permissionSearch ? 'عبارت جستجو را تغییر دهید.' : 'هنوز دسترسی‌ای در سیستم تعریف نشده است.'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredPermissionGroups.map(([category, items]) => {
                const activeInCategory = items.filter((permission) => rolePermissions.includes(permission.id)).length;
                return (
                  <Grid key={category} size={{ xs: 12, md: 6 }}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        height: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          bgcolor: isDark ? alpha('#fff', 0.03) : alpha(theme.palette.secondary.main, 0.04),
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: activeInCategory > 0 ? 'secondary.main' : 'text.disabled',
                              boxShadow: `0 0 0 3px ${alpha(
                                activeInCategory > 0 ? theme.palette.secondary.main : theme.palette.text.disabled,
                                0.15
                              )}`,
                            }}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {category}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${faNum(activeInCategory)} از ${faNum(items.length)}`}
                          size="small"
                          sx={{ height: 21, fontSize: 10.5, fontWeight: 700 }}
                        />
                      </Box>
                      <Box>
                        {items.map((permission, index) => {
                          const hasPermission = rolePermissions.includes(permission.id);
                          const isPending = pendingPermissionId === permission.id;
                          return (
                            <Box
                              key={permission.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.5,
                                borderBottom: index < items.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                transition: 'background-color 0.15s ease',
                                bgcolor: hasPermission
                                  ? alpha(theme.palette.success.main, 0.035)
                                  : 'transparent',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 1.5,
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: hasPermission
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : alpha(theme.palette.text.disabled, 0.08),
                                  color: hasPermission ? 'success.main' : 'text.disabled',
                                }}
                              >
                                {hasPermission ? (
                                  <CheckCircleIcon sx={{ fontSize: 17 }} />
                                ) : (
                                  <PermissionIcon sx={{ fontSize: 16 }} />
                                )}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: hasPermission ? 700 : 500,
                                    color: hasPermission ? 'text.primary' : 'text.secondary',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {permission.name}
                                </Typography>
                                {permission.description && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                                    {permission.description}
                                  </Typography>
                                )}
                              </Box>
                              {isPending ? (
                                <CircularProgress size={20} sx={{ flexShrink: 0 }} />
                              ) : (
                                <Switch
                                  size="small"
                                  checked={hasPermission}
                                  onChange={() => handleTogglePermission(permission.id)}
                                  disabled={pendingPermissionId !== null}
                                  color="secondary"
                                  slotProps={{
                                    input: {
                                      'aria-label': `دسترسی ${permission.name}`,
                                    },
                                  }}
                                  sx={{ flexShrink: 0 }}
                                />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 1.75,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {faNum(activePermissionCount)} دسترسی فعال از {faNum(totalPermissions)} دسترسی
          </Typography>
          <Button
            onClick={() => setPermissionsDialogOpen(false)}
            variant="contained"
            color="secondary"
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            پایان
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
  );
}
