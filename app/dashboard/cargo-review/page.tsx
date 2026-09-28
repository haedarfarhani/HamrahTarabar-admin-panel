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
  IconButton,
  Tooltip,
  Collapse,
  Snackbar,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  LocalShipping as CargoIcon,
  ArrowBack as ArrowIcon,
  Scale as WeightIcon,
  DirectionsCar as VehicleIcon,
  CalendarMonth as DateIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Warning as UrgentIcon,
  Security as InsuranceIcon,
  Assignment as PermitIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Inventory as PackageIcon,
  Route as RouteIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Description as DescIcon,
  Info as InfoIcon,
  East as EastIcon,
  Publish as PublishIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { getCargosByStatus, approveCargo, rejectCargo, updateCargoStatus } from '@/app/lib/api';
import { CargoLoadDto, CargoStatus } from '@/app/types/api';

/* ───────── Constants ───────── */

const PRESET_REJECTION_REASONS = [
  'اطلاعات بار ناقص یا ناخوانا است',
  'قیمت پیشنهادی غیرواقعی یا نامتناسب است',
  'شماره تماس ثبت شده اشتباه یا غیرفعال است',
  'وزن یا حجم بار با نوع وسیله نقلیه همخوانی ندارد',
  'آدرس مبدأ یا مقصد ناواضح و نامشخص است',
  'این بار به صورت تکراری ثبت شده است',
  'توضیحات بار مغایر با قوانین و مقررات است',
  'بار دارای شرایط خاص و عدم تایید مدارک است',
];

const statusLabels: Record<CargoStatus, string> = {
  4: 'منتشر شده',
  5: 'رد شده',
  6: 'لغو شده',
  7: 'منقضی شده',
  8: 'تکمیل شده',
  9: 'در حال حمل',
  10: 'ویرایش شده',
  11: 'منتظر تأیید',
};

const statusColors: Record<CargoStatus, string> = {
  4: '#4caf50',
  5: '#f44336',
  6: '#9e9e9e',
  7: '#795548',
  8: '#00c853',
  9: '#1565c0',
  10: '#2196f3',
  11: '#ff9800',
};

const freightTypeLabels: Record<string, string> = {
  PerTon: 'به ازای هر تن',
  TotalLoad: 'کل بار',
  Negotiable: 'توافقی',
  PerKilometer: 'به ازای هر کیلومتر',
  Fixed: 'ثابت',
};

type FilterStatus = 'all' | 4 | 5 | 9 | 10 | 11;

const filterTabs: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: 'all', label: 'همه', emoji: '📦' },
  { value: 11, label: 'منتظر تأیید', emoji: '⏳' },
  { value: 10, label: 'ویرایش شده', emoji: '✏️' },
  { value: 4, label: 'منتشر شده', emoji: '🚀' },
  { value: 5, label: 'رد شده', emoji: '❌' },
  { value: 9, label: 'در حال حمل', emoji: '🚚' },
];

/* ───────── Component ───────── */

