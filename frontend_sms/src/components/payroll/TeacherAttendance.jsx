import React, { useState } from 'react';

const TeacherAttendance = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    teacher: '',
    date: '',
    status: 'Present',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Teacher Attendance</h2>
      <div>
        <label>Teacher:</label>
        <input type="text" name="teacher" value={formData.teacher} onChange={handleChange} />
      </div>
      <div>
        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} />
      </div>
      <div>
        <label>Status:</label>
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Leave">Leave</option>
        </select>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default TeacherAttendance;
