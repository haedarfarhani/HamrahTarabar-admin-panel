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
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
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
import { RoleDetailDto, CreateRoleDto, PermissionDto } from '@/app/types/api';

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
  const [formData, setFormData] = useState<CreateRoleDto>({ name: '', description: '' });
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesRes, permissionsRes] = await Promise.all([getRoles(), getPermissions()]);
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
      }
      if (permissionsRes.success && permissionsRes.data) {
        setAllPermissions(permissionsRes.data);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'نام نقش الزامی است', severity: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await createRole(formData);
      if (response.success && response.data) {
        setRoles([...roles, response.data]);
        setCreateDialogOpen(false);
        setFormData({ name: '', description: '' });
        setSnackbar({ open: true, message: 'نقش با موفقیت ایجاد شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در ایجاد نقش', severity: 'error' });
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
        setRoles(roles.map((r) => (r.id === selectedRole.id ? response.data! : r)));
        setEditDialogOpen(false);
        setSelectedRole(null);
        setFormData({ name: '', description: '' });
        setSnackbar({ open: true, message: 'نقش با موفقیت ویرایش شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در ویرایش نقش', severity: 'error' });
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
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در حذف نقش', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openPermissionsDialog = async (role: RoleDetailDto) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
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

  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    const hasPermission = rolePermissions.includes(permissionId);
    setActionLoading(true);
    try {
      const response = hasPermission
        ? await removeRolePermission(selectedRole.id, permissionId)
        : await addRolePermission(selectedRole.id, permissionId);
      if (response.success) {
        setRolePermissions(hasPermission ? rolePermissions.filter((id) => id !== permissionId) : [...rolePermissions, permissionId]);
        // Update the main roles list to reflect the new permissions count (if we had a direct count field, we would update it here)
        // Since we don't have it directly in RoleDetailDto returned from getRoles, we might need to refetch or assume length.
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در تغییر دسترسی', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (role: RoleDetailDto) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (role: RoleDetailDto) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    const cat = p.category || 'سایر';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const totalRoles = roles.length;
  const totalPermissions = allPermissions.length;

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <ShieldIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>مدیریت نقش‌ها</Typography>
        </Box>
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={180} sx={{ borderRadius: 4 }} /></Grid>
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
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.4)}`,
            }}
          >
            <ShieldIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>مدیریت نقش‌ها</Typography>
            <Typography variant="caption" color="text.secondary">{totalRoles} نقش تعریف شده</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="بروزرسانی">
            <IconButton onClick={fetchData} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.16) } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.4)}` }}
          >
            نقش جدید
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Roles Grid ── */}
      {roles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">نقشی برای نمایش وجود ندارد</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {roles.map((role) => (
            <Grid key={role.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <RoleCard
                role={role}
                onEdit={() => openEditDialog(role)}
                onDelete={() => openDeleteDialog(role)}
                onManagePermissions={() => openPermissionsDialog(role)}
                isDark={isDark}
                totalPermissions={totalPermissions}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Dialogs ── */}
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="warning" />
          ایجاد نقش جدید
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="نام نقش (انگلیسی)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required size="small" dir="ltr" />
            <TextField label="توضیحات" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={3} size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="warning" onClick={handleCreate} disabled={actionLoading} sx={{ borderRadius: 2, px: 3 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ایجاد نقش'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="warning" />
          ویرایش نقش
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="نام نقش" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required size="small" dir="ltr" />
            <TextField label="توضیحات" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={3} size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="warning" onClick={handleEdit} disabled={actionLoading} sx={{ borderRadius: 2, px: 3 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ذخیره تغییرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> حذف نقش
        </DialogTitle>
        <DialogContent>
          <Typography>آیا از حذف نقش <strong>{selectedRole?.name}</strong> اطمینان دارید؟</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>این عمل قابل بازگشت نیست.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading} sx={{ borderRadius: 2 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'حذف قطعی'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh' } }}>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>مدیریت دسترسی‌ها</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>نقش: {selectedRole?.name}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ bgcolor: alpha('#fff', 0.2), px: 2, py: 0.5, borderRadius: 2, backdropFilter: 'blur(10px)' }}>
            {rolePermissions.length} دسترسی فعال
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          {permissionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 10 }}>
              <CircularProgress color="warning" />
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <Card key={category} elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }}>
                  <Box sx={{ p: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.03), borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05) }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="warning.main">{category}</Typography>
                  </Box>
                  <List disablePadding>
                    {permissions.map((permission, idx) => {
                      const hasPermission = rolePermissions.includes(permission.id);
                      return (
                        <ListItem key={permission.id} divider={idx < permissions.length - 1} sx={{ py: 1.5, px: 2, transition: 'all 0.2s', bgcolor: hasPermission ? alpha(theme.palette.warning.main, 0.04) : 'transparent', '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.08) } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                            {hasPermission ? <CheckCircleIcon color="warning" fontSize="small" /> : <CancelIcon sx={{ color: 'text.disabled' }} fontSize="small" />}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: hasPermission ? 700 : 500, color: hasPermission ? 'warning.main' : 'text.primary' }}>{permission.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{permission.description}</Typography>
                            </Box>
                          </Box>
                          <ListItemSecondaryAction>
                            <Switch edge="end" color="warning" checked={hasPermission} onChange={() => handleTogglePermission(permission.id)} disabled={actionLoading} />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button onClick={() => setPermissionsDialogOpen(false)} variant="contained" color="warning" sx={{ borderRadius: 2, px: 4 }}>بستن و ذخیره</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

/* ═══════════════════════════════════════════════
   ROLE CARD COMPONENT
   ═══════════════════════════════════════════════ */

function RoleCard({
  role, onEdit, onDelete, onManagePermissions, isDark, totalPermissions
}: {
  role: RoleDetailDto; onEdit: () => void; onDelete: () => void; onManagePermissions: () => void; isDark: boolean; totalPermissions: number;
}) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
        border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
        transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
        '&:hover': { borderColor: alpha(theme.palette.warning.main, 0.5), boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.12)}`, transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)}, ${alpha(theme.palette.warning.main, 0.05)})`, p: 2.5, pb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'warning.main', mb: 0.5 }}>{role.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {role.description || 'بدون توضیحات'}
          </Typography>
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.2), color: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldIcon />
        </Box>
      </Box>

      <CardContent sx={{ p: 2.5, pt: 0, mt: -2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Card elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.03) : '#fff', border: '1px solid', borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05), boxShadow: `0 4px 10px ${alpha('#000', 0.05)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PermissionIcon sx={{ fontSize: 16 }} />
              دسترسی‌ها
            </Typography>
            <Chip label="مدیریت" size="small" onClick={onManagePermissions} sx={{ height: 24, fontSize: '0.7rem', bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', fontWeight: 700, cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) } }} />
          </Box>
        </Card>
      </CardContent>

      <Divider />
      
      {/* Actions */}
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
        <Button size="small" startIcon={<SecurityIcon />} onClick={onManagePermissions} sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}>دسترسی‌ها</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="ویرایش"><IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="حذف"><IconButton size="small" onClick={onDelete} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      </Box>
    </Card>
  );
}
