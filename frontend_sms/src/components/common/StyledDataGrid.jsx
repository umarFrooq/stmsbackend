import React from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import PropTypes from 'prop-types';

// This is a basic styled wrapper. MUI X DataGrid is highly customizable.
// Refer to MUI X documentation for advanced features:
// https://mui.com/x/react-data-grid/

const StyledDataGrid = ({
  rows,
  columns,
  loading,
  error, // Pass an error object or message
  title,
  checkboxSelection = false,
  onSelectionModelChange, // For controlled selection
  selectionModel, // For controlled selection
  pagination = true,
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  autoHeight = false, // If true, grid height adjusts to content. Can be slow with many rows.
  minHeight = 400, // Minimum height if autoHeight is false
  slots, // To pass custom slots like Toolbar, Footer, etc.
  slotProps, // Props for the slots
  // ...other DataGrid props can be passed through
  ...rest
}) => {
  const defaultSlots = {
    loadingOverlay: LinearProgress, // Use LinearProgress for loading
    toolbar: GridToolbar, // Default toolbar with quick filter, export, etc.
    ...slots, // Allow overriding default slots
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
    <Paper sx={{ height: autoHeight ? 'auto' : minHeight, width: '100%', overflowX: 'auto' }} elevation={2}>
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
        onRowSelectionModelChange={onSelectionModelChange} // Corrected prop name
        rowSelectionModel={selectionModel} // Corrected prop name
        pagination={pagination}
        initialState={{
          pagination: {
            paginationModel: { pageSize: pageSize, page: 0 }, // Corrected structure
          },
        }}
        pageSizeOptions={rowsPerPageOptions} // Corrected prop name
        autoHeight={autoHeight}
        slots={defaultSlots}
        slotProps={{ // Pass slotProps to the DataGrid
            toolbar: {
                showQuickFilter: true,
                // printOptions: { disableToolbarButton: true }, // Example: disable print
                // csvOptions: { disableToolbarButton: true }, // Example: disable CSV
            },
            ...slotProps
        }}
        // sx={{
        //   '& .MuiDataGrid-columnHeaders': {
        //     backgroundColor: 'primary.light', // Example header styling
        //   },
        // }}
        {...rest} // Pass any other DataGrid props
      />
    </Paper>
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
