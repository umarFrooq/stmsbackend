import React, { useState } from 'react';

const LeavePolicy = ({ leavePolicy, onSubmit }) => {
  const [formData, setFormData] = useState({
    paidLeavesPerMonth: leavePolicy ? leavePolicy.paidLeavesPerMonth : '',
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
      <h2>Leave Policy</h2>
      <div>
        <label>Paid Leaves Per Month:</label>
        <input
          type="number"
          name="paidLeavesPerMonth"
          value={formData.paidLeavesPerMonth}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default LeavePolicy;
