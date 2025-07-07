import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // For actual file upload button

// For this component, actual file upload logic (to S3, backend, etc.) is abstracted.
// We'll assume for now that `filePath` is a URL that the student provides,
// or a more sophisticated FileUploadComponent would handle the upload and return the URL.
// For simplicity, we'll mimic the structure of AssignmentForm's attachments.

const SubmissionForm = ({ assignmentTitle, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    submittedFiles: [{ fileName: '', filePath: '', fileType: '' }], // { fileName, filePath, fileType }
    studentRemarks: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (index, field, value) => {
    const newFiles = [...formData.submittedFiles];
    newFiles[index][field] = value;
    setFormData((prev) => ({ ...prev, submittedFiles: newFiles }));
  };

  const addFile = () => {
    if (formData.submittedFiles.length < 5) { // Max 5 files
      setFormData((prev) => ({
        ...prev,
        submittedFiles: [...prev.submittedFiles, { fileName: '', filePath: '', fileType: '' }],
      }));
    }
  };

  const removeFile = (index) => {
    const newFiles = formData.submittedFiles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, submittedFiles: newFiles }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Basic validation: ensure at least one file has a path
    const validFiles = formData.submittedFiles.filter(file => file.filePath.trim() !== '' && file.fileName.trim() !== '');
    if (validFiles.length === 0) {
        alert("Please provide at least one file with a name and path."); // Replace with better UX later
        return;
    }
    onSubmit({ ...formData, submittedFiles: validFiles });
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
      <Typography variant="h6" component="h3" gutterBottom>
        Submit Your Work for: {assignmentTitle}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Your Files</Typography>
            <List dense>
              {formData.submittedFiles.map((file, index) => (
                <ListItem key={index} divider sx={{pl:0, pr:0}}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="File Name"
                        value={file.fileName}
                        size="small"
                        onChange={(e) => handleFileChange(index, 'fileName', e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="File Path (URL)"
                        value={file.filePath}
                        size="small"
                        onChange={(e) => handleFileChange(index, 'filePath', e.target.value)}
                        fullWidth
                        required
                        type="url"
                        helperText="Please provide a public URL to your file."
                      />
                    </Grid>
                     <Grid item xs={12} sm={2}>
                      <TextField
                        label="File Type (e.g., PDF, DOCX)"
                        value={file.fileType}
                        size="small"
                        onChange={(e) => handleFileChange(index, 'fileType', e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ textAlign: 'right' }}>
                      {formData.submittedFiles.length > 1 && (
                        <IconButton onClick={() => removeFile(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
            {formData.submittedFiles.length < 5 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addFile}
                sx={{ mt: 1, mb: 2 }}
              >
                Add Another File (Max 5)
              </Button>
            )}
            {/*
              A more advanced FileUploadComponent would be used here in a real scenario.
              Example:
              <FileUploadComponent
                onUploadSuccess={(uploadedFile) => handleActualFileUpload(uploadedFile, index)}
              />
            */}
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="studentRemarks"
              label="Your Remarks (Optional)"
              value={formData.studentRemarks}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              fullWidth
              startIcon={<CloudUploadIcon />}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Submit Assignment'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default SubmissionForm;
