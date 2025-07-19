import React, { useState, useEffect } from 'react';
import teacherAttendanceService from '../../services/teacherAttendanceService';
import userService from '../../services/userService';
import TeacherAttendanceForm from '../../components/teacherAttendance/TeacherAttendanceForm';
import { useAuth } from '../../store/auth.store';
import { Typography, Box } from '@mui/material';
import StyledDataGrid from '../../components/common/StyledDataGrid';

const TeacherAttendancePage = () => {
  const [attendances, setAttendances] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceData, teacherData] = await Promise.all([
          teacherAttendanceService.getTeacherAttendances({ branchId: user.branchId }),
          userService.getUsers({ role: 'teacher', branchId: user.branchId }),
        ]);
        setAttendances(attendanceData.results);
        setTeachers(teacherData.results);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (data) => {
    try {
      await teacherAttendanceService.markTeacherAttendance({ ...data, branchId: user.branchId });
      // Refresh attendance list
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const columns = [
    { field: 'teacherId', headerName: 'Teacher', flex: 1, valueGetter: (params) => teachers.find(t => t.id === params.row.teacherId)?.fullname || '' },
    { field: 'date', headerName: 'Date', flex: 1, valueGetter: (params) => new Date(params.row.date).toLocaleDateString() },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'remarks', headerName: 'Remarks', flex: 1 },
  ];

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Attendance
      </Typography>
      <TeacherAttendanceForm onSubmit={handleSubmit} teachers={teachers} />
      <Box sx={{ mt: 3 }}>
        <StyledDataGrid
          rows={attendances}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
};

export default TeacherAttendancePage;
