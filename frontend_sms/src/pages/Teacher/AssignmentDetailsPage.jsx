import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';

const AssignmentDetailsPage = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);
        const submissionsData = await submissionService.getSubmissionsByAssignment(assignmentId);
        setSubmissions(submissionsData.results);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        setLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId]);

  const handleMarksChange = (submissionId, value) => {
    setMarks({ ...marks, [submissionId]: value });
  };

  const handleGiveMarks = async (submissionId) => {
    try {
      await submissionService.giveMarks(submissionId, { obtainedMarks: marks[submissionId] });
      // Refresh submissions
      const submissionsData = await submissionService.getSubmissionsByAssignment(assignmentId);
      setSubmissions(submissionsData.results);
    } catch (error) {
      console.error('Error giving marks:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!assignment) {
    return <div>Assignment not found.</div>;
  }

  return (
    <div>
      <h1>{assignment.title}</h1>
      <p>{assignment.description}</p>
      <p>Due Date: {new Date(assignment.dueDate).toLocaleDateString()}</p>
      <p>Total Marks: {assignment.totalMarks}</p>

      <h2>Submissions</h2>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Submission Date</th>
            <th>Files</th>
            <th>Marks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td>{submission.studentId.firstName} {submission.studentId.lastName}</td>
              <td>{new Date(submission.submissionDate).toLocaleDateString()}</td>
              <td>
                {submission.submittedFiles.map((file) => (
                  <a href={file.filePath} target="_blank" rel="noopener noreferrer" key={file.filePath}>
                    {file.fileName}
                  </a>
                ))}
              </td>
              <td>
                <input
                  type="number"
                  value={marks[submission.id] || submission.obtainedMarks || ''}
                  onChange={(e) => handleMarksChange(submission.id, e.target.value)}
                />
                / {assignment.totalMarks}
              </td>
              <td>
                <button onClick={() => handleGiveMarks(submission.id)}>Give Marks</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentDetailsPage;
