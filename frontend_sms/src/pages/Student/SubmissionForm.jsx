import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSubmission } from '../../services/submissionService';

const SubmissionForm = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('studentRemarks', remarks);
    formData.append('assignmentId', assignmentId);

    try {
      await createSubmission(assignmentId, formData);
      navigate(`/student/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Submit Assignment</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Files</label>
          <input type="file" multiple onChange={handleFileChange} />
        </div>
        <div>
          <label>Remarks</label>
          <textarea value={remarks} onChange={handleRemarksChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;
