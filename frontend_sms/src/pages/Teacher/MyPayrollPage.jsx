import React, { useState, useEffect } from 'react';
import payrollService from '../../services/payrollService';
import PayrollList from '../../components/payroll/PayrollList';
import { useAuth } from '../../store/auth.store';
import { Typography, Box } from '@mui/material';

const MyPayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const data = await payrollService.getPayrolls({ teacherId: user.id });
        setPayrolls(data.results);
      } catch (error) {
        console.error('Error fetching my payrolls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, [user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Payrolls
      </Typography>
      <PayrollList payrolls={payrolls} loading={loading} />
    </Box>
  );
};

export default MyPayrollPage;
