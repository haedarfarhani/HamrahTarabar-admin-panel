'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  VpnKey as PermissionIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from '@/app/lib/api';
import { PermissionDto, CreatePermissionDto } from '@/app/types/api';

export default function PermissionsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
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
  const [selectedPermission, setSelectedPermission] = useState<PermissionDto | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePermissionDto>({
    name: '',
    description: '',
    category: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPermissions();
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setError(error.errors?.[0] || error.message || 'خطا در دریافت لیست دسترسی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'نام دسترسی الزامی است', severity: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await createPermission(formData);
      if (response.success && response.data) {
        setPermissions([...permissions, response.data]);
        setCreateDialogOpen(false);
        setFormData({ name: '', description: '', category: '' });
        setSnackbar({ open: true, message: 'دسترسی با موفقیت ایجاد شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در ایجاد دسترسی', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPermission || !formData.name.trim()) return;
    setActionLoading(true);
    try {
      const response = await updatePermission(selectedPermission.id, formData);
      if (response.success && response.data) {
        setPermissions(permissions.map((p) => (p.id === selectedPermission.id ? response.data! : p)));
        setEditDialogOpen(false);
        setSelectedPermission(null);
        setFormData({ name: '', description: '', category: '' });
        setSnackbar({ open: true, message: 'دسترسی با موفقیت ویرایش شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در ویرایش دسترسی', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;
    setActionLoading(true);
    try {
      const response = await deletePermission(selectedPermission.id);
      if (response.success) {
        setPermissions(permissions.filter((p) => p.id !== selectedPermission.id));
        setDeleteDialogOpen(false);
        setSelectedPermission(null);
        setSnackbar({ open: true, message: 'دسترسی با موفقیت حذف شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در حذف دسترسی', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (permission: PermissionDto) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description,
      category: permission.category,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (permission: PermissionDto) => {
    setSelectedPermission(permission);
    setDeleteDialogOpen(true);
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    const cat = p.category || 'سایر دسترسی‌ها';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categories = Object.keys(groupedPermissions).sort();
  const totalPermissions = permissions.length;

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PermissionIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>مدیریت دسترسی‌ها</Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} /></Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`,
            }}
          >
            <PermissionIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>دسترسی‌ها</Typography>
            <Typography variant="caption" color="text.secondary">{totalPermissions} مورد در {categories.length} دسته‌بندی</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="بروزرسانی">
            <IconButton onClick={fetchPermissions} sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.16) } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained" color="success" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}` }}
          >
            دسترسی جدید
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Categories Grid ── */}
      {categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          <PermissionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">دسترسی‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid key={category} size={{ xs: 12, lg: 6 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4, height: '100%',
                  border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
                  transition: 'all 0.3s',
                  '&:hover': { borderColor: alpha(theme.palette.success.main, 0.4), boxShadow: `0 8px 30px ${alpha(theme.palette.success.main, 0.12)}` },
                }}
              >
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08), bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CategoryIcon />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{category}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1), px: 1.5, py: 0.5, borderRadius: 2 }}>
                    {groupedPermissions[category].length} مورد
                  </Typography>
                </Box>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <List disablePadding>
                    {groupedPermissions[category].map((permission, idx) => (
                      <Box key={permission.id}>
                        <ListItem sx={{ py: 2, px: 3, display: 'flex', gap: 2, transition: 'all 0.2s', '&:hover': { bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) } }}>
                          <Box sx={{ mt: 0.5, color: 'text.disabled' }}><CodeIcon fontSize="small" /></Box>
                          <ListItemText
                            primary={<Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem' }}>{permission.name}</Typography>}
                            secondary={<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{permission.description || 'بدون توضیحات'}</Typography>}
                            sx={{ m: 0 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="ویرایش"><IconButton size="small" onClick={() => openEditDialog(permission)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="حذف"><IconButton size="small" onClick={() => openDeleteDialog(permission)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        </ListItem>
                        {idx < groupedPermissions[category].length - 1 && <Divider sx={{ mx: 3 }} />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Dialogs ── */}
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="success" /> ایجاد دسترسی جدید
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="نام دسترسی (کد)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required size="small" dir="ltr" placeholder="مثال: Users.Create" />
            <TextField label="دسته‌بندی" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth size="small" placeholder="مثال: مدیریت کاربران" />
            <TextField label="توضیحات" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={3} size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="success" onClick={handleCreate} disabled={actionLoading} sx={{ borderRadius: 2, px: 3 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ایجاد دسترسی'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="success" /> ویرایش دسترسی
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="نام دسترسی (کد)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required size="small" dir="ltr" />
            <TextField label="دسته‌بندی" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth size="small" />
            <TextField label="توضیحات" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={3} size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="success" onClick={handleEdit} disabled={actionLoading} sx={{ borderRadius: 2, px: 3 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ذخیره تغییرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> حذف دسترسی
        </DialogTitle>
        <DialogContent>
          <Typography>آیا از حذف دسترسی <strong>{selectedPermission?.name}</strong> اطمینان دارید؟</Typography>
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
