import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/assignmentService';
import { subjectService } from '../../services/subjectService';
import { gradeService } from '../../services/gradeService';

const AssignmentForm = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState({
    title: '',
    description: '',
    subjectId: '',
    gradeId: '',
    dueDate: '',
    totalMarks: '',
  });
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const isNewAssignment = !assignmentId;

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [subjectsData, gradesData] = await Promise.all([
          subjectService.getSubjects(),
          gradeService.getGrades(),
        ]);
        setSubjects(subjectsData.results);
        setGrades(gradesData.results);
      } catch (error) {
        console.error('Error fetching dependencies:', error);
      }
    };

    fetchDependencies();

    if (!isNewAssignment) {
      setLoading(true);
      assignmentService.getAssignmentById(assignmentId)
        .then((data) => {
          setAssignment({
            ...data,
            dueDate: new Date(data.dueDate).toISOString().slice(0, 16),
          });
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching assignment:', error);
          setLoading(false);
        });
    }
  }, [assignmentId, isNewAssignment]);

  const handleChange = (e) => {
    setAssignment({ ...assignment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isNewAssignment) {
        await assignmentService.createAssignment(assignment);
      } else {
        await assignmentService.updateAssignment(assignmentId, assignment);
      }
      navigate('/teacher/assignments');
    } catch (error) {
      console.error('Error saving assignment:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{isNewAssignment ? 'Create Assignment' : 'Edit Assignment'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input type="text" name="title" value={assignment.title} onChange={handleChange} required />
        </div>
        <div>
          <label>Description</label>
          <textarea name="description" value={assignment.description} onChange={handleChange} />
        </div>
        <div>
          <label>Subject</label>
          <select name="subjectId" value={assignment.subjectId} onChange={handleChange} required>
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Grade</label>
          <select name="gradeId" value={assignment.gradeId} onChange={handleChange} required>
            <option value="">Select Grade</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>{grade.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Due Date</label>
          <input type="datetime-local" name="dueDate" value={assignment.dueDate} onChange={handleChange} required />
        </div>
        <div>
          <label>Total Marks</label>
          <input type="number" name="totalMarks" value={assignment.totalMarks} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentForm;
