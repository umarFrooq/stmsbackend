import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Link as MuiLink,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; // Ensure @mui/x-date-pickers is installed
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // Ensure date-fns is installed
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload'; // Placeholder for actual upload

// Services (assuming they exist and are structured similarly to gradeService)
import { subjectService, gradeService, branchService } from '../../services';
import useAuthStore from '../../store/auth.store';

// Helper to check if a value is an object and not null
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);


const AssignmentForm = ({ initialData, onSubmit, isLoading, schoolIdFromProps, branchIdFromProps }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    gradeId: '',
    branchId: '', // Will be set based on grade or props
    dueDate: null,
    totalMarks: 100,
    allowLateSubmission: false,
    lateSubmissionPenaltyPercentage: 0,
    fileAttachments: [], // { fileName, filePath, fileType }
    status: 'published',
    // schoolId will be derived from user or props for rootUser
  });

  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [branches, setBranches] = useState([]); // All branches for root/superadmin if they choose school first
  const [filteredGrades, setFilteredGrades] = useState([]); // Grades filtered by selected branch

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Determine the source of schoolId
  const schoolIdSource = user?.role === 'rootUser' ? schoolIdFromProps : user?.schoolId;

  // Ensure actualSchoolId is the string ID
  let actualSchoolId = null;
  if (isObject(schoolIdSource)) {
    actualSchoolId = schoolIdSource._id || schoolIdSource.id; // Prefer _id, fallback to id
  } else if (typeof schoolIdSource === 'string') {
    actualSchoolId = schoolIdSource;
  }

  // branchId can be from props (e.g. branch admin creating for their branch)
  // or derived from selected grade, or selected by admin/teacher if multiple under school.
  const currentBranchId = branchIdFromProps || formData.branchId || (user?.role === 'branchAdmin' ? user.branchId : '');


  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : null,
        // Ensure IDs are strings for comparison / MUI Select value
        subjectId: isObject(initialData.subjectId) ? initialData.subjectId._id : initialData.subjectId || '',
        gradeId: isObject(initialData.gradeId) ? initialData.gradeId._id : initialData.gradeId || '',
        branchId: isObject(initialData.branchId) ? initialData.branchId._id : initialData.branchId || '',
      });
    }
  }, [initialData]);

  const fetchSelectData = useCallback(async () => {
    // For root user, schoolIdFromProps is used, which is already 'actualSchoolId' if provided
    // For other users, actualSchoolId is derived from user.schoolId
    if (!actualSchoolId && user?.role !== 'rootUser') {
      console.warn("Actual School ID is not available for fetching dropdown data.");
      // Clear dependent data if schoolId becomes unavailable
      setSubjects([]);
      setGrades([]);
      setFilteredGrades([]);
      setBranches([]);
      return;
    }

    // Reset fields if actualSchoolId is not present (e.g. root user deselects a school)
    if (!actualSchoolId && user?.role === 'rootUser') {
      setSubjects([]);
      setGrades([]);
      setFilteredGrades([]);
      setBranches([]);
      // No need to setLoading true if we are not fetching
      return;
    }

    setLoadingSubjects(true);
    setLoadingGrades(true);
    // setLoadingBranches is handled conditionally below

    try {
      // Fetch subjects for the school
      if (actualSchoolId) {
        const subjectParams = { schoolId: actualSchoolId, limit: 500, sortBy: 'name:asc' };
        const subjectRes = await subjectService.getSubjects(subjectParams);
        setSubjects(subjectRes.results || []);
      } else {
         setSubjects([]);
      }

      // Fetch grades for the school.
      if (actualSchoolId) {
        const gradeParams = { schoolId: actualSchoolId, limit: 500, sortBy: 'title:asc' };
        const gradeRes = await gradeService.getGrades(gradeParams);
        const fetchedGrades = gradeRes.results || [];
        setGrades(fetchedGrades);

        if (currentBranchId) {
            setFilteredGrades(fetchedGrades.filter(g => (g.branchId?._id || g.branchId) === currentBranchId));
            if (!formData.branchId && (branchIdFromProps || (user?.role === 'branchAdmin' && user.branchId))) {
                setFormData(prev => ({ ...prev, branchId: currentBranchId }));
            }
        } else {
             setFilteredGrades(fetchedGrades);
        }
      } else {
          setGrades([]);
          setFilteredGrades([]);
      }

      // Fetch branches if user is admin/root and school is selected
      if (actualSchoolId && (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'rootUser')) {
        setLoadingBranches(true);
        const branchRes = await branchService.getBranches({ schoolId: actualSchoolId, limit: 200, sortBy: 'name:asc' });
        setBranches(branchRes.results || []);
        setLoadingBranches(false); // Set false here specifically for branches
      } else {
        setBranches([]); // Clear branches if not applicable
      }

    } catch (error) {
      console.error("Error fetching data for form: ", error);
      // Clear data on error to prevent stale selections
      setSubjects([]);
      setGrades([]);
      setFilteredGrades([]);
      setBranches([]);
    } finally {
      setLoadingSubjects(false);
      setLoadingGrades(false);
      // setLoadingBranches is handled inside its conditional block or should be set here if it was unconditionally true
      if (!(actualSchoolId && (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'rootUser'))) {
        setLoadingBranches(false);
      }
    }
  }, [actualSchoolId, user?.role, branchIdFromProps, currentBranchId, formData.branchId]); // Use actualSchoolId in dependencies

  useEffect(() => {
    fetchSelectData();
  }, [fetchSelectData]);

  // When branch selection changes (for admin/root), filter grades
  useEffect(() => {
    if (formData.branchId) {
        // Assuming grade objects have branchId which could be an object with _id or a string ID
        setFilteredGrades(grades.filter(g => (g.branchId?._id || g.branchId) === formData.branchId));
        // Reset grade if selected grade doesn't belong to new branch
        // Use g.id (or g._id as fallback if API is inconsistent, but prefer g.id)
        if (formData.gradeId && !filteredGrades.find(g => (g.id || g._id) === formData.gradeId)) {
            setFormData(prev => ({...prev, gradeId: ''}));
        }
    } else if (user?.role !== 'branchAdmin') { // if branch is de-selected, show all school grades
        setFilteredGrades(grades);
    }
  }, [formData.branchId, grades]);


  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (newValue) => {
    setFormData((prevData) => ({
      ...prevData,
      dueDate: newValue,
    }));
  };

  const handleFileAttachmentChange = (index, field, value) => {
    const newAttachments = [...formData.fileAttachments];
    newAttachments[index][field] = value;
    setFormData((prev) => ({ ...prev, fileAttachments: newAttachments }));
  };

  const addFileAttachment = () => {
    setFormData((prev) => ({
      ...prev,
      fileAttachments: [...prev.fileAttachments, { fileName: '', filePath: '', fileType: '' }],
    }));
  };

  const removeFileAttachment = (index) => {
    const newAttachments = formData.fileAttachments.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, fileAttachments: newAttachments }));
  };


  const handleSubmit = (event) => {
    event.preventDefault();

    // Client-side validation for required fields that might be empty strings
    if (!formData.title || !formData.title.trim()) {
        alert('Title is required.'); // Replace with a more integrated error display
        return;
    }
    if (!formData.subjectId) {
        alert('Subject is required. Please select a subject.'); // Replace with a more integrated error display
        return;
    }
    if (!formData.gradeId) {
        alert('Grade is required. Please select a grade.'); // Replace with a more integrated error display
        return;
    }
    if (!formData.dueDate) {
        alert('Due date is required.'); // Replace with a more integrated error display
        return;
    }
    // totalMarks is a number, 0 is acceptable generally, so specific validation might depend on rules

    const submissionData = { ...formData };

    // IDs from dropdowns (subjectId, gradeId, branchId if selected) are already strings.
    // The isObject checks here were more relevant if initialData could populate these with objects directly
    // and those objects were not processed into IDs by the useEffect for initialData.
    // Given the current useEffect for initialData, these might be redundant or only for very specific edge cases.
    // if (isObject(submissionData.subjectId)) submissionData.subjectId = submissionData.subjectId._id;
    // if (isObject(submissionData.gradeId)) submissionData.gradeId = submissionData.gradeId._id;

    // Branch ID handling:
    // First, ensure we find the selectedGrade using the correct ID property (id or _id)
    const selectedGradeObject = grades.find(g => (g.id || g._id) === submissionData.gradeId);
    let derivedBranchId = '';

    if (selectedGradeObject && selectedGradeObject.branchId) {
        if (isObject(selectedGradeObject.branchId)) {
            // Prefer 'id', then 'Id', then '_id' for the branch object's ID
            derivedBranchId = selectedGradeObject.branchId.id || selectedGradeObject.branchId.Id || selectedGradeObject.branchId._id || '';
        } else if (typeof selectedGradeObject.branchId === 'string') {
            // If branchId on grade is already a string, use it directly
            derivedBranchId = selectedGradeObject.branchId;
        }
    }

    // Priority for setting submissionData.branchId:
    // 1. If admin/root explicitly selected a branch from its own dropdown (formData.branchId)
    // 2. If branchId is derived from the selected grade
    // 3. Fallback to contextual currentBranchId (e.g., branchAdmin's own branch or from props)
    if (formData.branchId) {
        submissionData.branchId = formData.branchId;
    } else if (derivedBranchId) {
        submissionData.branchId = derivedBranchId;
    } else if (currentBranchId) {
        submissionData.branchId = currentBranchId;
    } else {
        // If no branchId could be determined, ensure it's an empty string.
        // The backend will ultimately validate if it's required and not empty.
        submissionData.branchId = '';
    }

    // School ID for rootUser when creating assignment
    // actualSchoolId is already derived correctly from schoolIdFromProps or user.schoolId (as a string)
    if (user?.role === 'rootUser' && actualSchoolId) {
      submissionData.schoolId = actualSchoolId;
    }
    // For other roles, schoolId is typically inferred by the backend from the authenticated user.
    // If schoolIdFromProps was an object, actualSchoolId would be its ID.
    // If schoolIdFromProps was a string, actualSchoolId would be that string.
    // This ensures we send the string ID if the role is rootUser and schoolId is determined via props.

    onSubmit(submissionData);
  };

  const commonSelectProps = {
    fullWidth: true,
    size: 'small',
    variant: 'outlined',
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {initialData ? 'Edit Assignment' : 'Create New Assignment'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleChange}
                error={!formData.title && false} // Basic validation example
                helperText={!formData.title && false ? "Title is required" : ""}
                required
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                size="small"
              />
            </Grid>

            {/* Branch Selector for Admin/Root */}
            {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'rootUser') && !branchIdFromProps && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="branchId"
                  label="Branch"
                  value={formData.branchId}
                  onChange={handleChange}
                  disabled={loadingBranches || branches.length === 0}
                  {...commonSelectProps}
                >
                  <MenuItem value=""><em>Select Branch</em></MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch._id} value={branch._id}>
                      {branch.name} ({branch.branchCode})
                    </MenuItem>
                  ))}
                </TextField>
                 {loadingBranches && <CircularProgress size={20} />}
              </Grid>
            )}


            <Grid item xs={12} sm={6}>
              <TextField
                select
                name="gradeId"
                label="Grade"
                value={formData.gradeId}
                onChange={handleChange}
                required
                disabled={loadingGrades || filteredGrades.length === 0}
                {...commonSelectProps}
              >
                <MenuItem value=""><em>Select Grade</em></MenuItem>
                {filteredGrades.map((grade) => (
                  // Prefer grade.id, fallback to grade._id if absolutely necessary for transitional period,
                  // but ideally API should be consistent and use 'id'.
                  <MenuItem key={grade.id || grade._id} value={grade.id || grade._id}>
                    {grade.title} {grade.branchId?.name ? `(${grade.branchId.name})` : ''}
                  </MenuItem>
                ))}
              </TextField>
              {loadingGrades && <CircularProgress size={20} />}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                name="subjectId"
                label="Subject"
                value={formData.subjectId}
                onChange={handleChange}
                required
                disabled={loadingSubjects || subjects.length === 0}
                {...commonSelectProps}
              >
                <MenuItem value=""><em>Select Subject</em></MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.title} ({subject.subjectCode})
                  </MenuItem>
                ))}
              </TextField>
              {loadingSubjects && <CircularProgress size={20} />}
            </Grid>


            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Due Date & Time"
                value={formData.dueDate}
                onChange={handleDateChange}
                minDate={new Date()}
                renderInput={(params) => (
                  <TextField {...params} fullWidth required size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="totalMarks"
                label="Total Marks"
                type="number"
                value={formData.totalMarks}
                onChange={handleChange}
                required
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 0, max: 1000 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    name="status"
                    label="Status"
                    value={formData.status}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                </TextField>
            </Grid>
            {/* File Attachments Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>File Attachments (Teacher)</Typography>
              <List dense>
                {formData.fileAttachments.map((file, index) => (
                  <ListItem key={index} divider>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="File Name"
                          value={file.fileName}
                          size="small"
                          onChange={(e) => handleFileAttachmentChange(index, 'fileName', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="File Path (URL)"
                          value={file.filePath}
                           size="small"
                          onChange={(e) => handleFileAttachmentChange(index, 'filePath', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                       <Grid item xs={12} sm={2}>
                        <TextField
                          label="File Type"
                          value={file.fileType}
                           size="small"
                          onChange={(e) => handleFileAttachmentChange(index, 'fileType', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton onClick={() => removeFileAttachment(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addFileAttachment}
                sx={{ mt: 1 }}
              >
                Add Attachment
              </Button>
            </Grid>


            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? <CircularProgress size={24} /> : (initialData ? 'Update Assignment' : 'Create Assignment')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default AssignmentForm;
