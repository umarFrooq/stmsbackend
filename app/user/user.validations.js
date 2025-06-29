const { roleTypes, userStatus } = require('@/config/enums');
const Joi = require('joi');
const { password, objectId,emptyVal } = require('../auth/custom.validation');

const myCustomJoi = Joi.extend(require('joi-phone-number'));
const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    fullname: Joi.string().required().custom(emptyVal),
    role: Joi.string().required().valid('user', 'admin', 'supplier'),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null),
      lang: Joi.object(),
      status: Joi.string().valid(userStatus.ACTIVE, userStatus.INACTIVE),

    })
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
      // email: Joi.string().email(),
      // password: Joi.string().custom(password),
      fullname: Joi.string(),
      phone: myCustomJoi.string().phoneNumber(),
      lang: Joi.object(),
      status: Joi.string().valid(userStatus.ACTIVE, userStatus.INACTIVE),
      agreement: Joi.boolean(),
      branchId:Joi.string().custom(objectId)
    })
    .min(1),
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
    role: Joi.string().valid(...Object.values(roleTypes)),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    from: Joi.date(),
    to: Joi.date(),
    name: Joi.string(),
    value: Joi.string(),
    city: Joi.string(),
    lang:Joi.string()
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
