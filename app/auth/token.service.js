const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../../config/config');
const userService = require('../user/user.service');
const db = require('../../config/mongoose');
const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError')
const crypto = require("crypto");
const { tokenTypes } = require("../../config/token");
const { verificationMethods, redisEnums } = require('../../config/enums');
const User = db.User;
const Token = db.Token;
const en = require('../../config/locales/en');
const { setCache, getCache } = require('@/utils/cache/cache');
/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires,password, secret = config.jwt.secret) => {
    const payload = {
        sub: userId,
        password:password,
        iat: moment().unix(),
        exp: expires.unix(),
    };
    return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    const tokenDoc = new Token({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted,

    });
    return await tokenDoc.save()

};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
    if (!tokenDoc) {
        throw new Error('TOKEN_NOT_FOUND');
    }
    return tokenDoc;
};

// const userAuthentication = async (token)=>{
//    try{
//         const payload = jwt.verify(token, config.jwt.secret);
//         const tokenDoc = await Token.findOne({ token, user: payload.sub, blacklisted: false });
//         if (!tokenDoc) {
//             throw new Error('Token not found');
//         }
//         return tokenDoc
//     }catch{
//         throw new ApiError(httpStatus.NOT_FOUND,"Authentication failed")
//     }

// }
/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {


    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires,user.password);

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires,user.password);
    await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */

const generateResetPasswordToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'TOKEN_MODULE.NO_USERS_FOUND_WITH_EMAIL');
    }
    const key = `${redisEnums.KEYS.FORGET_PASSWORD}-${email}-${user.role}`;
    const lastAttempt = `${redisEnums.KEYS.FORGET_PASSWORD_LAST_ATTEMPT}-${email}-${user.role}`
    let isUser = await getCache(key);
    if (!isUser) isUser = 0;
    if (isUser) {
        if (await getCache(lastAttempt))
            throw new ApiError(httpStatus.BAD_REQUEST, "You can try after 30 seconds");
        if (parseInt(isUser) >= 5)
            throw new ApiError(httpStatus.BAD_REQUEST, `Maximum attempts reached. Please try again after ${redisEnums.TTL.FORGET_PASSWORD/60} minutes`);
    }
    await setCache(key, undefined, isUser + 1, redisEnums.TTL.FORGET_PASSWORD);
    await setCache(lastAttempt, undefined, 1, redisEnums.TTL.FORGET_PASSWORD_LAST_ATTEMPT);
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = generateToken(user.id,expires);
    await saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
    return resetPasswordToken;
};

const generateRegisterOrLoginFromEmailToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        var fullname = "user_" + crypto.randomBytes(5).toString('hex');
        var tempUser = new User({ email, fullname, isEmailVarified: true, verificationMethod: 'email' })
        const newUser = await userService.createUser(tempUser);

        const expires = moment().add(config.jwt.registerOrLoginFromEmailTokenExpirationMinutes, 'minutes');
        const registerOrLoginToken = generateToken(newUser._id, expires);
        await saveToken(registerOrLoginToken, newUser._id, expires, tokenTypes.Register_Or_Login);
        return registerOrLoginToken;
    }
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const registerOrLoginToken = generateToken(user.id, expires);
    await saveToken(registerOrLoginToken, user.id, expires, tokenTypes.Register_Or_Login);
    return registerOrLoginToken;
};
const generateVerificationEmailToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'TOKEN_MODULE.NO_USERS_FOUND_WITH_EMAIL');
    }
    const expires = moment().add(config.jwt.verificationEmailExpirationMinutes, 'minutes');
    const verificationEmailToken = generateToken(user.id, expires);
    await saveToken(verificationEmailToken, user.id, expires, tokenTypes.Verification_Email);
    return verificationEmailToken;
};

const generateVerificationPhoneToken = async (phone, origin, customer) => {

    const user = await userService.getUserByPhoneNumber(phone, customer);
    if (!user) {
        // throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this phone number');
        var fullname = "user_" + crypto.randomBytes(5).toString('hex');
        var tempUser = new User({ phone, fullname, isPhoneVarified: true, verificationMethod: verificationMethods.SMS })
        const newUser = await User.create(tempUser);

        const expires = moment().add(config.jwt.verificationPhoneExpirationMinutes, 'minutes');
        const verificationPhoneToken = generateToken(newUser._id, expires);
        await saveToken(verificationPhoneToken, newUser._id, expires, tokenTypes.Verification_Sms);
        return verificationPhoneToken;
    }
    const expires = moment().add(config.jwt.verificationPhoneExpirationMinutes, 'minutes');
    const verificationPhoneToken = generateToken(user.id, expires);
    await saveToken(verificationPhoneToken, user.id, expires, tokenTypes.Verification_Sms);
    return verificationPhoneToken;
};

const generateVerificationGoogleToken = async (userbody) => {
    const user = await userService.createUserWithGoogle(userbody);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'TOKEN_MODULE.NO_USERS_FOUND_WITH_THIS_ACCOUNT');
    }
    const expires = moment().add(config.jwt.verificationEmailExpirationMinutes, 'minutes');
    const verificationEmailToken = generateToken(user.id, expires);
    await saveToken(verificationEmailToken, user.id, expires, tokenTypes.Verification_Google);
    return verificationEmailToken;
};


/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthForRefresh = async (user) => {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id,accessTokenExpires,user.password);
    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
    };
}


/**
 * access auth tokens
 * @param {string} accessToken
 * @returns {Promise<Object>}
 */
const generateEmailPhonVerifAuthTokens = async (user) => {

    const accessTokenExpires = moment().add(config.jwt.EmailPhoneVerifExpireationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires);
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires);
    await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);
    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        }, refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },

    };
};

const getOneToken = async (filter) => {
    return await Token.findOne(filter);
}


const getToken = async (data) => {
    const token = await Token.findOne(data);
    return token
}

const deleteToken = async (data) => {
    const tokenDoc = await Token.deleteOne(data);
    return tokenDoc
}
const updateToken = async (filter, data) => {
    const tokenDoc = await Token.findOneAndUpdate(filter, data);
    return tokenDoc
}

module.exports = {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateRegisterOrLoginFromEmailToken,
    generateVerificationEmailToken,
    generateVerificationPhoneToken,
    generateVerificationGoogleToken,
    getOneToken,
    generateAuthForRefresh,
    generateEmailPhonVerifAuthTokens,
    // userAuthentication
    getToken,
    deleteToken,
    updateToken
};