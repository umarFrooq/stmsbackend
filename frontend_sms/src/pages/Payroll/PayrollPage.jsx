import React, { useState, useEffect } from 'react';
import PayrollList from '../../components/payroll/PayrollList';
import PayrollForm from '../../components/payroll/PayrollForm';
import payrollService from '../../services/payroll/payrollService';

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await payrollService.getPayrolls();
      setPayrolls(response.data.results);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    }
  };

  const handleCreatePayroll = async (formData) => {
    try {
      await payrollService.createPayroll(formData);
      fetchPayrolls();
    } catch (error) {
      console.error('Error creating payroll:', error);
    }
  };

  return (
    <div>
      <h1>Payrolls</h1>
      <PayrollForm onSubmit={handleCreatePayroll} />
      <PayrollList payrolls={payrolls} />
    </div>
  );
};

export default PayrollPage;
