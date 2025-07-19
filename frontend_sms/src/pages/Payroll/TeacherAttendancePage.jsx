import React, { useState, useEffect } from 'react';
import TeacherAttendance from '../../components/payroll/TeacherAttendance';
import teacherAttendanceService from '../../services/payroll/teacherAttendanceService';

const TeacherAttendancePage = () => {
  const [attendances, setAttendances] = useState([]);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const response = await teacherAttendanceService.getTeacherAttendances();
      setAttendances(response.data.results);
    } catch (error) {
      console.error('Error fetching attendances:', error);
    }
  };

  const handleCreateAttendance = async (formData) => {
    try {
      await teacherAttendanceService.createTeacherAttendance(formData);
      fetchAttendances();
    } catch (error) {
      console.error('Error creating attendance:', error);
    }
  };

  return (
    <div>
      <h1>Teacher Attendance</h1>
      <TeacherAttendance onSubmit={handleCreateAttendance} />
      {/* TODO: Display list of attendances */}
    </div>
  );
};

export default TeacherAttendancePage;
