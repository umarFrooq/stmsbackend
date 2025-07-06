import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Grid, TextField, MenuItem, CircularProgress, Typography, Paper
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import useAuthStore from '../../store/auth.store';
import classScheduleService from '../../services/classScheduleService';
import branchService from '../../services/branchService';
import gradeService from '../../services/gradeService';
import subjectService from '../../services/subjectService';
import userService from '../../services/userService'; // For fetching teachers
import NotificationToast from '../common/NotificationToast';


const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClassScheduleForm = ({ scheduleId, schoolIdFromAdmin, onSave, onCancel }) => {
  // schoolIdFromAdmin is the admin's scoped schoolId
  const [formData, setFormData] = useState({
    branchId: '',
    gradeId: '',
    section: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: '',
    startTime: '09:00',
    endTime: '10:00',
    // schoolId will be set from schoolIdFromAdmin
  });

  const [branches, setBranches] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Toast notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Fetch existing schedule if scheduleId is provided (for editing)
  useEffect(() => {
    if (scheduleId && schoolIdFromAdmin) {
      setLoading(true);
      classScheduleService.getClassScheduleById(scheduleId, 'branchId,gradeId,subjectId,teacherId,schoolId')
        .then(data => {
          setFormData({
            branchId: data.branchId?.id || '',
            gradeId: data.gradeId?.id || '',
            section: data.section || '',
            subjectId: data.subjectId?.id || '',
            teacherId: data.teacherId?.id || '',
            dayOfWeek: data.dayOfWeek || '',
            startTime: data.startTime || '09:00',
            endTime: data.endTime || '10:00',
          });
        })
        .catch(err => {
          showToast(`Error fetching schedule details: ${err.message}`, 'error');
          setFormError(`Failed to load schedule data. ${err.message}`);
        })
        .finally(() => setLoading(false));
    }
  }, [scheduleId, schoolIdFromAdmin]);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    if (!schoolIdFromAdmin) return;
    setLoading(true);
    try {
      // Fetch Branches for the admin's school
      const branchParams = { schoolId: schoolIdFromAdmin, limit: 200, sortBy: 'name:asc' };
      const branchRes = await branchService.getAllBranches(branchParams);
      setBranches(branchRes.results || []);

      // Fetch Grades for the admin's school (can be further filtered by selected branch if needed)
      const gradeParams = { schoolId: schoolIdFromAdmin, limit: 500, sortBy: 'title:asc' };
      // If formData.branchId is set, could add it to gradeParams, but makes deps complex.
      // For now, load all grades for school, then filter in dropdown or rely on backend validation.
      const gradeRes = await gradeService.getGrades(gradeParams);
      setGrades(gradeRes.results || []);

      // Fetch Subjects for the admin's school
      const subjectParams = { schoolId: schoolIdFromAdmin, limit: 1000, sortBy: 'title:asc' };
      const subjectRes = await subjectService.getSubjects(subjectParams);
      setSubjects(subjectRes.results || []);

      // Fetch Teachers for the admin's school
      const teacherParams = { schoolId: schoolIdFromAdmin, role: 'teacher', limit: 500,  };
      const teacherRes = await userService.getAllUsers(teacherParams); // Assuming getAllUsers returns { data: { results: [] } }
      setTeachers(teacherRes.data?.results || []);

    } catch (err) {
      showToast(`Error fetching dropdown data: ${err.message}`, 'error');
      setFormError(`Failed to load selection data. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [schoolIdFromAdmin]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);


  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData(prevFormData => {
      const newFormData = { ...prevFormData, [name]: value };

      // If branchId changes, reset gradeId because the list of available grades will change.
      if (name === 'branchId') {
        newFormData.gradeId = '';
      }

      // Add similar logic if other fields depend on changes here, e.g., if subjects depended on grade.
      // For now, only grade depends on branch. Section might conceptually depend on grade, but it's free text.

      return newFormData;
    });

    if (fieldErrors[name]) {
      setFieldErrors(prevFieldErrors => ({ ...prevFieldErrors, [name]: '' }));
    }
    // If branchId changed, also clear any existing gradeId error since it's reset.
    if (name === 'branchId' && fieldErrors.gradeId) {
        setFieldErrors(prevFieldErrors => ({ ...prevFieldErrors, gradeId: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.branchId) errors.branchId = 'Branch is required';
    if (!formData.gradeId) errors.gradeId = 'Grade is required';
    if (!formData.section.trim()) errors.section = 'Section is required';
    if (!formData.subjectId) errors.subjectId = 'Subject is required';
    if (!formData.teacherId) errors.teacherId = 'Teacher is required';
    if (!formData.dayOfWeek) errors.dayOfWeek = 'Day of the week is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.endTime = 'End time must be after start time';
    }
    // Basic time format check (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (formData.startTime && !timeRegex.test(formData.startTime)) errors.startTime = 'Invalid time format (HH:MM)';
    if (formData.endTime && !timeRegex.test(formData.endTime)) errors.endTime = 'Invalid time format (HH:MM)';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      showToast('Please correct the errors in the form.', 'warning');
      return;
    }
    setLoading(true);
    setFormError('');

    const payload = { ...formData, schoolId: schoolIdFromAdmin };

    try {
      if (scheduleId) { // Editing existing schedule
        await classScheduleService.updateClassSchedule(scheduleId, payload);
        showToast('Class schedule updated successfully!', 'success');
      } else { // Creating new schedule
        await classScheduleService.createClassSchedule(payload);
        showToast('Class schedule created successfully!', 'success');
      }
      if (onSave) onSave(); // Callback to refresh list or close modal
    } catch (err) {
      showToast(err.message || 'Failed to save schedule.', 'error');
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !scheduleId) { // Show full spinner only on initial dropdown data load for new form
      return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  }

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" gutterBottom>
        {scheduleId ? 'Edit Class Schedule' : 'Add New Class Schedule'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              name="branchId"
              label="Branch"
              value={formData.branchId}
              onChange={handleChange}
              error={!!fieldErrors.branchId}
              helperText={fieldErrors.branchId}
              required
              disabled={loading}
            >
              <MenuItem value=""><em>Select Branch</em></MenuItem>
              {branches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              name="gradeId"
              label="Grade"
              value={formData.gradeId}
              onChange={handleChange}
              error={!!fieldErrors.gradeId}
              helperText={fieldErrors.gradeId}
              required
              disabled={loading || !formData.branchId} // Disable if no branch selected
            >
              <MenuItem value=""><em>Select Grade</em></MenuItem>
              {grades
                .filter(g => !formData.branchId || g.branchId === formData.branchId) // Optional: Filter grades by selected branch
                .map(grade => (
                  <MenuItem key={grade.id} value={grade.id}>{grade.title}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="section"
              label="Section"
              value={formData.section}
              onChange={handleChange}
              error={!!fieldErrors.section}
              helperText={fieldErrors.section}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              name="subjectId"
              label="Subject"
              value={formData.subjectId}
              onChange={handleChange}
              error={!!fieldErrors.subjectId}
              helperText={fieldErrors.subjectId}
              required
              disabled={loading}
            >
              <MenuItem value=""><em>Select Subject</em></MenuItem>
              {subjects.map(subject => (
                <MenuItem key={subject.id} value={subject.id}>{subject.title} ({subject.subjectCode})</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              name="teacherId"
              label="Teacher"
              value={formData.teacherId}
              onChange={handleChange}
              error={!!fieldErrors.teacherId}
              helperText={fieldErrors.teacherId}
              required
              disabled={loading}
            >
              <MenuItem value=""><em>Select Teacher</em></MenuItem>
              {teachers.map(teacher => (
                <MenuItem key={teacher.id} value={teacher.id}>{teacher.fullname}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              name="dayOfWeek"
              label="Day of the Week"
              value={formData.dayOfWeek}
              onChange={handleChange}
              error={!!fieldErrors.dayOfWeek}
              helperText={fieldErrors.dayOfWeek}
              required
              disabled={loading}
            >
              <MenuItem value=""><em>Select Day</em></MenuItem>
              {DAYS_OF_WEEK.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="startTime"
              label="Start Time (HH:MM)"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              error={!!fieldErrors.startTime}
              helperText={fieldErrors.startTime}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="endTime"
              label="End Time (HH:MM)"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              error={!!fieldErrors.endTime}
              helperText={fieldErrors.endTime}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min
            />
          </Grid>

          {formError && (
            <Grid item xs={12}>
              <Alert severity="error">{formError}</Alert>
            </Grid>
          )}

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              startIcon={<CancelIcon />}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
              disabled={loading}
            >
              {scheduleId ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </Grid>
        </Grid>
      </form>
      <NotificationToast open={toastOpen} message={toastMessage} severity={toastSeverity} handleClose={() => setToastOpen(false)} />
    </Paper>
  );
};

export default ClassScheduleForm;
