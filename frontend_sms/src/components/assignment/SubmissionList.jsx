import React from 'react';
import { Link } from 'react-router-dom';

const SubmissionList = ({ submissions, assignment }) => {
  return (
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
              {submission.obtainedMarks !== null ? `${submission.obtainedMarks} / ${assignment.totalMarks}` : 'Not Graded'}
            </td>
            <td>
              <Link to={`/teacher/submissions/${submission.id}`}>View Details</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SubmissionList;
