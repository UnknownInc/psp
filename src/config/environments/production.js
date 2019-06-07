const path = require('path');
const logPath = path.join(__dirname, '../../logs/prod.log');

module.exports = {
  web: {
    port: process.env.PORT,
  },
  logging: {
    appenders: {
      console: {type: 'console', layout: {type: 'basic'}},
      file: {type: 'file', filename: logPath},
    },
    categories: {
      default: {appenders: ['console'], level: 'info'},
      psp: {appenders: ['console'], level: 'info'},
    },
  },
};
