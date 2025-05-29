// require('appoptics-apm')
require('module-alias/register')

// const config = require('./config/config');
// const app = require('./config/express');
// require('./config/mongoose');

// if (!module.parent) {
//   app.listen(config.port, () => {
//     console.info(`server started on port ${config.port} (${config.env})`);
//   });
// }

// module.exports = app;
const mongoose = require('mongoose');
const app = require('./config/express');
const config = require('./config/config');
const logger = require('./config/logger');

//  require('./config/components/cron');

// connect to mongo db
const mongoUri = config.mongo.url;
const mongoOptions = config.mongo.options;
let server;
mongoose.connect(mongoUri, mongoOptions).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
}).catch(err => {
  console.log(err)
});
// mongoose.set('debug', true);

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});