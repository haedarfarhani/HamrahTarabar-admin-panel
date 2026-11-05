'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar,
  Skeleton,
  TextField,
  InputAdornment,
  Pagination,
  PaginationItem,
  Avatar,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Schedule as DateIcon,
  LocalShipping as CargoIcon,
} from '@mui/icons-material';
import { getReviews, updateReviewStatus } from '@/app/lib/api';
import { ReviewAdminDto, ReviewStatus } from '@/app/types/api';
import { extractApiErrorMessage } from '@/app/lib/admin-user-errors';

/* ───────── Constants ───────── */

type FilterStatus = ReviewStatus | 'all';

const filterTabs: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: 'all', label: 'همه', emoji: '💬' },
  { value: 'Pending', label: 'در انتظار بررسی', emoji: '⏳' },
  { value: 'Approved', label: 'تایید شده', emoji: '✅' },
  { value: 'Rejected', label: 'رد شده', emoji: '❌' },
];

const statusMeta: Record<ReviewStatus, { label: string; color: string }> = {
  Pending: { label: 'در انتظار بررسی', color: '#ff9800' },
  Approved: { label: 'تایید شده', color: '#4caf50' },
  Rejected: { label: 'رد شده', color: '#f44336' },
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const normalizeStatus = (status: unknown): ReviewStatus => {
  if (typeof status === 'number') {
    if (status === 2) return 'Approved';
    if (status === 3) return 'Rejected';
    return 'Pending';
  }

  if (typeof status === 'string') {
    const s = status.trim().toLowerCase();
    if (s === 'approved' || s === '2') return 'Approved';
    if (s === 'rejected' || s === '3') return 'Rejected';
    return 'Pending';
  }

  if (status && typeof status === 'object') {
    const obj = status as Record<string, unknown>;
    const candidate = obj.name ?? obj.status ?? obj.value;
    if (candidate !== undefined && candidate !== null && candidate !== status) {
      return normalizeStatus(candidate);
    }
  }

  return 'Pending';
};

/* ───────── Component ───────── */

export default function ReviewsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [reviews, setReviews] = useState<ReviewAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Pending');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const fetchReviews = (status: FilterStatus, currentPage: number, size: number) => {
    getReviews(status === 'all' ? undefined : status, currentPage, size)
      .then((response) => {
        if (response.success && response.data) {
          setReviews(response.data.items);
          setTotalCount(response.data.totalCount);
          setTotalPages(response.data.totalPages || 1);
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string; errors?: string[] };
        setError(extractApiErrorMessage(e, 'خطا در دریافت نظرات'));
      })
      .finally(() => setLoading(false));
  };

  const loadReviews = (status: FilterStatus, currentPage: number, size: number) => {
    setError(null);
    setLoading(true);
    setFilterStatus(status);
    setPage(currentPage);
    setPageSize(size);
  };

  useEffect(() => {
    fetchReviews(filterStatus, page, pageSize);
  }, [filterStatus, page, pageSize]);

  const refresh = () => {
    setError(null);
    setLoading(true);
    fetchReviews(filterStatus, page, pageSize);
  };

  const handleApprove = async (review: ReviewAdminDto) => {
    setActionLoading(review.id);
    try {
      const response = await updateReviewStatus(review.id, 'Approved');
      if (response.success) {
        setReviews((prev) =>
          prev
            .map((r) =>
              r.id === review.id
                ? { ...r, ...(response.data || ({ status: 'Approved' } as ReviewAdminDto)) }
                : r
            )
            .filter((r) => filterStatus === 'all' || normalizeStatus(r.status) === filterStatus)
        );
        setSnackbar({ open: true, message: 'نظر با موفقیت تایید شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: string[] };
      setSnackbar({
        open: true,
        message: extractApiErrorMessage(e, 'خطا در تایید نظر'),
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (review: ReviewAdminDto) => {
    setActionLoading(review.id);
    try {
      const response = await updateReviewStatus(review.id, 'Rejected');
      if (response.success) {
        setReviews((prev) =>
          prev
            .map((r) =>
              r.id === review.id
                ? { ...r, ...(response.data || ({ status: 'Rejected' } as ReviewAdminDto)) }
                : r
            )
            .filter((r) => filterStatus === 'all' || normalizeStatus(r.status) === filterStatus)
        );
        setSnackbar({ open: true, message: 'نظر رد شد', severity: 'success' });
      }
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: string[] };
      setSnackbar({
        open: true,
        message: extractApiErrorMessage(e, 'خطا در رد نظر'),
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) =>
      [
        r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : '',
        r.ownerFullName,
        r.comment || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [reviews, search]);

  const formatDate = (d?: string | null) => {
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

  /* ───────── Render ───────── */

  if (loading && reviews.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <ReviewIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            نظرات کاربران
          </Typography>
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={140}
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
            <ReviewIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              نظرات کاربران
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount.toLocaleString('fa-IR')} نظر ثبت شده
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="جستجو در نظرات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: 180, sm: 260 },
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
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
      </Box>

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
              onClick={() => loadReviews(tab.value, 1, pageSize)}
              sx={{
                borderRadius: 2,
                px: 2,
                fontWeight: isActive ? 700 : 500,
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? '#fff' : 'text.secondary',
                boxShadow: isActive
                  ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}`
                  : 'none',
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

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Reviews List ── */}
      {loading && filteredReviews.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 4 }} />
          ))}
        </Box>
      ) : filteredReviews.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            borderRadius: 4,
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
          }}
        >
          <ReviewIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            نظری برای نمایش وجود ندارد
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {search ? 'جستجوی شما نتیجه‌ای ندارد' : 'در این وضعیت نظری ثبت نشده است'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              actionLoading={actionLoading === review.id}
              onApprove={() => handleApprove(review)}
              onReject={() => handleReject(review)}
              formatDate={formatDate}
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
            <Typography variant="caption" color="text.secondary">
              نمایش
            </Typography>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Button
                key={size}
                size="small"
                variant={pageSize === size ? 'outlined' : 'text'}
                onClick={() => loadReviews(filterStatus, 1, size)}
                sx={{ minWidth: 40, borderRadius: 2, fontWeight: 700 }}
              >
                {size.toLocaleString('fa-IR')}
              </Button>
            ))}
            <Typography variant="caption" color="text.secondary">
              در هر صفحه
            </Typography>
          </Box>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => loadReviews(filterStatus, value, pageSize)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            renderItem={(item) => (
              <PaginationItem
                {...item}
                sx={{ borderRadius: 2, fontWeight: item.selected ? 700 : 500 }}
              />
            )}
          />
        </Box>
      )}

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
   REVIEW CARD COMPONENT
   ═══════════════════════════════════════════════ */

interface ReviewCardProps {
  review: ReviewAdminDto;
  actionLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  formatDate: (d?: string | null) => string;
  isDark: boolean;
}

function ReviewCard({
  review,
  actionLoading,
  onApprove,
  onReject,
  formatDate,
  isDark,
}: ReviewCardProps) {
  const statusKey = normalizeStatus(review.status);
  const meta = statusMeta[statusKey];
  const reviewerName = review.reviewer
    ? `${review.reviewer.firstName} ${review.reviewer.lastName}`.trim()
    : 'کاربر ناشناس';
  const isPending = statusKey === 'Pending';
  const canApprove = statusKey !== 'Approved';
  const canReject = statusKey !== 'Rejected';

  const initials = reviewerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: isPending
          ? alpha(meta.color, 0.35)
          : isDark
          ? alpha('#fff', 0.08)
          : alpha('#000', 0.08),
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        '&:hover': {
          borderColor: alpha(meta.color, 0.5),
          boxShadow: `0 8px 30px ${alpha(meta.color, 0.12)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* ── Top banner ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(meta.color, isDark ? 0.2 : 0.08)}, ${alpha(
            meta.color,
            isDark ? 0.08 : 0.03
          )})`,
          borderBottom: '1px solid',
          borderColor: alpha(meta.color, 0.12),
          px: 3,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(meta.color, 0.2),
              color: meta.color,
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {initials || <PersonIcon fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {reviewerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              برای {review.ownerFullName || 'کاربر'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {[1, 2, 3, 4, 5].map((star) =>
              star <= review.rating ? (
                <StarIcon key={star} sx={{ fontSize: 18, color: '#ffc107' }} />
              ) : (
                <StarBorderIcon key={star} sx={{ fontSize: 18, color: alpha('#ffc107', 0.5) }} />
              )
            )}
            <Typography variant="caption" sx={{ mr: 0.75, fontWeight: 700, color: meta.color }}>
              {review.rating?.toLocaleString('fa-IR') || '۰'}
            </Typography>
          </Box>
          <Chip
            label={meta.label}
            size="small"
            sx={{
              bgcolor: alpha(meta.color, 0.15),
              color: meta.color,
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 26,
              border: `1px solid ${alpha(meta.color, 0.3)}`,
            }}
          />
        </Box>
      </Box>

      {/* ── Body ── */}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 2 } }}>
        {review.comment ? (
          <Typography
            variant="body2"
            sx={{
              lineHeight: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
              borderRight: `3px solid ${meta.color}`,
            }}
          >
            {review.comment}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            این نظر متنی ندارد
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <DateIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                تاریخ ثبت: {formatDate(review.createdDate || review.reviewDate)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CargoIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                صاحب بار: {review.ownerFullName || '-'}
              </Typography>
            </Box>
          </Box>

          {(canApprove || canReject) && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canReject && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={onReject}
                  disabled={actionLoading}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  رد نظر
                </Button>
              )}
              {canApprove && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={actionLoading ? <CircularProgressSize /> : <ApproveIcon />}
                  onClick={onApprove}
                  disabled={actionLoading}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: `0 4px 14px ${alpha('#4caf50', 0.35)}`,
                    '&:hover': { boxShadow: `0 6px 20px ${alpha('#4caf50', 0.45)}` },
                  }}
                >
                  تایید نظر
                </Button>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function CircularProgressSize() {
  return (
    <Box
      component="span"
      sx={{
        width: 16,
        height: 16,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
        '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
      }}
    />
  );
}
