const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const config = require("../../../config/config");

const blueExUtil = async (_payLoad, _options) => {
    let config = {
        method: _options.method,
        url: _options.url,
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
        data: _payLoad,
    }
    if (_options.token)
        config.headers["authorization"] = _options.token;
    return axios(config).then(result => {
        if (result.data.status == 0)
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, result.data.response);
        else
            return result.data;
    }).catch(err => {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err);
    })
}

const createToken = () => {
    let credentials = config.blueEx.accountNo + ":" + config.blueEx.blueExPassword;
    let token = "Basic " + Buffer.from(credentials).toString('base64')
    console.log(token);
    return token;
}
module.exports = { blueExUtil };