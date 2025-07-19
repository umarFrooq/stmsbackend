import React, { useState, useEffect } from 'react';
import LeavePolicy from '../../components/payroll/LeavePolicy';
import leavePolicyService from '../../services/payroll/leavePolicyService';

const LeavePolicyPage = () => {
  const [leavePolicy, setLeavePolicy] = useState(null);

  useEffect(() => {
    fetchLeavePolicy();
  }, []);

  const fetchLeavePolicy = async () => {
    try {
      const response = await leavePolicyService.getLeavePolicies();
      if (response.data.results.length > 0) {
        setLeavePolicy(response.data.results[0]);
      }
    } catch (error) {
      console.error('Error fetching leave policy:', error);
    }
  };

  const handleSaveLeavePolicy = async (formData) => {
    try {
      if (leavePolicy) {
        await leavePolicyService.updateLeavePolicy(leavePolicy.id, formData);
      } else {
        await leavePolicyService.createLeavePolicy(formData);
      }
      fetchLeavePolicy();
    } catch (error) {
      console.error('Error saving leave policy:', error);
    }
  };

  return (
    <div>
      <h1>Leave Policy</h1>
      <LeavePolicy leavePolicy={leavePolicy} onSubmit={handleSaveLeavePolicy} />
    </div>
  );
};

export default LeavePolicyPage;
