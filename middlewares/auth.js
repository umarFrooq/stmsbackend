const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const loger = require('./logger');
const en = require('../config/locales/en')
const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'AUTHENTICATION'));
  } 
  req.user = user;
  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    // const userRights = user.access ? user.access : roleRights.get(user.role);
    if(!userRights){
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    const hasRequiredRights = requiredRights.some((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
    delete user.access;
  }

  resolve();
};

const auth = (requiredRights) => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights ? [requiredRights] : []))(req, res, next);
  })
    .then(() => {
      // try{
      //   loger(req, res);
      // }
      // catch(err){ next()};
      next()
    })
    .catch((err) => next(err));
};

module.exports = auth;
