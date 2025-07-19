import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Box, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import FormWrapper from '../common/FormWrapper';

const TeacherAttendanceForm = ({ onSubmit, defaultValues = {}, isUpdate = false, teachers = [] }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      teacherId: defaultValues.teacherId || '',
      date: defaultValues.date ? new Date(defaultValues.date).toISOString().split('T')[0] : '',
      status: defaultValues.status || '',
      remarks: defaultValues.remarks || '',
      ...defaultValues,
    },
  });

  return (
    <FormWrapper title={isUpdate ? 'Update Teacher Attendance' : 'Mark Teacher Attendance'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!isUpdate && (
            <Controller
              name="teacherId"
              control={control}
              rules={{ required: 'Teacher is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.teacherId}>
                  <InputLabel>Teacher</InputLabel>
                  <Select {...field} label="Teacher">
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.fullname}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.teacherId && <p>{errors.teacherId.message}</p>}
                </FormControl>
              )}
            />
          )}
          <Controller
            name="date"
            control={control}
            rules={{ required: 'Date is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date?.message}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            rules={{ required: 'Status is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Select {...field} label="Status">
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="leave">Leave</MenuItem>
                  <MenuItem value="sick_leave">Sick Leave</MenuItem>
                  <MenuItem value="half_day_leave">Half Day Leave</MenuItem>
                </Select>
                {errors.status && <p>{errors.status.message}</p>}
              </FormControl>
            )}
          />
          <Controller
            name="remarks"
            control={control}
            render={({ field }) => <TextField {...field} label="Remarks" />}
          />
          <Button type="submit" variant="contained" color="primary">
            {isUpdate ? 'Update' : 'Mark'}
          </Button>
        </Box>
      </form>
    </FormWrapper>
  );
};

export default TeacherAttendanceForm;
