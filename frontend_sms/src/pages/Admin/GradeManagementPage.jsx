import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import GradeFormDialog from '../../components/grade/GradeFormDialog';
import NotificationToast from '../../components/common/NotificationToast';
import useAuthStore from '../../store/auth.store';

import gradeService from '../../services/gradeService'; // Assuming default export

const GradeManagementPage = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalGrades, setTotalGrades] = useState(0);

  const { user } = useAuthStore(); // Get user info for schoolId etc.
  // Assuming schoolId is directly on user object or user.school.id
  // This needs to be robust based on your actual auth store structure.
  const currentSchoolId = user?.schoolScope || user?.school?.id || user?.school;


  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchGrades = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const params = {
        page: paginationModel.page + 1, // API is 1-indexed
        limit: paginationModel.pageSize,
        populate: 'branchId,nextGradeId', // Populate branch and nextGrade for display
      };
      // If the user is rootUser, they might need to specify a school or see all.
      // For admin/superadmin, the backend should scope by their school.
      // If user is rootUser and no currentSchoolId context is set, they might see all grades.
      // We can add a school filter here if needed for rootUser.
      if (user?.role === 'rootUser' && currentSchoolId) {
        params.schoolId = currentSchoolId; // Example: root user viewing grades for a selected school
      }


      const response = await gradeService.getGrades(params);
      if (response && Array.isArray(response.results)) {
        setGrades(response.results);
        setTotalGrades(response.totalResults || 0);
      } else {
        setGrades([]);
        setTotalGrades(0);
        showToast('Failed to fetch grades: Unexpected response structure.', 'error');
      }
    } catch (err) {
      const errorMessage = err.message || err.data?.message || 'Failed to fetch grades.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setGrades([]);
      setTotalGrades(0);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, user?.role, currentSchoolId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const handleAddGrade = () => {
    setEditingGrade(null);
    setIsGradeFormOpen(true);
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setIsGradeFormOpen(true);
  };

  const handleDeleteGrade = (grade) => {
    setGradeToDelete(grade);
    setConfirmDialogOpen(true);
  };

  const confirmGradeDelete = async () => {
    if (!gradeToDelete) return;
    setIsDeleting(true);
    try {
      const params = {};
      if (user?.role === 'rootUser' && currentSchoolId) {
        // For rootUser, ensure the delete operation is scoped if a school context is active
        params.schoolIdToScopeTo = currentSchoolId;
      }
      await gradeService.deleteGrade(gradeToDelete.id, params);
      showToast(`Grade "${gradeToDelete.title}" deleted successfully.`, 'success');
      fetchGrades(false); // Refetch without full loading spinner
    } catch (err) {
      showToast(err.message || err.data?.message || "Failed to delete grade.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setGradeToDelete(null);
    }
  };

  const handleGradeFormSubmit = async (values, isEditingMode, gradeId) => {
    try {
      let payload = { ...values };
      if (user?.role === 'rootUser' && currentSchoolId && !isEditingMode) {
        payload.schoolIdForGrade = currentSchoolId; // For root user creating grade in a specific school context
      }
      if (user?.role === 'rootUser' && currentSchoolId && isEditingMode) {
        payload.schoolIdToScopeTo = currentSchoolId; // For root user editing grade in a specific school context
      }


      if (isEditingMode) {
        await gradeService.updateGrade(gradeId, payload);
        showToast('Grade updated successfully!', 'success');
      } else {
        await gradeService.createGrade(payload);
        showToast('Grade created successfully!', 'success');
      }
      setIsGradeFormOpen(false);
      fetchGrades(false); // Refetch without full loading spinner
      return true;
    } catch (apiError) {
      showToast(apiError.message || apiError.data?.message || `Failed to ${isEditingMode ? 'update' : 'create'} grade.`, 'error');
      return false;
    }
  };

  const handleGradeFormClose = (submittedSuccessfully) => {
    setIsGradeFormOpen(false);
    setEditingGrade(null);
    // If not submitted successfully, or if you always want to ensure data is fresh:
    // if (!submittedSuccessfully) fetchGrades(false);
  };

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
    // fetchGrades will be called by useEffect due to paginationModel change
  };


  const columns = [
    { field: 'title', headerName: 'Grade Title', flex: 1, minWidth: 180 },
    { field: 'levelCode', headerName: 'Level Code', width: 130, renderCell: params => params.value || 'N/A' },
    {
      field: 'branch',
      headerName: 'Branch/Campus',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params?.row?.branchId?.name || 'N/N',
    },
    {
      field: 'sections',
      headerName: 'Sections',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        Array.isArray(params.row.sections) && params.row.sections.length > 0
          ? params.row.sections.map(section => <Chip key={section} label={section} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)
          : 'No sections'
      )
    },
    {
      field: 'nextGrade',
      headerName: 'Next Grade',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params?.row?.nextGradeId?.title || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Grade">
            <IconButton onClick={() => handleEditGrade(params.row)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Grade">
            <IconButton onClick={() => handleDeleteGrade(params.row)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading && grades.length === 0) {
    return <LoadingSpinner fullScreen message="Loading grades..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h1">
          Grade Management
        </Typography>
        <Box>
            <Tooltip title="Refresh Grades">
                <IconButton onClick={() => fetchGrades(true)} sx={{ mr: 1 }}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGrade}
            >
            Add Grade
            </Button>
        </Box>
      </Box>

      {error && !loading && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <StyledDataGrid
        rows={grades}
        columns={columns}
        loading={loading}
        rowCount={totalGrades}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        paginationMode="server"
        getRowId={(row) => row.id}
        autoHeight // Use autoHeight if content is not too long, or set minHeight
        minHeight={400}
        // sx={{ p: 0 }} // Remove padding if Paper from StyledDataGrid has it
      />

      <GradeFormDialog
        open={isGradeFormOpen}
        onClose={handleGradeFormClose}
        grade={editingGrade}
        onSubmit={handleGradeFormSubmit}
        currentSchoolId={user?.role === 'rootUser' ? currentSchoolId : undefined} // Pass school context for root users
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmGradeDelete}
        title="Confirm Deletion"
        contentText={`Are you sure you want to delete grade "${gradeToDelete?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
        confirmButtonColor="error"
      />

      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)}
      />
    </Box>
  );
};

export default GradeManagementPage;
