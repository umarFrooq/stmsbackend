import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Typography,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const BranchList = ({
  branches,
  onEdit,
  onDelete,
  onCreate,
  loading,
  error,
  page,
  rowsPerPage,
  totalBranches, // Total count from API for pagination
  onPageChange,
  onRowsPerPageChange,
}) => {

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{mt: 2, mb: 2}}>
        {error}
      </Typography>
    );
  }

  // This case handles after loading, if there's no error but branches array is empty.
  if (!branches || branches.length === 0) {
    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2, p:3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                Branches
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onCreate}
                >
                    Add Branch
                </Button>
            </Box>
            <Typography align="center">No branches found. Click "Add Branch" to create one.</Typography>
        </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Branches
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreate}
        >
          Add Branch
        </Button>
      </Box>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Branch Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((branch) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={branch.id || branch._id}> {/* Handle both id and _id from MongoDB */}
                <TableCell>{branch.name}</TableCell>
                <TableCell>{branch.branchCode}</TableCell>
                <TableCell>{branch.type}</TableCell>
                <TableCell>{`${branch.address?.street || 'N/A'}, ${branch.address?.city || 'N/A'}`}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(branch)} color="primary" aria-label={`edit ${branch.name}`}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => onDelete(branch.id || branch._id)} color="error" aria-label={`delete ${branch.name}`}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalBranches}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Paper>
  );
};

export default BranchList;
