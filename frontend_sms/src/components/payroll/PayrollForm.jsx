import React, { useState } from 'react';

const PayrollForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    teacher: '',
    month: '',
    year: '',
    basicSalary: '',
    bonus: '',
    deductions: '',
    netSalary: '',
    status: 'Unpaid',
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
      <h2>Payroll Form</h2>
      <div>
        <label>Teacher:</label>
        <input type="text" name="teacher" value={formData.teacher} onChange={handleChange} />
      </div>
      <div>
        <label>Month:</label>
        <input type="number" name="month" value={formData.month} onChange={handleChange} />
      </div>
      <div>
        <label>Year:</label>
        <input type="number" name="year" value={formData.year} onChange={handleChange} />
      </div>
      <div>
        <label>Basic Salary:</label>
        <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} />
      </div>
      <div>
        <label>Bonus:</label>
        <input type="number" name="bonus" value={formData.bonus} onChange={handleChange} />
      </div>
      <div>
        <label>Deductions:</label>
        <input type="number" name="deductions" value={formData.deductions} onChange={handleChange} />
      </div>
      <div>
        <label>Net Salary:</label>
        <input type="number" name="netSalary" value={formData.netSalary} onChange={handleChange} />
      </div>
      <div>
        <label>Status:</label>
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default PayrollForm;
