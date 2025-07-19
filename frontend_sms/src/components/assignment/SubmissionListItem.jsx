import React from 'react';
import {
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Box,
  Tooltip,
  IconButton,
  Paper,
  Grid,
  Link as MuiLink,
  List,
  ListItemIcon,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article'; // For files
import GradingIcon from '@mui/icons-material/Grading';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For late

import useAuthStore from '../../store/auth.store';

const SubmissionListItem = ({ submission, onGrade, onView }) => {
  const { user } = useAuthStore();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'rootUser';
  const isStudent = user?.role === 'student';

  const submissionDate = submission.submissionDate ? new Date(submission.submissionDate) : null;
  const gradedDate = submission.gradedDate ? new Date(submission.gradedDate) : null;

  let statusChip;
  if (submission.status === 'graded') {
    statusChip = <Chip label="Graded" color="success" size="small" icon={<CheckCircleIcon />} />;
  } else if (submission.status === 'submitted' || submission.status === 'pending_review') {
    statusChip = <Chip label="Submitted" color="info" size="small" icon={<PendingIcon />} />;
  } else if (submission.status === 'resubmitted') {
    statusChip = <Chip label="Resubmitted" color="warning" size="small" icon={<PendingIcon />} />;
  } else {
    statusChip = <Chip label={submission.status || "Unknown"} size="small" />;
  }

  return (
    <Paper elevation={1} sx={{ mb: 2, p: 2, '&:hover': { boxShadow: 3 } }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={isStudent ? 8 : 5}>
          {isTeacherOrAdmin && (
            <Typography variant="subtitle2" color="text.primary">
              Student: {submission.studentId?.firstName || 'N/A'} {submission.studentId?.lastName || ''} ({submission.studentId?.email || 'No Email'})
            </Typography>
          )}
          {isStudent && (
             <Typography variant="subtitle1" color="text.primary">
              Assignment: <MuiLink component={RouterLink} to={`/student/assignments/${submission.assignmentId?._id || submission.assignmentId}`}>
                {submission.assignmentId?.title || 'View Assignment'}
              </MuiLink>
            </Typography>
          )}
          {submissionDate && (
            <Typography variant="caption" color="text.secondary" display="block">
              Submitted: {submissionDate.toLocaleString()}
              {submission.isLateSubmission && <Chip label="Late" color="error" size="small" icon={<ErrorOutlineIcon />} sx={{ ml: 1 }} />}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={2} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
          {statusChip}
        </Grid>

        <Grid item xs={12} sm={isStudent ? 4 : 2} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
          {submission.status === 'graded' && (
            <Typography variant="body2" fontWeight="bold">
              Marks: {submission.obtainedMarks ?? 'N/A'} / {submission.assignmentId?.totalMarks ?? 'N/A'}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={isStudent ? false : 3} sx={{ textAlign: 'right' }}>
         <Box sx={{ display: 'flex', justifyContent: {xs: 'flex-start', sm:'flex-end'}, flexWrap: 'wrap', gap: 0.5 }}>
          {isTeacherOrAdmin && submission.status !== 'graded' && onGrade && (
            <Tooltip title="Grade Submission">
              <IconButton color="primary" onClick={() => onGrade(submission._id)}>
                <GradingIcon />
              </IconButton>
            </Tooltip>
          )}
          {isTeacherOrAdmin && submission.status === 'graded' && onGrade && ( // Allow re-grading or viewing graded details
             <Tooltip title="View/Edit Grade">
              <IconButton color="secondary" onClick={() => onGrade(submission._id)}>
                <GradingIcon />
              </IconButton>
            </Tooltip>
          )}
           {onView && ( // Generic view button
            <Tooltip title="View Submission Details">
              <IconButton color="default" onClick={() => onView(submission._id)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          )}
          </Box>
        </Grid>

        {submission.submittedFiles && submission.submittedFiles.length > 0 && (
            <Grid item xs={12} sx={{mt: 1}}>
                <Typography variant="caption" display="block" color="text.secondary">Submitted Files:</Typography>
                <List dense disablePadding>
                    {submission.submittedFiles.map((file, index) => (
                        <ListItem key={index} disableGutters sx={{pt:0, pb:0}}>
                            <ListItemIcon sx={{minWidth: '30px'}}><ArticleIcon fontSize="small" /></ListItemIcon>
                            <ListItemText
                                primary={
                                    <MuiLink href={file.filePath} target="_blank" rel="noopener noreferrer" underline="hover">
                                        {file.fileName || 'View File'}
                                    </MuiLink>
                                }
                                secondary={file.fileType}
                                primaryTypographyProps={{variant: 'body2'}}
                                secondaryTypographyProps={{variant: 'caption'}}
                            />
                        </ListItem>
                    ))}
                </List>
            </Grid>
        )}
        {submission.status === 'graded' && submission.teacherRemarks && (
             <Grid item xs={12} sx={{mt: 0.5}}>
                <Typography variant="caption" display="block" color="text.secondary" sx={{fontWeight:'bold'}}>Teacher Remarks:</Typography>
                <Typography variant="body2" sx={{pl:1, whiteSpace: 'pre-wrap'}}>{submission.teacherRemarks}</Typography>
            </Grid>
        )}

      </Grid>
    </Paper>
  );
};

export default SubmissionListItem;
