import React, { useState, useEffect } from 'react';
import payrollService from '../../services/payrollService';
import PayrollList from '../../components/payroll/PayrollList';
import { useAuth } from '../../store/auth.store';
import { Typography, Box, Button, TextField } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { control, handleSubmit } = useForm();

  const fetchPayrolls = async (params = {}) => {
    setLoading(true);
    try {
      const data = await payrollService.getPayrolls(params);
      setPayrolls(data.results);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const onFilter = (data) => {
    fetchPayrolls(data);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payrolls
      </Typography>
      <form onSubmit={handleSubmit(onFilter)}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Controller
            name="teacherId"
            control={control}
            render={({ field }) => <TextField {...field} label="Teacher ID" />}
          />
          <Controller
            name="month"
            control={control}
            render={({ field }) => <TextField {...field} label="Month" type="number" />}
          />
          <Controller
            name="year"
            control={control}
            render={({ field }) => <TextField {...field} label="Year" type="number" />}
          />
          <Button type="submit" variant="contained">Filter</Button>
        </Box>
      </form>
      <PayrollList payrolls={payrolls} loading={loading} />
    </Box>
  );
};

export default PayrollPage;
