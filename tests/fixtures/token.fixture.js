const moment = require('moment');
const config = require('../../config/config');
const tokenService = require('../../app/auth/token.service');
const { userOne,userTwo, admin,adminTwo,supplierOne, supplierTwo } = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires);
const userTwoAccessToken = tokenService.generateToken(userTwo._id, accessTokenExpires);

const adminTwoAccessToken = tokenService.generateToken(adminTwo._id, accessTokenExpires);
const adminAccessToken = tokenService.generateToken(admin._id, accessTokenExpires);
const supplierOneAccessToken = tokenService.generateToken(supplierOne._id, accessTokenExpires);
const supplierTwoAccessToken = tokenService.generateToken(supplierTwo._id, accessTokenExpires);

module.exports = {
  userTwoAccessToken,
  userOneAccessToken,
  adminAccessToken,
  adminTwoAccessToken,
  supplierOneAccessToken,
  supplierTwoAccessToken,
  };
