'use client';

import { useState, useEffect } from 'react';
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
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  alpha,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as ActivateIcon,
  PersonOff as DeactivateIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  CalendarMonth as DateIcon,
  Lock as LockIcon,
  Block as BlockIcon,
  LockOpen as UnlockIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  getAllUsers,
  createUser,
  deleteUser,
  activateUser,
  deactivateUser,
  lockUser,
  unlockUser,
  blockUser,
  unblockUser,
  getRoles,
} from '@/app/lib/api';
import { AdminUserDto, CreateUserDto, RoleDetailDto } from '@/app/types/api';

export default function RegularUsersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create user form
  const [formData, setFormData] = useState<CreateUserDto>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roles: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, rolesRes] = await Promise.all([getAllUsers(), getRoles()]);
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در دریافت لیست کاربران');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.username || !formData.password || !formData.firstName || !formData.lastName) {
      setSnackbar({ open: true, message: 'لطفاً فیلدهای الزامی را پر کنید', severity: 'error' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({ open: true, message: 'رمز عبور و تکرار آن مطابقت ندارند', severity: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await createUser(formData);
      if (response.success) {
        setSnackbar({ open: true, message: 'کاربر با موفقیت ایجاد شد', severity: 'success' });
        setCreateDialogOpen(false);
        setFormData({ username: '', password: '', confirmPassword: '', firstName: '', lastName: '', phoneNumber: '', roles: [] });
        fetchData();
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در ایجاد کاربر', severity: 'error' });
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
        setUsers(users.filter((u) => u.userId !== selectedUser.userId));
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        setSnackbar({ open: true, message: 'کاربر با موفقیت حذف شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در حذف کاربر', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: AdminUserDto) => {
    setActionLoading(true);
    try {
      const response = user.isActive ? await deactivateUser(user.userId) : await activateUser(user.userId);
      if (response.success) {
        setUsers(users.map((u) => (u.userId === user.userId ? { ...u, isActive: !u.isActive } : u)));
        setSnackbar({ open: true, message: user.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در تغییر وضعیت', severity: 'error' });
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
        setSnackbar({ open: true, message: 'کاربر قفل شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در قفل کردن کاربر', severity: 'error' });
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
        setSnackbar({ open: true, message: 'کاربر بلاک شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در بلاک کردن کاربر', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filterActive === 'all' || (filterActive === 'active' ? u.isActive : !u.isActive);
    const matchesSearch = !searchQuery || u.userName.toLowerCase().includes(searchQuery.toLowerCase()) || (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PeopleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>مدیریت کاربران عادی</Typography>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}><Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} /></Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} /></Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.info.main, 0.4)}`,
            }}
          >
            <PeopleIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>کاربران عادی</Typography>
            <Typography variant="caption" color="text.secondary">{totalCount} کاربر ثبت شده</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="بروزرسانی">
            <IconButton onClick={fetchData} sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.16) } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained" color="info" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: `0 4px 14px ${alpha(theme.palette.info.main, 0.4)}` }}
          >
            کاربر جدید
          </Button>
        </Box>
      </Box>

      {/* ── Stats & Filters ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'کل کاربران', count: totalCount, gradient: 'linear-gradient(135deg, #1976d2, #1565c0)', shadow: '#1976d2', filter: 'all' as const },
          { label: 'فعال', count: activeCount, gradient: 'linear-gradient(135deg, #4caf50, #388e3c)', shadow: '#4caf50', filter: 'active' as const },
          { label: 'غیرفعال', count: inactiveCount, gradient: 'linear-gradient(135deg, #ef5350, #e53935)', shadow: '#ef5350', filter: 'inactive' as const },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={0}
              onClick={() => setFilterActive(stat.filter)}
              sx={{
                cursor: 'pointer', borderRadius: 3, background: stat.gradient, color: '#fff', transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                boxShadow: filterActive === stat.filter ? `0 8px 28px ${alpha(stat.shadow, 0.5)}` : `0 4px 14px ${alpha(stat.shadow, 0.25)}`,
                transform: filterActive === stat.filter ? 'translateY(-2px)' : 'none',
                border: filterActive === stat.filter ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 10px 30px ${alpha(stat.shadow, 0.45)}` },
              }}
            >
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1, mb: 0.5, fontFeatureSettings: '"ss01"' }}>{stat.count.toLocaleString('fa-IR')}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>{stat.label}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.2 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Toolbar ── */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="جستجو در نام یا نام کاربری..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1, ml: 0.5 }} /> } }}
          sx={{ maxWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) } }}
        />
      </Box>

      {/* ── User Cards Grid ── */}
      {filteredUsers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">کاربری یافت نشد</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filteredUsers.map((user) => (
            <Grid key={user.userId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <UserCard
                user={user}
                onView={() => { setSelectedUser(user); setViewDialogOpen(true); }}
                onToggleActive={() => handleToggleActive(user)}
                onLock={() => handleLock(user)}
                onBlock={() => handleBlock(user)}
                onDelete={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                actionLoading={actionLoading}
                isDark={isDark}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Dialogs ── */}
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="info" />
          ایجاد کاربر جدید
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="نام کاربری" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} fullWidth required size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="شماره تلفن" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} fullWidth dir="ltr" size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="نام" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} fullWidth required size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="نام خانوادگی" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} fullWidth required size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="رمز عبور" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} fullWidth required size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="تکرار رمز عبور" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} fullWidth required size="small" /></Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>نقش‌ها</InputLabel>
                <Select multiple value={formData.roles || []} label="نقش‌ها" onChange={(e) => setFormData({ ...formData, roles: e.target.value as string[] })} renderValue={(selected) => selected.join(', ')}>
                  {roles.map((role) => <MenuItem key={role.id} value={role.name}>{role.name} - {role.description}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="info" onClick={handleCreate} disabled={actionLoading} sx={{ borderRadius: 2, px: 4 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ایجاد کاربر'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedUser && (
          <>
            <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`, color: '#fff', px: 3, py: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#fff', color: 'info.main', fontSize: 32, fontWeight: 'bold', mx: 'auto', mb: 1, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                {selectedUser.fullName?.charAt(0) || selectedUser.userName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedUser.fullName || selectedUser.userName}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>@{selectedUser.userName}</Typography>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">شماره تلفن</Typography>
                  <Typography variant="body1" dir="ltr" sx={{ fontWeight: 600 }}>{selectedUser.phoneNumber || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">وضعیت حساب</Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                    <Chip label={selectedUser.isActive ? 'فعال' : 'غیرفعال'} color={selectedUser.isActive ? 'success' : 'error'} size="small" />
                    {selectedUser.isDeleted && <Chip label="حذف شده" color="error" size="small" />}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}><Divider /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">تاریخ عضویت</Typography>
                  <Typography variant="body2">{selectedUser.createdDate ? new Date(selectedUser.createdDate).toLocaleDateString('fa-IR') : '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">آخرین ورود</Typography>
                  <Typography variant="body2">{selectedUser.lastLoginDate ? new Date(selectedUser.lastLoginDate).toLocaleDateString('fa-IR') : '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}><Divider /></Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>نقش‌های اختصاص یافته</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedUser.roles?.length > 0 ? (
                      selectedUser.roles.map((role) => <Chip key={role} label={role} size="small" color="info" variant="outlined" />)
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> حذف کاربر
        </DialogTitle>
        <DialogContent>
          <Typography>آیا از حذف کاربر <strong>{selectedUser?.userName}</strong> اطمینان دارید؟</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>این عمل قابل بازگشت نیست.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading} sx={{ borderRadius: 2 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'حذف قطعی'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

/* ═══════════════════════════════════════════════
   USER CARD COMPONENT
   ═══════════════════════════════════════════════ */

function UserCard({
  user, onView, onToggleActive, onLock, onBlock, onDelete, actionLoading, isDark
}: {
  user: AdminUserDto; onView: () => void; onToggleActive: () => void; onLock: () => void; onBlock: () => void; onDelete: () => void; actionLoading: boolean; isDark: boolean;
}) {
  const theme = useTheme();
  const isActive = user.isActive;
  const statusColor = isActive ? '#4caf50' : '#ef5350';

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
        border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
        transition: 'all 0.3s', position: 'relative', overflow: 'visible',
        '&:hover': { borderColor: alpha(theme.palette.info.main, 0.5), boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.12)}`, transform: 'translateY(-2px)' },
      }}
    >
      {/* Top Background Pattern */}
      <Box sx={{ height: 60, bgcolor: alpha(theme.palette.info.main, 0.1), borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
      
      <CardContent sx={{ p: 2, pt: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: -3, mb: 1.5 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'info.main', fontSize: 24, fontWeight: 'bold', border: `4px solid ${theme.palette.background.paper}`, boxShadow: `0 4px 10px ${alpha(theme.palette.info.main, 0.2)}` }}>
            {user.fullName?.charAt(0) || user.userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ mt: 4, display: 'flex', gap: 0.5 }}>
            <Chip label={isActive ? 'فعال' : 'غیرفعال'} size="small" sx={{ bgcolor: alpha(statusColor, 0.15), color: statusColor, fontWeight: 700, fontSize: '0.7rem' }} />
            {user.isDeleted && <Chip label="حذف شده" color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
          </Box>
        </Box>

        {/* Info */}
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>{user.fullName || user.userName}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace' }}>@{user.userName}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
          <PhoneIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" dir="ltr">{user.phoneNumber || '-'}</Typography>
        </Box>

        {/* Roles */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {user.roles?.slice(0, 2).map((role) => <Chip key={role} label={role} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />)}
            {user.roles?.length > 2 && <Chip label={`+${user.roles.length - 2}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
            {(!user.roles || user.roles.length === 0) && <Typography variant="caption" color="text.disabled">بدون نقش</Typography>}
          </Box>
        </Box>
      </CardContent>

      <Divider />
      
      {/* Actions */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-around', bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
        <Tooltip title="مشاهده جزئیات"><IconButton size="small" onClick={onView} sx={{ color: 'text.secondary' }}><ViewIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={isActive ? 'غیرفعال کردن' : 'فعال کردن'}><IconButton size="small" onClick={onToggleActive} disabled={actionLoading} color={isActive ? 'warning' : 'success'}>{isActive ? <DeactivateIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}</IconButton></Tooltip>
        <Tooltip title="قفل موقت"><IconButton size="small" onClick={onLock} disabled={actionLoading} color="warning"><LockIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="بلاک دائم"><IconButton size="small" onClick={onBlock} disabled={actionLoading} color="error"><BlockIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="حذف"><IconButton size="small" onClick={onDelete} disabled={actionLoading} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    </Card>
  );
}
