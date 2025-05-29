const Joi = require('joi');
const { objectId } = require('../auth/custom.validation');

const monthlyAnalytics = {
  query: Joi.object().keys({
    date: Joi.date().required(),
  })
};

const orderChart = {
    query: Joi.object().keys({
        startDate: Joi.date().less(Joi.ref("endDate")).required(),
        endDate: Joi.date().required(),
        format: Joi.string().valid('day', 'month').required()
    })
}
const revenue = {
  query: Joi.object().keys({
      to: Joi.date(),
      from: Joi.date(),
  })
}

module.exports = {
    monthlyAnalytics,
    orderChart,
    revenue
}
