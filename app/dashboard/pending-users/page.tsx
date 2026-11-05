'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '@/app/components/ui/DataTable';
import RegisterUserModal from '@/app/components/admin/RegisterUserModal';
import {
  getPendingActivationUsers,
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
} from '@/app/lib/api';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';
import { UserListDto } from '@/app/types/api';

const POLL_INTERVAL_MS = 20000;

export default function PendingUsersPage() {
  const theme = useTheme();

  const [users, setUsers] = useState<UserListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListDto | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const fetchPending = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const res = await getPendingActivationUsers();
      if (res.success && res.data) {
        // بک‌اند فقط !isActive && !isDeleted برمی‌گرداند؛ فیلتر دفاعی سمت کلاینت هم اعمال می‌شود
        setUsers(res.data.filter((u) => !u.isActive && !u.isDeleted));
      }
    } catch (err: unknown) {
      if (!silent) setError(extractApiErrorMessage(err, 'خطا در دریافت لیست در انتظار تایید'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial fetch + polling subscription (الگوی مجاز افکت: اشتراک در منبع خارجی)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPending();
    // polling تعداد در انتظار تایید — معادل refetch دوره‌ای
    const timer = window.setInterval(() => fetchPending(true), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [fetchPending]);

  /** بعد از activate موفق، کاربر از لیست pending حذف و لاگینش آزاد می‌شود */
  const handleApprove = async (user: UserListDto) => {
    setActionLoading(user.userId);
    try {
      const res = await activateAdminUser(user.userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        showToast(`کاربر ${user.fullName || user.userName || ''} فعال شد؛ ورود آزاد است`, 'success');
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در فعال‌سازی کاربر'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (user: UserListDto) => {
    setActionLoading(user.userId);
    try {
      const res = await deactivateAdminUser(user.userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        showToast('کاربر رد شد', 'success');
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در رد کاربر'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.userId);
    try {
      const res = await deleteAdminUser(deleteTarget.userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.userId !== deleteTarget.userId));
        setDeleteTarget(null);
        showToast('کاربر حذف شد', 'success');
      }
    } catch (err: unknown) {
      showToast(extractApiErrorMessage(err, 'خطا در حذف کاربر'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'نام',
      flex: 1,
      minWidth: 160,
      valueGetter: (_value, row: UserListDto) => row.fullName || row.userName || '-',
    },
    {
      field: 'phoneNumber',
      headerName: 'موبایل',
      width: 150,
      valueGetter: (_value, row: UserListDto) => row.phoneNumber || '-',
    },
    {
      field: 'userTypeName',
      headerName: 'نوع کاربر',
      width: 140,
      valueGetter: (_value, row: UserListDto) => row.userTypeName || '-',
    },
    {
      field: 'createdDate',
      headerName: 'تاریخ ثبت',
      width: 130,
      valueGetter: (_value, row: UserListDto) =>
        row.createdDate ? new Date(row.createdDate).toLocaleDateString('fa-IR') : '-',
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const user = params.row as UserListDto;
        const busy = actionLoading === user.userId;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="تایید و فعال‌سازی">
              <span>
                <IconButton size="small" color="success" onClick={() => handleApprove(user)} disabled={busy}>
                  {busy ? <CircularProgress size={18} /> : <ApproveIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="رد">
              <span>
                <IconButton size="small" color="warning" onClick={() => handleReject(user)} disabled={busy}>
                  <RejectIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="حذف">
              <span>
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(user)} disabled={busy}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PendingIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>در انتظار تایید</Typography>
        </Box>
        <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
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
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.4)}`,
            }}
          >
            <PendingIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>در انتظار تایید</Typography>
              <Chip label={users.length.toLocaleString('fa-IR')} color="warning" size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              کاربران ثبت‌شده توسط ادمین که هنوز فعال نشده‌اند و امکان ورود ندارند
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="بروزرسانی">
            <IconButton
              onClick={() => fetchPending()}
              sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.16) } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
            onClick={() => setRegisterOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.4)}` }}
          >
            ثبت کاربر
          </Button>
        </Box>
      </Box>

      {/* ── Stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #fb8c00, #ef6c00)',
              color: '#fff',
              boxShadow: `0 4px 14px ${alpha('#fb8c00', 0.25)}`,
            }}
          >
            <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1, mb: 0.5 }}>
                  {users.length.toLocaleString('fa-IR')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>در انتظار تایید</Typography>
              </Box>
              <PendingIcon sx={{ fontSize: 40, opacity: 0.2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Pending Table ── */}
      {users.length === 0 && !error ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
          <PendingIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">کاربری در انتظار تایید نیست</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            با دکمه «ثبت کاربر» می‌توانید کاربر جدید (پشتیبانی / راننده / صاحب بار) بسازید
          </Typography>
        </Box>
      ) : (
        <DataTable rows={users} columns={columns} getRowId={(row: UserListDto) => row.userId} />
      )}

      {/* ── Register Modal ── */}
      <RegisterUserModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => {
          showToast('کاربر ساخته شد، در انتظار فعال‌سازی', 'success');
          fetchPending(true);
        }}
        onError={(message) => showToast(message, 'error')}
      />

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> حذف کاربر
        </DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف کاربر <strong>{deleteTarget?.fullName || deleteTarget?.userName}</strong> اطمینان دارید؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>حذف منطقی انجام می‌شود.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">انصراف</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={actionLoading === deleteTarget?.userId}
            sx={{ borderRadius: 2 }}
          >
            {actionLoading === deleteTarget?.userId ? <CircularProgress size={24} color="inherit" /> : 'حذف قطعی'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
