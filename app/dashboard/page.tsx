'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  Schedule as PendingIcon,
  PriorityHigh as UrgentIcon,
  Handshake as MatchIcon,
  SupportAgent as SupportIcon,
  PhoneInTalk as CallIcon,
  Today as TodayIcon,
  People as PeopleIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AdminDashboard,
  getAdminDashboard,
  getStatusCounts,
  getSupportQueueCount,
} from '@/app/lib/api';

const n = (value?: number) => (value ?? 0).toLocaleString('fa-IR');

const money = (value?: number | null) =>
  value == null ? '—' : `${value.toLocaleString('fa-IR')} ریال`;

const when = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'همین حالا';
  if (minutes < 60) return `${n(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${n(hours)} ساعت پیش`;
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' }).format(date);
};

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' }).format(new Date(iso));

const todayLabel = () =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

const STATUS_COLOR: Record<string, string> = {
  pendingReview: '#f57c00',
  published: '#2e7d32',
  completed: '#1565c0',
  unpublished: '#546e7a',
  rejected: '#c62828',
  cancelled: '#6d4c41',
  expired: '#8e24aa',
};

const supportStatus = (status: number) =>
  status === 2 ? 'در حال پاسخ' : status === 3 ? 'منتظر کاربر' : 'باز';

const reviewStatus = (status: number) =>
  status === 2 ? 'تأیید شده' : status === 3 ? 'رد شده' : 'در انتظار';

const userKind = (kind: number) => (kind === 1 ? 'راننده' : 'صاحب بار');

