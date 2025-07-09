import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Box,
  Tooltip,
  Paper,
  Grid,
  Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // For submit
import GradingIcon from '@mui/icons-material/Grading'; // For view submissions / grade
import SubjectIcon from '@mui/icons-material/Subject'; // Placeholder for subject icon
import ClassIcon from '@mui/icons-material/Class'; // Placeholder for grade icon
import EventIcon from '@mui/icons-material/Event'; // For due date
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { format } from 'date-fns'; // Ensure date-fns is installed
import useAuthStore from '../../store/auth.store';

const AssignmentListItem = ({ assignment, onEdit, onDelete, onViewSubmissions, onSubmitAssignment, onViewDetails }) => {
  const { user } = useAuthStore();

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'rootUser';
  const isStudent = user?.role === 'student';

  const canEdit = (isTeacher && assignment.teacherId === user._id) || (isAdmin && user.permissions?.includes('manageAllAssignmentsSchool')); // Simplified permission check
  const canDelete = (isTeacher && assignment.teacherId === user._id) || (isAdmin && user.permissions?.includes('manageAllAssignmentsSchool'));
  const canViewSubmissions = isTeacher || isAdmin;

  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isPastDue = dueDate && dueDate < new Date();

  let statusChip;
    if (assignment.status === 'draft') {
        statusChip = <Chip label="Draft" color="default" size="small" />;
    } else if (isPastDue && assignment.status === 'published') {
        statusChip = <Chip label="Past Due" color="warning" size="small" icon={<HourglassEmptyIcon />} />;
    } else if (assignment.status === 'published') {
        statusChip = <Chip label="Published" color="success" size="small" icon={<CheckCircleOutlineIcon />} />;
    } else if (assignment.status === 'archived') {
        statusChip = <Chip label="Archived" color="default" size="small" />;
    }


  return (
    <Paper elevation={2} sx={{ mb: 2, p: 2, '&:hover': { boxShadow: 4 } }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item key={`${assignment._id}-content`} xs={12} md={isStudent ? 9 : 7}>
          <Typography variant="h6" component="div" gutterBottom>
            {onViewDetails || isStudent ? (
                 <MuiLink component={RouterLink} to={onViewDetails || `/student/assignments/${assignment._id}`} underline="hover">
                    {assignment.title}
                 </MuiLink>
            ) : assignment.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <SubjectIcon fontSize="small" sx={{ mr: 0.5 }} /> {assignment.subjectId?.name || assignment.subjectId}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ClassIcon fontSize="small" sx={{ mr: 0.5 }} /> {assignment.gradeId?.title || assignment.gradeId} {assignment.branchId?.name ? `(${assignment.branchId.name})` : ''}
          </Typography>
          {dueDate && (
            <Typography variant="body2" color={isPastDue ? 'error.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon fontSize="small" sx={{ mr: 0.5 }} /> Due: {format(dueDate, 'PPpp')}
            </Typography>
          )}
           <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Total Marks: {assignment.totalMarks}
          </Typography>
        </Grid>

        <Grid item key={`${assignment._id}-status`} xs={12} md={isStudent ? 3 : 2} sx={{ textAlign: { xs: 'left', md: 'center' }, mt: {xs: 1, md: 0} }}>
            {statusChip}
        </Grid>

        <Grid item key={`${assignment._id}-actions`} xs={12} md={isStudent ? false : 3} sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', justifyContent: {xs: 'flex-start', md:'flex-end'}, flexWrap: 'wrap', gap: 0.5 }}>
          {isStudent && assignment.status === 'published' && !isPastDue && onSubmitAssignment && (
            <Tooltip title="Submit Assignment">
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<CloudUploadIcon />}
                onClick={() => onSubmitAssignment(assignment._id)}
                component={RouterLink}
                to={`/student/assignments/${assignment._id}/submit`} // Or just trigger a modal
              >
                Submit
              </Button>
            </Tooltip>
          )}
           {isStudent && assignment.status === 'published' && isPastDue && assignment.allowLateSubmission && onSubmitAssignment && (
            <Tooltip title="Submit Late">
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<CloudUploadIcon />}
                onClick={() => onSubmitAssignment(assignment._id)}
                component={RouterLink}
                to={`/student/assignments/${assignment._id}/submit`}
              >
                Submit Late
              </Button>
            </Tooltip>
          )}

          {canViewSubmissions && onViewSubmissions && (
            <Tooltip title="View Submissions">
              <IconButton
                color="info"
                onClick={() => onViewSubmissions(assignment._id)}
                component={RouterLink}
                to={`/teacher/assignments/${assignment._id}/submissions`} // Example route
              >
                <GradingIcon />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && onEdit && (
            <Tooltip title="Edit Assignment">
              <IconButton color="primary" onClick={() => onEdit(assignment._id)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && onDelete && (
            <Tooltip title="Delete Assignment">
              <IconButton color="error" onClick={() => onDelete(assignment._id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
          {/* Generic View Details for admins if not primary action */}
          {isAdmin && onViewDetails && !canViewSubmissions && (
             <Tooltip title="View Details">
              <IconButton color="default" onClick={() => onViewDetails(assignment._id)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AssignmentListItem;
