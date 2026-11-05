'use client';

import dynamic from 'next/dynamic';
import { GridColDef, GridToolbar, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { Paper, Skeleton } from '@mui/material';

// DataGrid در SSR استایل‌هایی با سلکتور :first-child تولید می‌کند که React 19
// درباره‌ی آن هشدار می‌دهد. با بارگذاری فقط سمت کلاینت، این استایل‌ها هرگز در
// سرور رندر نمی‌شوند و هشدار کاملاً از بین می‌رود.
const DataGrid = dynamic(
  () => import('@mui/x-data-grid').then((mod) => mod.DataGrid),
  {
    ssr: false,
    loading: () => <Skeleton variant="rounded" height={400} sx={{ borderRadius: 0 }} />,
  }
) as unknown as typeof import('@mui/x-data-grid').DataGrid;

export interface DataTableServerSide {
  /** تعداد کل رکوردها از meta.totalCount */
  rowCount: number;
  /** صفحه‌ی صفر-مبنا */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
}

interface DataTableProps<T = Record<string, unknown>> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  getRowId?: (row: T) => string | number;
  /** در صورت ارائه، صفحه‌بندی و سورت سمت‌سرور فعال می‌شود */
  serverSide?: DataTableServerSide;
  /** مخفی کردن تولبار جست‌وجو (در حالت سرور، فیلتر سمت‌کاربر گمراه‌کننده است) */
  hideToolbar?: boolean;
  localeText?: { noRowsLabel?: string };
}

export default function DataTable<T = Record<string, unknown>>({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  getRowId,
  serverSide,
  hideToolbar = false,
  localeText,
}: DataTableProps<T>) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={getRowId}
        pageSizeOptions={[10, 20, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize } },
        }}
        {...(serverSide
          ? {
              paginationMode: 'server' as const,
              sortingMode: 'server' as const,
              rowCount: serverSide.rowCount,
              paginationModel: { page: serverSide.page, pageSize: serverSide.pageSize },
              onPaginationModelChange: (model: GridPaginationModel) => {
                if (model.page !== serverSide.page) serverSide.onPageChange(model.page);
                if (model.pageSize !== serverSide.pageSize) serverSide.onPageSizeChange(model.pageSize);
              },
              sortModel: serverSide.sortModel,
              onSortModelChange: serverSide.onSortModelChange,
            }
          : {})}
        slots={{ toolbar: hideToolbar ? undefined : GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 300 },
          },
        }}
        localeText={{ noRowsLabel: 'رکوردی یافت نشد', ...localeText }}
        disableColumnMenu
        disableRowSelectionOnClick
        autoHeight
        sx={{
          border: 0,
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          // جایگزین prop حذف‌شده‌ی disableColumnSeparator در MUI v9
          '& .MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'action.hover',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-toolbarContainer': {
            p: 1.5,
            gap: 1,
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: 'action.hover',
          },
        }}
      />
    </Paper>
  );
}
