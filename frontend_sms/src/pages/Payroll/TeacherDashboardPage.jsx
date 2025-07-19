import React, { useState, useEffect } from 'react';
import TeacherDashboard from '../../components/payroll/TeacherDashboard';
import payrollService from '../../services/payroll/payrollService';
import teacherAttendanceService from '../../services/payroll/teacherAttendanceService';
import leavePolicyService from '../../services/payroll/leavePolicyService';

const TeacherDashboardPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState({ used: 0, remaining: 0 });

  useEffect(() => {
    // Assuming the teacher's ID is available in the auth context
    const teacherId = 'teacher_id'; // Replace with actual teacher ID
    fetchPayrolls(teacherId);
    fetchLeaves(teacherId);
  }, []);

  const fetchPayrolls = async (teacherId) => {
    try {
      const response = await payrollService.getPayrolls({ teacher: teacherId });
      setPayrolls(response.data.results);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    }
  };

  const fetchLeaves = async (teacherId) => {
    try {
      const attendanceResponse = await teacherAttendanceService.getTeacherAttendances({
        teacher: teacherId,
        status: 'Leave',
      });
      const leavePolicyResponse = await leavePolicyService.getLeavePolicies();
      const paidLeavesPerMonth = leavePolicyResponse.data.results[0]?.paidLeavesPerMonth || 0;
      const usedLeaves = attendanceResponse.data.results.length;
      setLeaves({
        used: usedLeaves,
        remaining: paidLeavesPerMonth - usedLeaves,
      });
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  return (
    <div>
      <h1>Teacher Dashboard</h1>
      <TeacherDashboard payrolls={payrolls} leaves={leaves} />
    </div>
  );
};

export default TeacherDashboardPage;
