/**
 * Vintega Solutions
 *
 * User Controller, it encapsulates all user related methods.
 * These methods are called via API endpoints. Some endpoints may require admin level authorization.
 * 
 * @summary User Controller, called via API endpoints
 * @author Muhammad Mustafa
 *
 * Created at     : 2020-08-03 13:52:11 
 * Last modified  : 2020-08-03 14:01:18
 */


/**
 * @function getUsers //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */
//TODO: Document all methods and correct response messages accordingly

const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const userService = require('./user.service');
const en=require('../../config/locales/en')
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.sendStatus({ user });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
const getRequestedSellers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'email']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryRequestedSellers(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
const getSellers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'phone', 'email']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.querySellers(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
const getProfile = catchAsync(async (req, res) => {

  if (req.user.role === "user") {
    const result = await userService.getUserProfile();
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result);
  }
  if (req.user.role === "supplier") {
    const result = await userService.getSellerProfile();
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result);
  }
});
const getUserPhone = catchAsync(async (req, res) => {
  const result = await userService.getUserPhone(req.user, req.body.userId);

  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getSellerHome = catchAsync(async (req, res) => {

  const result = await userService.getSellerHome({});
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);

});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND,'USER_NOT_FOUND');
  }
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user);
});

const updateStatus = catchAsync(async (req, res) => {
  const user = await userService.updateStatus(req.user, req.params.userId, req.body);
  console.log(user)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user);
});

const updateUser = catchAsync(async (req, res) => { 
  const user = await userService.updateProfile(req.user, req.params.userId, req.body);
  // res.send(user);
  res.sendStatus(user);
});

const acceptRequestedSeller = catchAsync(async (req, res) => {
  const user = await userService.acceptRequestedSeller(req.body.userId);
  // res.send(user);
  res.sendStatus(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});

const changePassword = catchAsync(async (req, res) => {
  const user = await userService.changePassword(req.user, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user);
});
const changePasswordAdmin = catchAsync(async (req, res) => {
  const user = await userService.changePasswordAdmin(req.user, req.body);
  // res.status(httpStatus.OK).send(user)
  res.sendStatus(user.data,user.status,user.message);
});

const getByRefCode = catchAsync(async (req, res) => {
  const user = await userService.getByRefCode(req.query.refCode, null, req.user.id);
  if (user && user.data && user.isSuccess) {
    delete user.data.user;
    // res.status(httpStatus.OK).send(user);
    res.sendStatus(user.data,user.status,user.message);
  }
  else {
    throw new ApiError(user.status, user.message);

  }
})

const updateRefCode = catchAsync(async (req, res) => {
  const user = await userService.updateRefCode(req.user.id, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);

})

const addOnWallet = catchAsync(async (req, res) => {
  const user = await userService.addOnWallet(req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);
})

const updateBulkRefCode = catchAsync(async (req, res) => {
  const user = await userService.updateBulkRefCode();
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);
})

const updateWalletPin = catchAsync(async (req, res) => {
  const user = await userService.updateWalletPin(req.user, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);
})

const createWalletPin = catchAsync(async (req, res) => {
  const user = await userService.createWalletPin(req.user, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message)
})

const getAllUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'email', 'to', 'from', 'role', 'city']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const search = pick(req.query, ['name', 'value']);
  const result = await userService.getAllUsers(filter, options, search);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
const getAllUser = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'email', 'to', 'from', 'role', 'city','lang']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const search = pick(req.query, ['name', 'value']);
  const result = await userService.getAllUser(filter, options, search,req.schoolId);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  getUserPhone,
  getSellers,
  getRequestedSellers,
  acceptRequestedSeller,
  getSellerHome,
  changePassword,
  getByRefCode,
  updateRefCode,
  addOnWallet,
  updateBulkRefCode,
  createWalletPin,
  updateWalletPin,
  getAllUsers,
  changePasswordAdmin,
  updateStatus,
  getAllUser
};
