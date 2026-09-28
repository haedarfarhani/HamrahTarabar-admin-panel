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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  Pagination,
  PaginationItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping as CargoIcon,
  Refresh as RefreshIcon,
  Scale as WeightIcon,
  DirectionsCar as VehicleIcon,
  CalendarMonth as DateIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Warning as UrgentIcon,
  Security as InsuranceIcon,
  Assignment as PermitIcon,
  Inventory as PackageIcon,
  Inventory as InventoryIcon,
  Route as RouteIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  East as EastIcon,
  SwapHoriz as StatusIcon,
  Person as PersonIcon,
  VisibilityOutlined as ViewCountIcon,
} from '@mui/icons-material';
import {
  getCargosByStatusNames,
  deleteCargo,
  updateCargo,
  updateCargoStatus,
  getCargoTypes,
} from '@/app/lib/api';
import {
  CargoLoadDto,
  CargoStatusName,
  CreateCargoLoadDto,
  CargoTypeDto,
} from '@/app/types/api';

/* ───────── Constants ───────── */

const CARGO_STATUS_NAMES: CargoStatusName[] = [
  'Published',
  'Rejected',
  'Cancelled',
  'Expired',
  'Completed',
  'InProgress',
  'Edited',
  'Unpublished',
];

const CARGO_STATUS_BY_NUMBER: Record<number, CargoStatusName> = {
  1: 'Unpublished',
  2: 'Unpublished',
  3: 'Published',
  4: 'Published',
  5: 'Rejected',
  6: 'Cancelled',
  7: 'Expired',
  8: 'Completed',
  9: 'InProgress',
  10: 'Edited',
  11: 'Unpublished',
};

const LEGACY_STATUS_NAMES: Record<string, CargoStatusName> = {
  draft: 'Unpublished',
  underreview: 'Unpublished',
  approved: 'Published',
  onhold: 'Unpublished',
  published: 'Published',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
  completed: 'Completed',
  inprogress: 'InProgress',
  edited: 'Edited',
  unpublished: 'Unpublished',
};

const STATUS_TRANSITIONS: Record<CargoStatusName, CargoStatusName[]> = {
  Unpublished: ['Published', 'Rejected', 'Cancelled'],
  Published: ['Unpublished', 'InProgress', 'Cancelled', 'Expired', 'Edited', 'Rejected'],
  Edited: ['Published', 'Unpublished', 'Cancelled', 'Rejected'],
  Rejected: ['Unpublished', 'Published', 'Cancelled'],
  InProgress: ['Completed', 'Edited', 'Cancelled'],
  Completed: [],
  Expired: [],
  Cancelled: [],
};

const statusLabels: Record<CargoStatusName, string> = {
  Published: 'منتشر شده',
  Rejected: 'رد شده',
  Cancelled: 'لغو شده',
  Expired: 'منقضی شده',
  Completed: 'تکمیل شده',
  InProgress: 'در حال حمل',
  Edited: 'ویرایش شده',
  Unpublished: 'منتظر تأیید',
};

const statusColors: Record<CargoStatusName, string> = {
  Published: '#4caf50',
  Rejected: '#f44336',
  Cancelled: '#9e9e9e',
  Expired: '#795548',
  Completed: '#00c853',
  InProgress: '#1565c0',
  Edited: '#2196f3',
  Unpublished: '#ff9800',
};

const freightCastTypeLabels: Record<string, string> = {
  PerTon: 'به ازای هر تن',
  TotalLoad: 'کل بار',
  Negotiable: 'توافقی',
  PerKilometer: 'به ازای هر کیلومتر',
  Fixed: 'ثابت',
};

const defaultFormData: CreateCargoLoadDto = {
  originProvince: '',
  originCity: '',
  originAddress: '',
  destinationProvince: '',
  destinationCity: '',
  destinationAddress: '',
  cargoTypeID: '',
  cargoWeight: 0,
  vehicleType: '',
  vehicleSubType: '',
  freightCastType: 'Negotiable',
  contactPhoneNumber: '',
};

type FilterStatus = 'all' | 'pending' | CargoStatusName;

const filterTabs: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: 'all', label: 'همه', emoji: '📦' },
  { value: 'pending', label: 'منتظر تأیید', emoji: '⏳' },
  { value: 'Published', label: 'منتشر شده', emoji: '🚀' },
  { value: 'Rejected', label: 'رد شده', emoji: '❌' },
  { value: 'InProgress', label: 'در حال حمل', emoji: '🚚' },
];

