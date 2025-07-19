import React from 'react';

const TeacherDashboard = ({ payrolls, leaves }) => {
  return (
    <div>
      <h2>Teacher Dashboard</h2>
      <h3>My Payrolls</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Year</th>
            <th>Net Salary</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((payroll) => (
            <tr key={payroll.id}>
              <td>{payroll.month}</td>
              <td>{payroll.year}</td>
              <td>{payroll.netSalary}</td>
              <td>{payroll.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>My Leaves</h3>
      <p>Paid Leaves Used: {leaves.used}</p>
      <p>Remaining Paid Leaves: {leaves.remaining}</p>
    </div>
  );
};

export default TeacherDashboard;