export default function CargoReviewPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [cargos, setCargos] = useState<CargoLoadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedCargo, setSelectedCargo] = useState<CargoLoadDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  // Per-card reject state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  // Preset reasons modal state
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetTargetCargoId, setPresetTargetCargoId] = useState<string | null>(null);

  const fetchCargos = (filter: FilterStatus) => {
    const statuses: CargoStatus[] =
      filter === 'all' ? [4, 5, 6, 7, 8, 9, 10, 11] : [filter];

    getCargosByStatus(statuses)
      .then((response) => {
        if (response.success && response.data) {
          setCargos(response.data.items);
        }
      })
      .catch((err: unknown) => {
        const error = err as { message?: string; errors?: string[] };
        setError(error.errors?.[0] || error.message || 'خطا در دریافت لیست بارها');
      })
      .finally(() => setLoading(false));
  };

  const selectFilter = (filter: FilterStatus) => {
    setLoading(true);
    setError(null);
    setFilterStatus(filter);
  };

  const refresh = () => {
    setLoading(true);
    setError(null);
    fetchCargos(filterStatus);
  };

  useEffect(() => {
    fetchCargos(filterStatus);
  }, [filterStatus]);

  const handleApprove = async (cargo: CargoLoadDto) => {
    setActionLoading(cargo.cargoLoadID);
    try {
      const response = await approveCargo(cargo.cargoLoadID);
      if (response.success) {
        setCargos((prev) =>
          prev.map((c) =>
            c.cargoLoadID === cargo.cargoLoadID ? { ...c, status: 4 as CargoStatus } : c
          )
        );
        setSnackbar({ open: true, message: 'بار با موفقیت تایید شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({
        open: true,
        message: error.errors?.[0] || error.message || 'خطا در تایید بار',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (cargo: CargoLoadDto) => {
    setActionLoading(cargo.cargoLoadID);
    try {
      const response = await approveCargo(cargo.cargoLoadID);
      if (response.success) {
        const publishResponse = await updateCargoStatus(cargo.cargoLoadID, {
          status: 4,
        });
        if (publishResponse.success) {
          setCargos((prev) =>
            prev.map((c) =>
              c.cargoLoadID === cargo.cargoLoadID ? { ...c, status: 4 as CargoStatus } : c
            )
          );
          setSnackbar({ open: true, message: 'بار با موفقیت منتشر شد', severity: 'success' });
          }
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({
        open: true,
        message: error.errors?.[0] || error.message || 'خطا در انتشار بار',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (cargo: CargoLoadDto) => {
    setActionLoading(cargo.cargoLoadID);
    const reason = rejectReasons[cargo.cargoLoadID] || '';
    try {
      const response = await rejectCargo(cargo.cargoLoadID, reason || undefined);
      if (response.success) {
        setCargos((prev) =>
          prev.map((c) =>
            c.cargoLoadID === cargo.cargoLoadID
              ? { ...c, status: 5 as CargoStatus, rejectionReason: reason }
              : c
          )
        );
        setRejectingId(null);
        setRejectReasons((prev) => {
          const next = { ...prev };
          delete next[cargo.cargoLoadID];
          return next;
        });
        setSnackbar({ open: true, message: 'بار رد شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] };
      setSnackbar({
        open: true,
        message: error.errors?.[0] || error.message || 'خطا در رد بار',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPresetDialog = (cargoId: string) => {
    setPresetTargetCargoId(cargoId);
    setPresetDialogOpen(true);
  };

  const handleSelectPresetReason = (reason: string) => {
    if (presetTargetCargoId) {
      setRejectReasons((prev) => ({
        ...prev,
        [presetTargetCargoId]: reason,
      }));
    }
    setPresetDialogOpen(false);
    setPresetTargetCargoId(null);
  };

  const filteredCargos = cargos;

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const formatPrice = (val?: number, currency?: string) => {
    if (!val) return 'توافقی';
    const unit = currency === 'Toman' ? 'تومان' : 'ریال';
    return `${val.toLocaleString('fa-IR')} ${unit}`;
  };

  /* ───────── Render ───────── */

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <CargoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            بررسی و تایید بارها
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
          <Skeleton
            key={i}
            variant="rounded"
            height={280}
            sx={{ borderRadius: 3, mb: 2 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
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
              بررسی و تایید بارها
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cargos.length} بار ثبت شده
            </Typography>
          </Box>
        </Box>
        <Tooltip title="بروزرسانی">
          <IconButton
            onClick={refresh}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {filterTabs.find((t) => t.value === filterStatus)?.label || 'همه'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {cargos.length.toLocaleString('fa-IR')} بار در این نما
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Filter Tabs ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          flexWrap: 'wrap',
          p: 1,
          borderRadius: 3,
          bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.value;
          return (
            <Button
              key={tab.value}
              variant={isActive ? 'contained' : 'text'}
              size="small"
              onClick={() => selectFilter(tab.value)}
              sx={{
                borderRadius: 2,
                px: 2,
                fontWeight: isActive ? 700 : 500,
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? '#fff' : 'text.secondary',
                boxShadow: isActive ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}` : 'none',
                '&:hover': {
                  bgcolor: isActive ? 'primary.dark' : alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <span style={{ marginLeft: 4 }}>{tab.emoji}</span>
              {tab.label}
            </Button>
          );
        })}
      </Box>

      {/* ── Cargo Cards ── */}
      {filteredCargos.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            borderRadius: 4,
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
          }}
        >
          <CargoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            باری برای نمایش وجود ندارد
          </Typography>
          <Typography variant="body2" color="text.disabled">
            فیلتر انتخاب شده نتیجه‌ای ندارد
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {filteredCargos.map((cargo) => (
            <CargoCard
              key={cargo.cargoLoadID}
              cargo={cargo}
              isRejecting={rejectingId === cargo.cargoLoadID}
              rejectReason={rejectReasons[cargo.cargoLoadID] || ''}
              actionLoading={actionLoading === cargo.cargoLoadID}
              onApprove={() => handleApprove(cargo)}
              onPublish={() => handlePublish(cargo)}
              onStartReject={() => setRejectingId(cargo.cargoLoadID)}
              onCancelReject={() => {
                setRejectingId(null);
                setRejectReasons((prev) => {
                  const next = { ...prev };
                  delete next[cargo.cargoLoadID];
                  return next;
                });
              }}
              onRejectReasonChange={(val) =>
                setRejectReasons((prev) => ({ ...prev, [cargo.cargoLoadID]: val }))
              }
              onOpenPresetDialog={() => handleOpenPresetDialog(cargo.cargoLoadID)}
              onConfirmReject={() => handleReject(cargo)}
              onViewDetails={() => {
                setSelectedCargo(cargo);
                setDetailOpen(true);
              }}
              formatDate={formatDate}
              formatPrice={formatPrice}
              isDark={isDark}
            />
          ))}
        </Box>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              overflow: 'hidden',
            },
          },
        }}
      >
        {selectedCargo && (
          <>
            {/* Dialog Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: '#fff',
                px: 3,
                py: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CargoIcon />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    جزئیات بار
                  </Typography>
                  {selectedCargo.referenceNumber && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      شماره مرجع: {selectedCargo.referenceNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={statusLabels[selectedCargo.status]}
                  size="small"
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <IconButton onClick={() => setDetailOpen(false)} sx={{ color: '#fff' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              {/* Route */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  p: 2.5,
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: isDark ? alpha('#fff', 0.04) : alpha(theme.palette.primary.main, 0.04),
                  border: '1px dashed',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    مبدأ
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedCargo.originCity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCargo.originProvince}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <EastIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <RouteIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    مقصد
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedCargo.destinationCity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCargo.destinationProvince}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2.5}>
                {/* Cargo Details */}
                {[
                  { icon: <WeightIcon />, label: 'وزن', value: selectedCargo.cargoWeight ? `${selectedCargo.cargoWeight} تن` : '-' },
                  { icon: <PackageIcon />, label: 'حجم', value: selectedCargo.cargoVolume ? `${selectedCargo.cargoVolume} متر مکعب` : '-' },
                  { icon: <VehicleIcon />, label: 'نوع وسیله', value: `${selectedCargo.vehicleType || '-'} ${selectedCargo.vehicleSubType ? `(${selectedCargo.vehicleSubType})` : ''}` },
                  { icon: <MoneyIcon />, label: 'قیمت', value: formatPrice(selectedCargo.freightCast, selectedCargo.currency) },
                  { icon: <DateIcon />, label: 'تاریخ بارگیری', value: formatDate(selectedCargo.loadingDate) },
                  { icon: <TimeIcon />, label: 'زمان بارگیری', value: selectedCargo.loadingTime || '-' },
                  { icon: <PhoneIcon />, label: 'شماره تماس', value: selectedCargo.contactPhoneNumber || '-' },
                  { icon: <InfoIcon />, label: 'نوع قیمت‌گذاری', value: freightTypeLabels[selectedCargo.freightCastType] || selectedCargo.freightCastType },
                ].map((item, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}

                {/* Description */}
                {selectedCargo.cargoDescription && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      توضیحات بار
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
                        lineHeight: 2,
                      }}
                    >
                      {selectedCargo.cargoDescription}
                    </Typography>
                  </Grid>
                )}

                {/* Addresses */}
                {(selectedCargo.originAddress || selectedCargo.destinationAddress) && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={2}>
                      {selectedCargo.originAddress && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            آدرس مبدأ
                          </Typography>
                          <Typography variant="body2">{selectedCargo.originAddress}</Typography>
                        </Grid>
                      )}
                      {selectedCargo.destinationAddress && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            آدرس مقصد
                          </Typography>
                          <Typography variant="body2">{selectedCargo.destinationAddress}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* Rejection Reason */}
                {selectedCargo.rejectionReason && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        دلیل رد:
                      </Typography>
                      {selectedCargo.rejectionReason}
                    </Alert>
                  </Grid>
                )}

                {/* Flags */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedCargo.isUrgent && (
                      <Chip icon={<UrgentIcon />} label="فوری" color="error" size="small" />
                    )}
                    {selectedCargo.requiresInsurance && (
                      <Chip icon={<InsuranceIcon />} label="نیاز به بیمه" color="warning" size="small" />
                    )}
                    {selectedCargo.requiresPermit && (
                      <Chip icon={<PermitIcon />} label="نیاز به مجوز" color="info" size="small" />
                    )}
                    <Chip
                      label={`${selectedCargo.viewCount?.toLocaleString('fa-IR') || '۰'} بازدید`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${selectedCargo.interestedDriversCount?.toLocaleString('fa-IR') || '۰'} راننده علاقمند`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => setDetailOpen(false)} color="inherit">
                بستن
              </Button>
              {(selectedCargo.status === 10 || selectedCargo.status === 11) && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() => {
                      handleApprove(selectedCargo);
                      setDetailOpen(false);
                    }}
                  >
                    تایید بار
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PublishIcon />}
                    onClick={() => {
                      handlePublish(selectedCargo);
                      setDetailOpen(false);
                    }}
                  >
                    تایید و انتشار
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={() => {
                      setRejectingId(selectedCargo.cargoLoadID);
                      setDetailOpen(false);
                    }}
                  >
                    رد بار
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Preset Reasons Selection Dialog ── */}
      <Dialog
        open={presetDialogOpen}
        onClose={() => setPresetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: '#fff',
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ListAltIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              انتخاب دلیل رد بار (دلایل تکراری)
            </Typography>
          </Box>
          <IconButton onClick={() => setPresetDialogOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            لطفاً یکی از دلایل آماده زیر را انتخاب کنید تا به صورت خودکار در کادر دلیل رد قرار گیرد:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {PRESET_REJECTION_REASONS.map((reason, index) => (
              <Card
                key={index}
                elevation={0}
                onClick={() => handleSelectPresetReason(reason)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                  bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
                  transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    borderColor: 'error.main',
                    bgcolor: alpha(theme.palette.error.main, isDark ? 0.15 : 0.05),
                    transform: 'translateX(-4px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip
                    label={index + 1}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 700, minWidth: 28 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {reason}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{ borderRadius: 2, fontWeight: 600, pointerEvents: 'none' }}
                >
                  انتخاب
                </Button>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setPresetDialogOpen(false)} color="inherit">
            انصراف
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
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

/* ═══════════════════════════════════════════════
   CARGO CARD COMPONENT
   ═══════════════════════════════════════════════ */

interface CargoCardProps {
  cargo: CargoLoadDto;
  isRejecting: boolean;
  rejectReason: string;
  actionLoading: boolean;
  onApprove: () => void;
  onPublish: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onRejectReasonChange: (val: string) => void;
  onOpenPresetDialog: () => void;
  onConfirmReject: () => void;
  onViewDetails: () => void;
  formatDate: (d?: string) => string;
  formatPrice: (val?: number, currency?: string) => string;
  isDark: boolean;
}

function CargoCard({
  cargo,
  isRejecting,
  rejectReason,
  actionLoading,
  onApprove,
  onPublish,
  onStartReject,
  onCancelReject,
  onRejectReasonChange,
  onOpenPresetDialog,
  onConfirmReject,
  onViewDetails,
  formatDate,
  formatPrice,
  isDark,
}: CargoCardProps) {
  const theme = useTheme();
  const statusColor = statusColors[cargo.status] || '#78909c';
  const isUnderReview = cargo.status === 11;
  const isReviewable = cargo.status === 11 || cargo.status === 10;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: isReviewable
          ? alpha(statusColor, 0.35)
          : isDark
          ? alpha('#fff', 0.08)
          : alpha('#000', 0.08),
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        position: 'relative',
        '&:hover': {
          borderColor: alpha(statusColor, 0.5),
          boxShadow: `0 8px 30px ${alpha(statusColor, 0.12)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* ── Top: Route Banner ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(statusColor, isDark ? 0.2 : 0.08)}, ${alpha(statusColor, isDark ? 0.08 : 0.03)})`,
          borderBottom: '1px solid',
          borderColor: alpha(statusColor, 0.12),
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {/* Origin → Destination */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Origin */}
          <Box sx={{ textAlign: 'center', minWidth: 80 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>
              {cargo.originCity || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {cargo.originProvince}
            </Typography>
          </Box>

          {/* Arrow */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 2,
                bgcolor: alpha(statusColor, 0.4),
                borderRadius: 1,
              }}
            />
            <EastIcon sx={{ color: statusColor, fontSize: 22 }} />
          </Box>

          {/* Destination */}
          <Box sx={{ textAlign: 'center', minWidth: 80 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, color: statusColor }}>
              {cargo.destinationCity || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {cargo.destinationProvince}
            </Typography>
          </Box>
        </Box>

        {/* Status + Badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {cargo.isUrgent && (
            <Chip
              icon={<UrgentIcon sx={{ fontSize: 14 }} />}
              label="فوری"
              size="small"
              sx={{
                bgcolor: alpha('#f44336', 0.12),
                color: '#f44336',
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 24,
              }}
            />
          )}
          {cargo.referenceNumber && (
            <Chip
              label={cargo.referenceNumber}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', height: 24 }}
            />
          )}
          <Chip
            label={statusLabels[cargo.status]}
            size="small"
            sx={{
              bgcolor: alpha(statusColor, 0.15),
              color: statusColor,
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 26,
              border: `1px solid ${alpha(statusColor, 0.3)}`,
            }}
          />
        </Box>
      </Box>

      {/* ── Body ── */}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Grid container spacing={2}>
          {/* Left: Image placeholder */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box
              sx={{
                height: '100%',
                minHeight: 160,
                borderRadius: 3,
                bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.04),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                border: '2px dashed',
                borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
              }}
            >
              <CargoIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                بدون تصویر
              </Typography>
            </Box>
          </Grid>

          {/* Right: Info */}
          <Grid size={{ xs: 12, sm: 9 }}>
            {/* Description */}
            {cargo.cargoDescription && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                  borderRight: `3px solid ${statusColor}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {cargo.cargoDescription.length > 150
                    ? cargo.cargoDescription.substring(0, 150) + '...'
                    : cargo.cargoDescription}
                </Typography>
              </Box>
            )}

            {/* Details Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                gap: 1.5,
              }}
            >
              {/* Weight */}
              <DetailItem
                icon={<WeightIcon sx={{ fontSize: 16 }} />}
                label="وزن"
                value={cargo.cargoWeight ? `${cargo.cargoWeight} تن` : '-'}
                color={statusColor}
                isDark={isDark}
              />
              {/* Vehicle */}
              <DetailItem
                icon={<VehicleIcon sx={{ fontSize: 16 }} />}
                label="نوع وسیله"
                value={cargo.vehicleType || '-'}
                color={statusColor}
                isDark={isDark}
              />
              {/* Loading Date */}
              <DetailItem
                icon={<DateIcon sx={{ fontSize: 16 }} />}
                label="تاریخ بارگیری"
                value={formatDate(cargo.loadingDate)}
                color={statusColor}
                isDark={isDark}
              />
              {/* Price */}
              <DetailItem
                icon={<MoneyIcon sx={{ fontSize: 16 }} />}
                label="قیمت"
                value={formatPrice(cargo.freightCast, cargo.currency)}
                color={statusColor}
                isDark={isDark}
                highlight
              />
              {/* Pricing Type */}
              <DetailItem
                icon={<InfoIcon sx={{ fontSize: 16 }} />}
                label="نوع قیمت‌گذاری"
                value={freightTypeLabels[cargo.freightCastType] || cargo.freightCastType || '-'}
                color={statusColor}
                isDark={isDark}
              />
              {/* Contact */}
              <DetailItem
                icon={<PhoneIcon sx={{ fontSize: 16 }} />}
                label="تماس"
                value={cargo.contactPhoneNumber || '-'}
                color={statusColor}
                isDark={isDark}
                ltr
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {/* ── Footer: Actions ── */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
          px: 3,
          py: 1.5,
        }}
      >
        {/* Rejection reason area */}
        <Collapse in={isRejecting}>
          <Box
            sx={{
              mb: 1.5,
              p: 2,
              borderRadius: 3,
              bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.25),
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'error.main' }}>
              ثبت دلیل رد بار
            </Typography>
            <Grid container spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
              <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="دلیل رد بار"
                  placeholder="دلیل رد بار را وارد کنید یا از دکمه دلایل پیش‌فرض انتخاب کنید..."
                  value={rejectReason}
                  onChange={(e) => onRejectReasonChange(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<ListAltIcon />}
                  onClick={onOpenPresetDialog}
                  sx={{
                    height: 53,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    borderWidth: 1.5,
                  }}
                >
                  دلایل پیش‌فرض
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" color="inherit" onClick={onCancelReject} sx={{ borderRadius: 2 }}>
                انصراف
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={onConfirmReject}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <RejectIcon />}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                تایید رد بار
              </Button>
            </Box>
          </Box>
        </Collapse>

        {/* Rejection reason display */}
        {cargo.rejectionReason && !isRejecting && (
          <Alert
            severity="error"
            sx={{
              mb: 1.5,
              borderRadius: 2,
              py: 0,
              '& .MuiAlert-message': { py: 0.5 },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              دلیل رد:{' '}
            </Typography>
            <Typography variant="caption">{cargo.rejectionReason}</Typography>
          </Alert>
        )}

        {/* Action buttons */}
        {!isRejecting && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={onViewDetails}
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': { color: 'primary.main' },
              }}
            >
              مشاهده جزئیات
            </Button>

            {isReviewable && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={onStartReject}
                  disabled={actionLoading}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  رد بار
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ApproveIcon />}
                  onClick={onApprove}
                  disabled={actionLoading}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: `0 4px 14px ${alpha('#4caf50', 0.35)}`,
                    '&:hover': {
                      boxShadow: `0 6px 20px ${alpha('#4caf50', 0.45)}`,
                    },
                  }}
                >
                  تایید بار
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
                  onClick={onPublish}
                  disabled={actionLoading}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '&:hover': {
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                    },
                  }}
                >
                  تایید و انتشار
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}

/* ── Detail Item Sub-component ── */

function DetailItem({
  icon,
  label,
  value,
  color,
  isDark,
  highlight,
  ltr,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  isDark: boolean;
  highlight?: boolean;
  ltr?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 2,
        bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, 0.1),
          color: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: '0.65rem', lineHeight: 1 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: highlight ? 700 : 600,
            fontSize: '0.78rem',
            color: highlight ? color : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...(ltr ? { direction: 'ltr', textAlign: 'right' } : {}),
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