const statusesForFilter = (filter: FilterStatus): CargoStatusName[] => {
  if (filter === 'all') return CARGO_STATUS_NAMES;
  if (filter === 'pending') return ['Unpublished', 'Edited'];
  return [filter];
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/* ───────── Helpers ───────── */

const normalizeCargoStatus = (value: unknown): CargoStatusName => {
  if (typeof value === 'number') {
    return CARGO_STATUS_BY_NUMBER[value] || 'Unpublished';
  }

  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    const legacy = LEGACY_STATUS_NAMES[s];
    if (legacy) return legacy;
    const asNumber = Number(s);
    if (!Number.isNaN(asNumber) && CARGO_STATUS_BY_NUMBER[asNumber]) {
      return CARGO_STATUS_BY_NUMBER[asNumber];
    }
    return 'Unpublished';
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidate = obj.name ?? obj.status ?? obj.value;
    if (candidate !== undefined && candidate !== null && candidate !== value) {
      return normalizeCargoStatus(candidate);
    }
  }

  return 'Unpublished';
};

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
};

const formatPrice = (val?: number, currency?: string, displayText?: string) => {
  if (displayText) return displayText;
  if (!val) return 'توافقی';
  const unit = currency === 'Toman' ? 'تومان' : 'ریال';
  return `${val.toLocaleString('fa-IR')} ${unit}`;
};

/* ───────── Page ───────── */

