import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PayrollDetails = ({ payroll }) => {
  if (!payroll) {
    return null;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Payroll Details
      </Typography>
      <Box>
        <Typography>
          <b>Teacher:</b> {payroll.teacherId}
        </Typography>
        <Typography>
          <b>Month/Year:</b> {payroll.month}/{payroll.year}
        </Typography>
        <Typography>
          <b>Basic Salary:</b> {payroll.basicSalary}
        </Typography>
        <Typography>
          <b>Total Working Days:</b> {payroll.totalWorkingDays}
        </Typography>
        <Typography>
          <b>Present Days:</b> {payroll.presentDays}
        </Typography>
        <Typography>
          <b>Absent Days:</b> {payroll.absentDays}
        </Typography>
        <Typography>
          <b>Paid Leaves:</b> {payroll.paidLeaves}
        </Typography>
        <Typography>
          <b>Deductions:</b> {payroll.deductions}
        </Typography>
        <Typography>
          <b>Net Salary:</b> {payroll.netSalary}
        </Typography>
        <Typography>
          <b>Status:</b> {payroll.status}
        </Typography>
      </Box>
    </Paper>
  );
};

export default PayrollDetails;
