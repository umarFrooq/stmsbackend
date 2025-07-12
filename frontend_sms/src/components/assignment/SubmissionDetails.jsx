import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { submissionService } from '../../services/submissionService';

const SubmissionDetails = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const data = await submissionService.getSubmissionById(submissionId);
        setSubmission(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submission:', error);
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!submission) {
    return <div>Submission not found.</div>;
  }

  return (
    <div>
      <h1>Submission Details</h1>
      <p>Student: {submission.studentId.firstName} {submission.studentId.lastName}</p>
      <p>Submission Date: {new Date(submission.submissionDate).toLocaleDateString()}</p>
      <p>Status: {submission.status}</p>
      <div>
        <h2>Submitted Files</h2>
        <ul>
          {submission.submittedFiles.map((file) => (
            <li key={file.filePath}>
              <a href={file.filePath} target="_blank" rel="noopener noreferrer">
                {file.fileName}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Marks</h2>
        <p>
          {submission.obtainedMarks !== null
            ? `${submission.obtainedMarks} / ${submission.assignmentId.totalMarks}`
            : 'Not Graded'}
        </p>
      </div>
    </div>
  );
};

export default SubmissionDetails;
