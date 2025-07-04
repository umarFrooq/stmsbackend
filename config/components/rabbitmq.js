'use strict'
const en=require('../locales/en')
const joi = require('joi')

const envVarsSchema = joi.object({
  RABBITMQ_URI: joi.string()
    .uri({ scheme: 'amqp' })
    .required()
}).unknown()
  .required()

const { error, value: envVars } = joi.validate(process.env, envVarsSchema)
if (error) {
  throw new Error(en.responseMessages.CONFIG_VALIDATION_ERROR +` ${error.message}`)
}

const config = {
  rabbitmq: {
    uri: envVars.RABBITMQ_URI
  }
}

module.exports = config
