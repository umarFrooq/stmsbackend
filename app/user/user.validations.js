const { roleTypes, userStatus } = require('@/config/enums'); // Assuming roleTypes has STUDENT, TEACHER, ADMIN, SUPERADMIN etc.
const Joi = require('joi');
const { password, objectId, emptyVal } = require('../auth/custom.validation');

const myCustomJoi = Joi.extend(require('joi-phone-number'));

// Validation for user creation, particularly for school context users (student, teacher, admin)
const createUser = {
  body: Joi.object().keys({
    fullname: Joi.string().required().trim(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    role: Joi.string().required().valid(...Object.values(roleTypes)), // Use all defined roles
    branchId: Joi.string().custom(objectId).required(),
    status: Joi.string().valid(userStatus.ACTIVE, userStatus.INACTIVE).optional(), // Default can be set in model/service
    schoolId: Joi.string().custom(objectId).optional(), // Required if created by root, context for others

    // Conditional validation for gradeId
    gradeId: Joi.when('role', {
      is: roleTypes.STUDENT,
      then: Joi.string().custom(objectId).required().messages({
        'any.required': 'Grade is required for students.',
        'string.custom': 'Invalid Grade ID format for students.'
      }),
      otherwise: Joi.string().custom(objectId).optional().allow(null).messages({ // Allow null or omit for non-students
        'string.custom': 'Invalid Grade ID format.'
      })
    }),

    // Conditional validation for rollNumber
    rollNumber: Joi.when('role', {
      is: roleTypes.STUDENT,
      then: Joi.string().trim().required().messages({ // Making it required for students now
        'any.required': 'Roll number is required for students.',
        'string.empty': 'Roll number cannot be empty for students.'
      }),
      otherwise: Joi.string().trim().optional().allow(null, '').messages({
        'string.empty': 'Roll number must be a valid string if provided.'
      })
    }),

    phone: myCustomJoi.string().phoneNumber().optional().allow(null, ''), // Making phone optional for now
    // section: Joi.string().trim().optional().allow(null, ''), // If section is a direct string field
    // Add other fields as necessary from your User model that are settable on creation
  }),
};

const getUsers = {
  query: Joi.object().keys({
    fullname: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateStatus = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid(userStatus.ACTIVE, userStatus.INACTIVE).required(),
  })
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      fullname: Joi.string().trim().optional(),
      // Email is typically not updated or handled with specific logic if it is
      // Password updates should have their own endpoint and schema
      phone: myCustomJoi.string().phoneNumber().optional().allow(null, ''),
      role: Joi.string().valid(...Object.values(roleTypes)).optional(),
      branchId: Joi.string().custom(objectId).optional(),
      status: Joi.string().valid(userStatus.ACTIVE, userStatus.INACTIVE).optional(),
      schoolId: Joi.string().custom(objectId).optional(), // If admin can reassign school, or root user updates

      gradeId: Joi.string().custom(objectId).optional().allow(null).messages({
        'string.custom': 'Invalid Grade ID format.'
      }), // Service layer handles logic if role is/becomes student

      rollNumber: Joi.string().trim().optional().allow(null, '').messages({
         'string.empty': 'Roll number must be a valid string if provided.'
      }), // Service layer handles logic if role is/becomes student

      // lang: Joi.object().optional(), // If language settings are updatable
      // agreement: Joi.boolean().optional(), // If agreement status is updatable
      // section: Joi.string().trim().optional().allow(null, ''),
    })
    .min(1) // Ensure at least one field is being updated
    .messages({
      'object.min': 'At least one field must be provided for an update.'
    }),
};

const acceptRequestedSeller = {
  body: Joi.object().keys({
    userId: Joi.required().custom(objectId)
  }),
};
const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const getByRefCode = {
  query: Joi.object().keys({
    refCode: Joi.string().required()
  })
}

const updateRefCode = {
  body: Joi.object().keys({
    refCode: Joi.string().trim().required().min(8).max(8)
  })
}
const addOnWallet = {
  body: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
    amount: Joi.number().required(),
    description: Joi.string()
  })
}
const createWalletPin = {
  body: Joi.object().keys({
    pin: Joi.number().required(),
    confirmPin: Joi.number().required()
  })
}
const updateWalletPin = {
  body: Joi.object().keys({
    enabled: Joi.boolean(),
    newPin: Joi.number(),
    oldPin: Joi.when('newPin', {
      is: Joi.exist(),
      then: Joi.number().required(),
      otherwise: Joi.number()
    }),
    confirmPin: Joi.when('newPin', {
      is: Joi.exist(),
      then: Joi.number().required(),
      otherwise: Joi.number()
    }),

  })
}

const getAllUsers = {
  query: Joi.object().keys({
    fullname: Joi.string(),
    role: Joi.string().valid(...Object.values(roleTypes)).allow('', null),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    from: Joi.date().allow('', null),
    to: Joi.date().allow('', null),
    name: Joi.string(), // Replaced by search
    value: Joi.string(), // Replaced by search
    // search: Joi.string().allow('', null).description('Generic search term for fullname, email, phone'),
    // status: Joi.string().valid(...Object.values(userStatus), '').allow(null).description('Filter by user status'),
    branchId: Joi.string().custom(objectId).allow('', null).description('Filter by branch ID'),
    // city: Joi.string().allow('', null),
    // lang:Joi.string().allow('', null)
  }),
};

const changePasswordAdmin = {
  body: Joi.object().keys({
    userId: Joi.required().custom(objectId),
    newPassword: Joi.string().min(8).required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  acceptRequestedSeller,
  changePassword,
  getByRefCode,
  updateRefCode,
  addOnWallet,
  createWalletPin,
  updateWalletPin,
  getAllUsers,
  changePasswordAdmin,
  updateStatus
};
