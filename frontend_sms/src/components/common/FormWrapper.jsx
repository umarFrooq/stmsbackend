import React from 'react';
import { Paper, Box, Typography, Container } from '@mui/material';
import PropTypes from 'prop-types';

const FormWrapper = ({
  children,
  title,
  onSubmit,
  maxWidth = 'md', // 'xs', 'sm', 'md', 'lg', 'xl'
  elevation = 3,
  paperSx, // Custom styles for Paper component
  containerSx, // Custom styles for Container component
  boxSx, // Custom styles for Box (form element)
}) => {
  return (
    <Container component="main" maxWidth={maxWidth} sx={{ mt: 4, mb: 4, ...containerSx }}>
      <Paper
        elevation={elevation}
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          ...paperSx,
        }}
      >
        {title && (
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {title}
          </Typography>
        )}
        <Box
          component="form"
          onSubmit={onSubmit}
          noValidate // Basic HTML5 validation disabled, rely on Formik/Yup or similar
          sx={{ width: '100%', ...boxSx }}
        >
          {children}
          {/* Form submission button is expected to be part of children */}
        </Box>
      </Paper>
    </Container>
  );
};

FormWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  elevation: PropTypes.number,
  paperSx: PropTypes.object,
  containerSx: PropTypes.object,
  boxSx: PropTypes.object,
};

export default FormWrapper;
