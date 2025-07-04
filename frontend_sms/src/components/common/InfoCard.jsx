import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PropTypes from 'prop-types';

const InfoCard = ({ title, value, description, icon, linkTo, onAction }) => {
  const cardContent = (
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon && <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>{icon}</Box>}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Box>
      {value && (
        <Typography variant="h4" component="p" gutterBottom>
          {value}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {description}
        </Typography>
      )}
      {(linkTo || onAction) && (
        <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            color="primary"
            component={linkTo ? RouterLink : undefined}
            to={linkTo}
            onClick={onAction} // If onAction is provided, linkTo should ideally not be.
            aria-label={linkTo ? `Go to ${title}`: `Perform action for ${title}`}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      )}
    </CardContent>
  );

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
      {cardContent}
    </Card>
  );
};

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.string,
  icon: PropTypes.node,
  linkTo: PropTypes.string,
  onAction: PropTypes.func,
};

export default InfoCard;
