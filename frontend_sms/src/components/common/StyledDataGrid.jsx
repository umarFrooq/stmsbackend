import React from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import PropTypes from 'prop-types';

// Styled MUI DataGrid Component
const StyledDataGrid = ({
  rows,
  columns,
  loading,
  error,
  title,
  checkboxSelection = false,
  onSelectionModelChange,
  selectionModel,
  pagination = true,
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  autoHeight = false,
  minHeight = 400,
  slots,
  slotProps,
  ...rest
}) => {
  const defaultSlots = {
    loadingOverlay: LinearProgress,
    toolbar: GridToolbar,
    ...slots,
  };

  if (error) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight }}>
        <Typography color="error">
          {typeof error === 'string' ? error : error.message || 'Error loading data.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto', width: '100%' }}>
      <Paper sx={{ height: autoHeight ? 'auto' : minHeight, width: '100%' }} elevation={2}>
        {title && (
          <Typography variant="h6" sx={{ p: 2 }}>
            {title}
          </Typography>
        )}
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection={checkboxSelection}
          onRowSelectionModelChange={onSelectionModelChange}
          rowSelectionModel={selectionModel}
          pagination={pagination}
          initialState={{
            pagination: {
              paginationModel: { pageSize: pageSize, page: 0 },
            },
          }}
          pageSizeOptions={rowsPerPageOptions}
          autoHeight={autoHeight}
          slots={defaultSlots}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
            ...slotProps,
          }}
          {...rest}
        />
      </Paper>
    </Box>
  );
};

StyledDataGrid.propTypes = {
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  title: PropTypes.string,
  checkboxSelection: PropTypes.bool,
  onSelectionModelChange: PropTypes.func,
  selectionModel: PropTypes.any,
  pagination: PropTypes.bool,
  pageSize: PropTypes.number,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  autoHeight: PropTypes.bool,
  minHeight: PropTypes.number,
  slots: PropTypes.object,
  slotProps: PropTypes.object,
};

export default StyledDataGrid;