export default function CargosPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [cargos, setCargos] = useState<CargoLoadDto[]>([]);
  const [cargoTypes, setCargoTypes] = useState<CargoTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<CargoLoadDto | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCargoLoadDto>(defaultFormData);
  const [newStatus, setNewStatus] = useState<CargoStatusName>('Published');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCargos = (status: FilterStatus, currentPage: number, size: number) => {
    getCargosByStatusNames(statusesForFilter(status), currentPage, size)
      .then((response) => {
        if (response.success && response.data) {
          setCargos(response.data.items);
          setTotalCount(response.data.totalCount);
          setTotalPages(response.data.totalPages || 1);
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string; errors?: string[] };
        setError(e.errors?.[0] || e.message || 'خطا در دریافت لیست بارها');
      })
      .finally(() => setLoading(false));
  };

  const loadCargos = (status: FilterStatus, currentPage: number, size: number) => {
    setError(null);
    setLoading(true);
    setFilterStatus(status);
    setPage(currentPage);
    setPageSize(size);
  };

  useEffect(() => {
    fetchCargos(filterStatus, page, pageSize);
  }, [filterStatus, page, pageSize]);

  useEffect(() => {
    getCargoTypes()
      .then((response) => {
        if (response.success && response.data) setCargoTypes(response.data);
      })
      .catch(() => undefined);
  }, []);

  const refresh = () => {
    setError(null);
    setLoading(true);
    fetchCargos(filterStatus, page, pageSize);
  };

  const handleView = (cargo: CargoLoadDto) => {
    setSelectedCargo(cargo);
    setViewDialogOpen(true);
  };

  const handleEdit = (cargo: CargoLoadDto) => {
    setSelectedCargo(cargo);
    setFormData({
      originProvince: cargo.originProvince || '',
      originCity: cargo.originCity || '',
      originAddress: cargo.originAddress || '',
      destinationProvince: cargo.destinationProvince || '',
      destinationCity: cargo.destinationCity || '',
      destinationAddress: cargo.destinationAddress || '',
      cargoTypeID: cargo.cargoTypeID || '',
      cargoWeight: cargo.cargoWeight || 0,
      cargoWeightUnit: cargo.cargoWeightUnit,
      cargoVolume: cargo.cargoVolume,
      cargoDescription: cargo.cargoDescription || '',
      packagingType: cargo.packagingType || '',
      vehicleType: cargo.vehicleType || '',
      vehicleSubType: cargo.vehicleSubType || '',
      vehicleSpecialRequirements: cargo.vehicleSpecialRequirements || '',
      freightCastType: cargo.freightCastType || 'Negotiable',
      freight: cargo.freightCast,
      currency: cargo.currency,
      loadingDate: cargo.loadingDate,
      loadingTime: cargo.loadingTime,
      loadingInstructions: cargo.loadingInstructions || '',
      contactPhoneNumber: cargo.contactPhoneNumber || '',
      contactPersonName: cargo.contactPersonName || '',
      isUrgent: cargo.isUrgent,
      requiresInsurance: cargo.requiresInsurance,
      referenceNumber: cargo.referenceNumber || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCargo) return;
    setActionLoading(true);
    try {
      const response = await updateCargo(selectedCargo.cargoLoadID, formData);
      if (response.success && response.data) {
        setCargos(cargos.map((c) => (c.cargoLoadID === selectedCargo.cargoLoadID ? response.data! : c)));
        setEditDialogOpen(false);
        setSelectedCargo(null);
        setSnackbar({ open: true, message: 'بار با موفقیت ویرایش شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در ویرایش بار', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusDialog = (cargo: CargoLoadDto) => {
    const current = normalizeCargoStatus(cargo.status);
    const targets = STATUS_TRANSITIONS[current];
    setSelectedCargo(cargo);
    setNewStatus(targets[0] || 'Published');
    setStatusReason('');
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedCargo) return;
    setActionLoading(true);
    try {
      const response = await updateCargoStatus(selectedCargo.cargoLoadID, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      if (response.success) {
        setStatusDialogOpen(false);
        setSnackbar({
          open: true,
          message: `وضعیت بار به «${statusLabels[newStatus]}» تغییر کرد`,
          severity: 'success',
        });
        refresh();
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[]; status?: number };
      setSnackbar({
        open: true,
        message:
          error.errors?.[0] ||
          error.message ||
          (error.status === 409 ? 'تغییر وضعیت درخواستی پشتیبانی نمی‌شود' : 'خطا در تغییر وضعیت بار'),
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (cargo: CargoLoadDto) => {
    setSelectedCargo(cargo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCargo) return;
    setActionLoading(true);
    try {
      const response = await deleteCargo(selectedCargo.cargoLoadID);
      if (response.success) {
        setCargos(cargos.filter((c) => c.cargoLoadID !== selectedCargo.cargoLoadID));
        setDeleteDialogOpen(false);
        setSelectedCargo(null);
        setSnackbar({ open: true, message: 'بار با موفقیت حذف شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({ open: true, message: error.errors?.[0] || error.message || 'خطا در حذف بار', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const currentStatus = selectedCargo ? normalizeCargoStatus(selectedCargo.status) : null;
  const availableTransitions: CargoStatusName[] = currentStatus ? STATUS_TRANSITIONS[currentStatus] : [];
  const reasonRequired = newStatus === 'Rejected' || newStatus === 'Cancelled';

  if (loading && cargos.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <CargoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            مدیریت بارها
          </Typography>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 6, sm: 3 }}>
              <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2 }} />
        ))}
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <CargoIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              مدیریت بارها
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount.toLocaleString('fa-IR')} بار ثبت شده
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="بروزرسانی">
            <IconButton
              onClick={refresh}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            بار جدید
          </Button>
        </Box>
      </Box>

      {/* ── View Summary ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
          px: 2.5,
          py: 1.5,
          borderRadius: 3,
          bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon sx={{ color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {filterTabs.find((t) => t.value === filterStatus)?.label || 'همه'}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {totalCount.toLocaleString('fa-IR')} بار در این نما
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Filter Tabs ── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', p: 1, borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03) }}>
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.value;
          return (
            <Button
              key={tab.value}
              variant={isActive ? 'contained' : 'text'}
              size="small"
              onClick={() => loadCargos(tab.value, 1, pageSize)}
              sx={{
                borderRadius: 2, px: 2, fontWeight: isActive ? 700 : 500,
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? '#fff' : 'text.secondary',
                boxShadow: isActive ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}` : 'none',
                '&:hover': { bgcolor: isActive ? 'primary.dark' : alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <span style={{ marginLeft: 4 }}>{tab.emoji}</span>
              {tab.label}
            </Button>
          );
        })}
      </Box>

      {/* ── Cargo Cards ── */}
      {loading && cargos.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 4 }} />
          ))}
        </Box>
      ) : cargos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, borderRadius: 4, bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
          <CargoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">باری برای نمایش وجود ندارد</Typography>
          <Typography variant="body2" color="text.disabled">فیلتر انتخاب شده نتیجه‌ای ندارد</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          {cargos.map((cargo) => (
            <CargoCard
              key={cargo.cargoLoadID}
              cargo={cargo}
              onEdit={() => handleEdit(cargo)}
              onDelete={() => handleDelete(cargo)}
              onViewDetails={() => handleView(cargo)}
              onChangeStatus={() => handleStatusDialog(cargo)}
              isDark={isDark}
            />
          ))}
        </Box>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            p: 2,
            borderRadius: 3,
            bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">نمایش</Typography>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Button
                key={size}
                size="small"
                variant={pageSize === size ? 'outlined' : 'text'}
                onClick={() => loadCargos(filterStatus, 1, size)}
                sx={{ minWidth: 40, borderRadius: 2, fontWeight: 700 }}
              >
                {size.toLocaleString('fa-IR')}
              </Button>
            ))}
            <Typography variant="caption" color="text.secondary">در هر صفحه</Typography>
          </Box>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => loadCargos(filterStatus, value, pageSize)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            renderItem={(item) => (
              <PaginationItem {...item} sx={{ borderRadius: 2, fontWeight: item.selected ? 700 : 500 }} />
            )}
          />
        </Box>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        {selectedCargo && (
          (() => {
            const status = normalizeCargoStatus(selectedCargo.status);
            return (
              <>
                <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, color: '#fff', px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CargoIcon />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>جزئیات بار</Typography>
                      {selectedCargo.referenceNumber && <Typography variant="caption" sx={{ opacity: 0.8 }}>شماره مرجع: {selectedCargo.referenceNumber}</Typography>}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={statusLabels[status]} size="small" sx={{ bgcolor: alpha('#fff', 0.2), color: '#fff', fontWeight: 600, backdropFilter: 'blur(10px)' }} />
                    <IconButton onClick={() => setViewDialogOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                  </Box>
                </Box>
                <DialogContent sx={{ p: 3 }}>
                  {/* Route */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, p: 2.5, mb: 3, borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.04) : alpha(theme.palette.primary.main, 0.04), border: '1px dashed', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">مبدأ</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedCargo.originCity}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedCargo.originProvince}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <EastIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                      <RouteIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">مقصد</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedCargo.destinationCity}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedCargo.destinationProvince}</Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2.5}>
                    {[
                      { icon: <WeightIcon />, label: 'وزن', value: selectedCargo.cargoWeight ? `${selectedCargo.cargoWeight} ${selectedCargo.cargoWeightUnit === 'Ton' ? 'تن' : selectedCargo.cargoWeightUnit}` : '-' },
                      { icon: <PackageIcon />, label: 'حجم', value: selectedCargo.cargoVolume ? `${selectedCargo.cargoVolume} متر مکعب` : '-' },
                      { icon: <PackageIcon />, label: 'نوع بسته‌بندی', value: selectedCargo.packagingType || '-' },
                      { icon: <VehicleIcon />, label: 'نوع وسیله', value: `${selectedCargo.vehicleType || '-'} ${selectedCargo.vehicleSubType ? `(${selectedCargo.vehicleSubType})` : ''}` },
                      { icon: <MoneyIcon />, label: 'قیمت', value: formatPrice(selectedCargo.freightCast, selectedCargo.currency, selectedCargo.freightDisplayText) },
                      { icon: <InfoIcon />, label: 'نوع قیمت‌گذاری', value: selectedCargo.freightCastTypeLabel || freightCastTypeLabels[selectedCargo.freightCastType] || '-' },
                      { icon: <DateIcon />, label: 'تاریخ بارگیری', value: formatDate(selectedCargo.loadingDate) },
                      { icon: <TimeIcon />, label: 'پایان بارگیری', value: formatDate(selectedCargo.loadingDateEnd) },
                      { icon: <PhoneIcon />, label: 'شماره تماس', value: selectedCargo.contactPhoneNumber || '-' },
                      { icon: <PersonIcon />, label: 'نام تماس', value: selectedCargo.contactPersonName || '-' },
                      { icon: <ViewCountIcon />, label: 'بازدید', value: (selectedCargo.viewCount || 0).toLocaleString('fa-IR') },
                      { icon: <ViewIcon />, label: 'رانندگان علاقمند', value: (selectedCargo.interestedDriversCount || 0).toLocaleString('fa-IR') },
                      { icon: <DateIcon />, label: 'تاریخ انتشار', value: formatDate(selectedCargo.publishedDate) },
                      { icon: <DateIcon />, label: 'تاریخ انقضا', value: formatDate(selectedCargo.expiryDate) },
                      { icon: <DateIcon />, label: 'تاریخ ثبت', value: formatDate(selectedCargo.createdDate) },
                    ].map((item, i) => (
                      <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', flexShrink: 0 }}>{item.icon}</Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                    {selectedCargo.cargoDescription && (
                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>توضیحات</Typography>
                        <Typography variant="body2" sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03), lineHeight: 2 }}>{selectedCargo.cargoDescription}</Typography>
                      </Grid>
                    )}
                    {selectedCargo.loadingInstructions && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>دستورات بارگیری</Typography>
                        <Typography variant="body2" sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03), lineHeight: 2 }}>{selectedCargo.loadingInstructions}</Typography>
                      </Grid>
                    )}
                    {(selectedCargo.statusNote || selectedCargo.rejectionReason) && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity={selectedCargo.rejectionReason ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
                          {selectedCargo.rejectionReason ? `دلیل رد: ${selectedCargo.rejectionReason}` : `یادداشت وضعیت: ${selectedCargo.statusNote}`}
                        </Alert>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedCargo.isUrgent && <Chip icon={<UrgentIcon />} label="فوری" color="error" size="small" />}
                        {selectedCargo.requiresInsurance && <Chip icon={<InsuranceIcon />} label="نیاز به بیمه" color="warning" size="small" />}
                        {selectedCargo.requiresPermit && <Chip icon={<PermitIcon />} label="نیاز به مجوز" color="info" size="small" />}
                        <Chip label={selectedCargo.isActive ? 'فعال' : 'غیرفعال'} color={selectedCargo.isActive ? 'success' : 'default'} size="small" variant="outlined" />
                      </Box>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button onClick={() => setViewDialogOpen(false)} color="inherit">بستن</Button>
                  <Button variant="outlined" startIcon={<StatusIcon />} onClick={() => { setViewDialogOpen(false); handleStatusDialog(selectedCargo); }}>
                    تغییر وضعیت
                  </Button>
                  <Button variant="contained" color="primary" onClick={() => { setViewDialogOpen(false); handleEdit(selectedCargo); }}>
                    ویرایش
                  </Button>
                </DialogActions>
              </>
            );
          })()
        )}
      </Dialog>

      {/* ── Status Change Dialog ── */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusIcon color="primary" />
          تغییر وضعیت بار
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              شماره مرجع: <strong>{selectedCargo?.referenceNumber || '-'}</strong>
            </Typography>
            {selectedCargo && (
              <Chip
                size="small"
                label={`وضعیت فعلی: ${statusLabels[normalizeCargoStatus(selectedCargo.status)]}`}
                sx={{
                  bgcolor: alpha(statusColors[normalizeCargoStatus(selectedCargo.status)], 0.15),
                  color: statusColors[normalizeCargoStatus(selectedCargo.status)],
                  fontWeight: 700,
                }}
              />
            )}
          </Box>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              {availableTransitions.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  این وضعیت نهایی است و امکان تغییر ندارد.
                </Alert>
              ) : (
                <FormControl fullWidth size="small">
                  <InputLabel>وضعیت جدید</InputLabel>
                  <Select
                    value={newStatus}
                    label="وضعیت جدید"
                    onChange={(e) => setNewStatus(e.target.value as CargoStatusName)}
                  >
                    {availableTransitions.map((s) => (
                      <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            {availableTransitions.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label={reasonRequired ? 'دلیل تغییر (الزامی)' : 'دلیل تغییر (اختیاری)'}
                  placeholder={reasonRequired ? 'برای رد یا لغو بار، دلیل را وارد کنید...' : 'دلیل تغییر وضعیت...'}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  error={reasonRequired && !statusReason.trim()}
                  helperText={reasonRequired && !statusReason.trim() ? 'برای این وضعیت دلیل الزامی است' : undefined}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)} color="inherit">انصراف</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={confirmStatusChange}
            disabled={actionLoading || availableTransitions.length === 0 || (reasonRequired && !statusReason.trim())}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'تغییر وضعیت'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>ویرایش بار</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="استان مبدأ" value={formData.originProvince} onChange={(e) => setFormData({ ...formData, originProvince: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="شهر مبدأ" value={formData.originCity} onChange={(e) => setFormData({ ...formData, originCity: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12 }}><TextField label="آدرس مبدأ" value={formData.originAddress} onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="استان مقصد" value={formData.destinationProvince} onChange={(e) => setFormData({ ...formData, destinationProvince: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="شهر مقصد" value={formData.destinationCity} onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12 }}><TextField label="آدرس مقصد" value={formData.destinationAddress} onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>نوع بار</InputLabel>
                <Select value={formData.cargoTypeID} label="نوع بار" onChange={(e) => setFormData({ ...formData, cargoTypeID: e.target.value })}>
                  {cargoTypes.map((type) => (
                    <MenuItem key={type.cargoTypeID} value={type.cargoTypeID}>{type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField label="وزن (تن)" type="number" value={formData.cargoWeight} onChange={(e) => setFormData({ ...formData, cargoWeight: Number(e.target.value) })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField label="حجم (متر مکعب)" type="number" value={formData.cargoVolume || ''} onChange={(e) => setFormData({ ...formData, cargoVolume: Number(e.target.value) })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="نوع وسیله" value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="زیرنوع وسیله" value={formData.vehicleSubType} onChange={(e) => setFormData({ ...formData, vehicleSubType: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>نوع قیمت</InputLabel>
                <Select value={formData.freightCastType} label="نوع قیمت" onChange={(e) => setFormData({ ...formData, freightCastType: e.target.value as CreateCargoLoadDto['freightCastType'] })}>
                  <MenuItem value="PerTon">به ازای هر تن</MenuItem>
                  <MenuItem value="TotalLoad">کل بار</MenuItem>
                  <MenuItem value="Negotiable">توافقی</MenuItem>
                  <MenuItem value="PerKilometer">به ازای هر کیلومتر</MenuItem>
                  <MenuItem value="Fixed">ثابت</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField label="قیمت" type="number" value={formData.freight || ''} onChange={(e) => setFormData({ ...formData, freight: Number(e.target.value) })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>واحد پول</InputLabel>
                <Select value={formData.currency || 'Toman'} label="واحد پول" onChange={(e) => setFormData({ ...formData, currency: e.target.value as CreateCargoLoadDto['currency'] })}>
                  <MenuItem value="Toman">تومان</MenuItem>
                  <MenuItem value="Rial">ریال</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="شماره تماس" value={formData.contactPhoneNumber} onChange={(e) => setFormData({ ...formData, contactPhoneNumber: e.target.value })} fullWidth dir="ltr" size="small" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="نام تماس" value={formData.contactPersonName || ''} onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })} fullWidth size="small" /></Grid>
            <Grid size={{ xs: 12 }}><TextField label="توضیحات" value={formData.cargoDescription || ''} onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })} fullWidth multiline rows={3} size="small" /></Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02), p: 1.5, borderRadius: 2 }}>
                <FormControlLabel control={<Switch checked={formData.isUrgent || false} onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })} />} label="فوری" />
                <FormControlLabel control={<Switch checked={formData.requiresInsurance || false} onChange={(e) => setFormData({ ...formData, requiresInsurance: e.target.checked })} />} label="نیاز به بیمه" />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="primary" onClick={handleSaveEdit} disabled={actionLoading} sx={{ borderRadius: 2, px: 4 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'ذخیره تغییرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon />
          حذف بار
        </DialogTitle>
        <DialogContent>
          <Typography>آیا از حذف بار <strong>{selectedCargo?.referenceNumber || selectedCargo?.cargoLoadID}</strong> اطمینان دارید؟</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>این عمل قابل بازگشت نیست و اطلاعات آن به طور کامل پاک خواهد شد.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">انصراف</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={actionLoading} sx={{ borderRadius: 2 }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'حذف قطعی'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* ═══════════════════════════════════════════════
   CARGO CARD COMPONENT FOR MANAGEMENT
   ═══════════════════════════════════════════════ */

interface CargoCardProps {
  cargo: CargoLoadDto;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onChangeStatus: () => void;
  isDark: boolean;
}

function CargoCard({ cargo, onEdit, onDelete, onViewDetails, onChangeStatus, isDark }: CargoCardProps) {
  const theme = useTheme();
  const status = normalizeCargoStatus(cargo.status);
  const statusColor = statusColors[status];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4, border: '1px solid', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
        overflow: 'visible', transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        '&:hover': { borderColor: alpha(statusColor, 0.5), boxShadow: `0 8px 30px ${alpha(statusColor, 0.12)}`, transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ background: `linear-gradient(135deg, ${alpha(statusColor, isDark ? 0.2 : 0.08)}, ${alpha(statusColor, isDark ? 0.08 : 0.03)})`, borderBottom: '1px solid', borderColor: alpha(statusColor, 0.12), px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'center', minWidth: 80 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>{cargo.originCity || '-'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{cargo.originProvince}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5 }}>
            <Box sx={{ width: 40, height: 2, bgcolor: alpha(statusColor, 0.4), borderRadius: 1 }} />
            <EastIcon sx={{ color: statusColor, fontSize: 22 }} />
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 80 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>{cargo.destinationCity || '-'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{cargo.destinationProvince}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {cargo.isUrgent && <Chip icon={<UrgentIcon sx={{ fontSize: 14 }} />} label="فوری" size="small" sx={{ bgcolor: alpha('#f44336', 0.12), color: '#f44336', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />}
          {cargo.referenceNumber && <Chip label={cargo.referenceNumber} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', height: 24 }} />}
          <Chip label={statusLabels[status]} size="small" sx={{ bgcolor: alpha(statusColor, 0.15), color: statusColor, fontWeight: 700, fontSize: '0.72rem', height: 26, border: `1px solid ${alpha(statusColor, 0.3)}` }} />
        </Box>
      </Box>

      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box sx={{ height: '100%', minHeight: 120, borderRadius: 3, bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.04), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, border: '2px dashed', borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08) }}>
              <CargoIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">بدون تصویر</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 9 }}>
            {cargo.cargoDescription && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02), borderRight: `3px solid ${statusColor}` }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {cargo.cargoDescription.length > 150 ? cargo.cargoDescription.substring(0, 150) + '...' : cargo.cargoDescription}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
              <DetailItem icon={<WeightIcon sx={{ fontSize: 16 }} />} label="وزن" value={cargo.cargoWeight ? `${cargo.cargoWeight} ${cargo.cargoWeightUnit === 'Ton' ? 'تن' : cargo.cargoWeightUnit || 'تن'}` : '-'} color={statusColor} isDark={isDark} />
              <DetailItem icon={<VehicleIcon sx={{ fontSize: 16 }} />} label="نوع وسیله" value={cargo.vehicleType || '-'} color={statusColor} isDark={isDark} />
              <DetailItem icon={<DateIcon sx={{ fontSize: 16 }} />} label="تاریخ بارگیری" value={formatDate(cargo.loadingDate)} color={statusColor} isDark={isDark} />
              <DetailItem icon={<MoneyIcon sx={{ fontSize: 16 }} />} label="قیمت" value={formatPrice(cargo.freightCast, cargo.currency, cargo.freightDisplayText)} color={statusColor} isDark={isDark} highlight />
              <DetailItem icon={<InfoIcon sx={{ fontSize: 16 }} />} label="نوع قیمت‌گذاری" value={cargo.freightCastTypeLabel || freightCastTypeLabels[cargo.freightCastType] || '-'} color={statusColor} isDark={isDark} />
              <DetailItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label="تماس" value={cargo.contactPhoneNumber || '-'} color={statusColor} isDark={isDark} ltr />
              <DetailItem icon={<PersonIcon sx={{ fontSize: 16 }} />} label="نام تماس" value={cargo.contactPersonName || '-'} color={statusColor} isDark={isDark} />
              <DetailItem icon={<PackageIcon sx={{ fontSize: 16 }} />} label="بسته‌بندی" value={cargo.packagingType || '-'} color={statusColor} isDark={isDark} />
              <DetailItem icon={<ViewCountIcon sx={{ fontSize: 16 }} />} label="بازدید" value={(cargo.viewCount || 0).toLocaleString('fa-IR')} color={statusColor} isDark={isDark} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <Box sx={{ borderTop: '1px solid', borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06), px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" startIcon={<ViewIcon />} onClick={onViewDetails} sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>مشاهده جزئیات</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="تغییر وضعیت">
            <IconButton size="small" onClick={onChangeStatus} sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) } }}>
              <StatusIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ویرایش">
            <IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
}

function DetailItem({ icon, label, value, color, isDark, highlight, ltr }: { icon: React.ReactNode; label: string; value: string; color: string; isDark: boolean; highlight?: boolean; ltr?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 2, bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.1), color: color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 600, fontSize: '0.78rem', color: highlight ? color : 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(ltr ? { direction: 'ltr', textAlign: 'right' } : {}) }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
