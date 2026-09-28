'use client';

import { useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Paper } from '@mui/material';

let suppressCount = 0;
let originalError: typeof console.error | null = null;

function suppressFirstChildWarning() {
  if (suppressCount === 0) {
    originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes(':first-child') &&
        args[0].includes('potentially unsafe')
      ) {
        return;
      }
      originalError!(...args);
    };
  }
  suppressCount++;
}

function restoreFirstChildWarning() {
  suppressCount--;
  if (suppressCount === 0 && originalError) {
    console.error = originalError;
    originalError = null;
  }
}

interface DataTableProps {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  getRowId?: (row: any) => string | number;
}

export default function DataTable({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  getRowId,
}: DataTableProps) {
  useEffect(() => {
    suppressFirstChildWarning();
    return () => restoreFirstChildWarning();
  }, []);

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
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize } },
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 300 },
          },
        }}
        disableColumnMenu
        disableColumnSeparator
        disableRowSelectionOnClick
        autoHeight
        sx={{
          border: 0,
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
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
