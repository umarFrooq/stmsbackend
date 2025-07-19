import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import leavePolicyService from '../../services/leavePolicyService';
import LeavePolicyForm from '../../components/leavePolicy/LeavePolicyForm';
import  useAuth  from '../../store/auth.store';
import { Typography } from '@mui/material';

const LeavePolicyPage = () => {
  const { branchId } = useParams();
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeavePolicy = async () => {
      try {
        const data = await leavePolicyService.getLeavePolicy(branchId);
        setLeavePolicy(data);
      } catch (error) {
        console.error('Error fetching leave policy:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === 'admin') {
      fetchLeavePolicy();
    }
  }, [branchId, user]);

  const handleSubmit = async (data) => {
    try {
      if (leavePolicy) {
        await leavePolicyService.updateLeavePolicy(branchId, data);
      } else {
        await leavePolicyService.createLeavePolicy({ ...data, branchId });
      }
      // Optionally, show a success message
    } catch (error) {
      console.error('Error saving leave policy:', error);
      // Optionally, show an error message
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <div>
      <LeavePolicyForm onSubmit={handleSubmit} defaultValues={leavePolicy} isUpdate={!!leavePolicy} />
    </div>
  );
};

export default LeavePolicyPage;
