import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Box } from '@mui/material';
import FormWrapper from '../common/FormWrapper';

const LeavePolicyForm = ({ onSubmit, defaultValues = {}, isUpdate = false }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paidLeavesPerMonth: defaultValues.paidLeavesPerMonth || '',
      ...defaultValues,
    },
  });

  return (
    <FormWrapper title={isUpdate ? 'Update Leave Policy' : 'Create Leave Policy'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="paidLeavesPerMonth"
            control={control}
            rules={{ required: 'Paid leaves per month is required', min: { value: 0, message: 'Must be a positive number' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Paid Leaves Per Month"
                type="number"
                error={!!errors.paidLeavesPerMonth}
                helperText={errors.paidLeavesPerMonth?.message}
              />
            )}
          />
          <Button type="submit" variant="contained" color="primary">
            {isUpdate ? 'Update' : 'Create'}
          </Button>
        </Box>
      </form>
    </FormWrapper>
  );
};

export default LeavePolicyForm;
