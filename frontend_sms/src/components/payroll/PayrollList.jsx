import React from 'react';

const PayrollList = ({ payrolls }) => {
  return (
    <div>
      <h2>Payroll List</h2>
      <table>
        <thead>
          <tr>
            <th>Teacher</th>
            <th>Month</th>
            <th>Year</th>
            <th>Net Salary</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((payroll) => (
            <tr key={payroll.id}>
              <td>{payroll.teacher.name}</td>
              <td>{payroll.month}</td>
              <td>{payroll.year}</td>
              <td>{payroll.netSalary}</td>
              <td>{payroll.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayrollList;