export default function DashboardPage() {
  const theme = useTheme();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRestart, setNeedsRestart] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAdminDashboard();
      if (response.success && response.data) {
        setData(response.data);
        setNeedsRestart(false);
      }
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 404 || status === 405 || status === 400) {
        setNeedsRestart(true);
        const [counts, support] = await Promise.all([
          getStatusCounts().catch(() => null),
          getSupportQueueCount().catch(() => null),
        ]);
        const row = counts?.data;
        setData({
          generatedAt: new Date().toISOString(),
          kpis: {
            pendingReview: row?.pendingReview ?? 0,
            published: row?.published ?? 0,
            completed: row?.completed ?? 0,
            rejected: row?.rejected ?? 0,
            cancelled: row?.cancelled ?? 0,
            expired: row?.expired ?? 0,
            unpublished: row?.unpublished ?? 0,
            urgentPublished: 0,
            cargosToday: 0,
            requestsToday: 0,
            pendingRequests: 0,
            acceptedRequests: 0,
            callsToday: 0,
            callsTotal: 0,
            openSupport: support?.data?.count ?? 0,
            unreadSupport: 0,
            drivers: 0,
            loadOwners: 0,
            pendingReviews: 0,
            reviewsToday: 0,
            averageRating: 0,
          },
          activity: [],
          statuses: [],
          lanes: [],
          pendingCargos: [],
          urgentCargos: [],
          pendingRequests: [],
          supportQueue: [],
          recentReviews: [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // واکشی اولیه‌ی داشبورد هنگام باز شدن صفحه
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const kpis = data?.kpis;
  const maxStatus = Math.max(1, ...(data?.statuses.map((item) => item.count) ?? [1]));
  const maxLane = Math.max(1, ...(data?.lanes.map((item) => item.count) ?? [1]));
  const chart = (data?.activity ?? []).map((day) => ({
    name: dayLabel(day.date),
    بار: day.cargos,
    پیشنهاد: day.requests,
    تماس: day.calls,
  }));

  const cards = [
    { title: 'منتظر تأیید', value: kpis?.pendingReview, hint: 'صف بررسی ادمین', href: '/dashboard/cargo-approval', icon: <PendingIcon />, color: '#f57c00' },
    { title: 'بار فعال', value: kpis?.published, hint: 'روی لودبورد', href: '/dashboard/cargos', icon: <ShippingIcon />, color: '#2e7d32' },
    { title: 'بار فوری', value: kpis?.urgentPublished, hint: 'منتشرشده و فوری', href: '/dashboard/cargos', icon: <UrgentIcon />, color: '#c62828' },
    { title: 'پیشنهاد باز', value: kpis?.pendingRequests, hint: 'کرایه راننده', href: '/dashboard/cargos', icon: <MatchIcon />, color: '#1565c0' },
    { title: 'تطبیق شده', value: kpis?.acceptedRequests, hint: 'پیشنهاد پذیرفته', href: '/dashboard/cargos', icon: <DoneIcon />, color: '#00897b' },
    { title: 'پشتیبانی باز', value: kpis?.openSupport, hint: `${n(kpis?.unreadSupport)} پیام خوانده‌نشده`, href: '/dashboard/support', icon: <SupportIcon />, color: '#6a1b9a' },
  ];

  const pulse = [
    { label: 'بار امروز', value: n(kpis?.cargosToday), icon: <TodayIcon fontSize="small" /> },
    { label: 'پیشنهاد امروز', value: n(kpis?.requestsToday), icon: <MatchIcon fontSize="small" /> },
    { label: 'تماس امروز', value: n(kpis?.callsToday), icon: <CallIcon fontSize="small" /> },
    { label: 'کل تماس‌ها', value: n(kpis?.callsTotal), icon: <CallIcon fontSize="small" /> },
    { label: 'راننده‌ها', value: n(kpis?.drivers), icon: <PeopleIcon fontSize="small" /> },
    { label: 'صاحبان بار', value: n(kpis?.loadOwners), icon: <PeopleIcon fontSize="small" /> },
    { label: 'میانگین امتیاز', value: (kpis?.averageRating ?? 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 }), icon: <StarIcon fontSize="small" /> },
    { label: 'نظر در انتظار', value: n(kpis?.pendingReviews), icon: <ReviewIcon fontSize="small" /> },
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            اتاق فرمان حمل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {todayLabel()} · وضعیت بار، پیشنهاد راننده، تماس و پشتیبانی
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading} variant="outlined">
          بروزرسانی
        </Button>
      </Stack>

      {needsRestart && (
        <Card elevation={0} sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'warning.main' }}>
          <Typography variant="body2">
            آمار خلاصه از سرویس قبلی خوانده شد. برای صف‌ها، مسیرها و نمودار هفت‌روزه، API را ری‌استارت کنید.
          </Typography>
        </Card>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }} key={card.title}>
            <Card
              component={Link}
              href={card.href}
              elevation={0}
              sx={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRight: `4px solid ${card.color}`,
                transition: 'transform .2s, box-shadow .2s',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 10px 24px ${alpha(card.color, 0.18)}` },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                  <Box sx={{ color: card.color, display: 'flex' }}>{card.icon}</Box>
                </Stack>
                {loading && !data ? (
                  <Skeleton width={72} height={42} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 0.5 }}>{n(card.value)}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">{card.hint}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {pulse.map((item) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.label}>
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', px: 1.5, py: 1.25 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                {item.icon}
                <Typography variant="caption">{item.label}</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
                {loading && !data ? '—' : item.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title="هفت روز اخیر" subtitle="بار جدید، پیشنهاد کرایه و تماس راننده">
            {chart.length === 0 ? (
              <Empty text="بعد از ری‌استارت API، روند هفت‌روزه اینجا می‌آید." />
            ) : (
              <Box sx={{ height: 280, direction: 'ltr' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.08)} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="بار" fill="#f57c00" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="پیشنهاد" fill="#1565c0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="تماس" fill="#00897b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel title="ترکیب وضعیت بار" subtitle="به‌جز حذف‌شده‌ها">
            <Stack spacing={1.5}>
              {(data?.statuses ?? []).map((item) => (
                <Box key={item.key}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{n(item.count)}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(item.count / maxStatus) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 99,
                      bgcolor: alpha(STATUS_COLOR[item.key] ?? '#888', 0.15),
                      '& .MuiLinearProgress-bar': { bgcolor: STATUS_COLOR[item.key] ?? '#888', borderRadius: 99 },
                    }}
                  />
                </Box>
              ))}
              {!loading && (data?.statuses.length ?? 0) === 0 && <Empty text="وضعیت تفکیکی هنوز از سرور نیامده است." />}
            </Stack>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="صف تأیید"
            action={<TextLink href="/dashboard/cargo-approval">همه</TextLink>}
          >
            <Stack spacing={1.25}>
              {(data?.pendingCargos ?? []).map((cargo) => (
                <RowLink key={cargo.id} href="/dashboard/cargo-approval">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {cargo.originCity} به {cargo.destinationCity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cargo.ownerName} · {cargo.vehicleType || 'خودرو نامشخص'} · {when(cargo.createdAt)}
                      </Typography>
                    </Box>
                    {cargo.isUrgent && <Chip size="small" color="error" label="فوری" />}
                  </Stack>
                </RowLink>
              ))}
              {!loading && (data?.pendingCargos.length ?? 0) === 0 && <Empty text="باری در صف تأیید نیست." />}
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="مسیرهای فعال" subtitle="استان مبدأ به مقصد، بین بارهای منتشرشده">
            <Stack spacing={1.25}>
              {(data?.lanes ?? []).map((lane) => (
                <Box key={`${lane.origin}-${lane.destination}`}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">{lane.origin} به {lane.destination}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{n(lane.count)}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(lane.count / maxLane) * 100}
                    sx={{ mt: 0.5, height: 6, borderRadius: 99 }}
                  />
                </Box>
              ))}
              {!loading && (data?.lanes.length ?? 0) === 0 && <Empty text="بار منتشرشده‌ای برای ساخت مسیر نیست." />}
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="پیشنهادهای باز راننده" action={<TextLink href="/dashboard/cargos">بارها</TextLink>}>
            <Stack spacing={1.25}>
              {(data?.pendingRequests ?? []).map((item) => (
                <RowLink key={item.id} href="/dashboard/cargos">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {item.driverName} · {money(item.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.originCity} به {item.destinationCity}
                    {item.referenceNumber ? ` · ${item.referenceNumber}` : ''} · {when(item.createdAt)}
                  </Typography>
                </RowLink>
              ))}
              {!loading && (data?.pendingRequests.length ?? 0) === 0 && <Empty text="پیشنهاد بازی وجود ندارد." />}
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="پشتیبانی" action={<TextLink href="/dashboard/support">صف</TextLink>}>
            <Stack spacing={1.25}>
              {(data?.supportQueue ?? []).map((item) => (
                <RowLink key={item.id} href="/dashboard/support">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {item.userName} · {userKind(item.userKind)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.lastMessage || 'بدون پیام'} · {when(item.at)}
                      </Typography>
                    </Box>
                    <Chip size="small" label={item.unread > 0 ? `${n(item.unread)} جدید` : supportStatus(item.status)} color={item.unread > 0 ? 'warning' : 'default'} />
                  </Stack>
                </RowLink>
              ))}
              {!loading && (data?.supportQueue.length ?? 0) === 0 && <Empty text="گفتگوی بازی نیست." />}
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="بارهای فوری روی بورد" action={<TextLink href="/dashboard/cargos">بارها</TextLink>}>
            <Stack spacing={1.25}>
              {(data?.urgentCargos ?? []).map((cargo) => (
                <RowLink key={cargo.id} href="/dashboard/cargos">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {cargo.originCity} به {cargo.destinationCity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cargo.ownerName} · {cargo.referenceNumber || 'بدون شماره'} · {when(cargo.createdAt)}
                  </Typography>
                </RowLink>
              ))}
              {!loading && (data?.urgentCargos.length ?? 0) === 0 && <Empty text="بار فوری منتشرشده‌ای نیست." />}
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel title="آخرین نظرات" action={<TextLink href="/dashboard/reviews">نظرات</TextLink>}>
            <Stack spacing={1.25}>
              {(data?.recentReviews ?? []).map((review) => (
                <RowLink key={review.id} href="/dashboard/reviews">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {review.reviewerName} به {review.ownerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {'★'.repeat(Math.max(0, Math.min(5, review.rating)))} · {review.comment || 'بدون متن'} · {when(review.createdAt)}
                      </Typography>
                    </Box>
                    <Chip size="small" label={reviewStatus(review.status)} />
                  </Stack>
                </RowLink>
              ))}
              {!loading && (data?.recentReviews.length ?? 0) === 0 && <Empty text="نظری ثبت نشده است." />}
            </Stack>
          </Panel>
        </Grid>
      </Grid>
    </Box>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', px: 2, pt: 2, pb: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Stack>
      <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
    </Card>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button component={Link} href={href} size="small" endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}>
      {children}
    </Button>
  );
}

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        p: 1.25,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.text.primary, 0.03),
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
      }}
    >
      {children}
    </Box>
  );
}

function Empty({ text }: { text: string }) {
  return <Typography variant="body2" color="text.secondary">{text}</Typography>;
}
