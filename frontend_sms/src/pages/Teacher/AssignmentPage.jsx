import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../../services/assignmentService';

const AssignmentPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAssignments();
        setAssignments(data.results);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Assignments</h1>
      <Link to="/teacher/assignments/new">Create Assignment</Link>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Subject</th>
            <th>Grade</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td>{assignment.title}</td>
              <td>{assignment.subjectId.name}</td>
              <td>{assignment.gradeId.title}</td>
              <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
              <td>
                <Link to={`/teacher/assignments/${assignment.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentPage;
