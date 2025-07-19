import React from 'react';
import StyledDataGrid from '../common/StyledDataGrid';

const PayrollList = ({ payrolls, loading }) => {
  const columns = [
    { field: 'teacherId', headerName: 'Teacher', flex: 1 },
    { field: 'month', headerName: 'Month', flex: 1 },
    { field: 'year', headerName: 'Year', flex: 1 },
    { field: 'basicSalary', headerName: 'Basic Salary', flex: 1 },
    { field: 'netSalary', headerName: 'Net Salary', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <StyledDataGrid
      rows={payrolls}
      columns={columns}
      loading={loading}
      getRowId={(row) => row.id}
    />
  );
};

export default PayrollList;
