const express = require('express');

/**
 * Http server
 */
export default class Server {
  /**
   * constructor for the server
   * @param {object} param0
   */
  constructor({config, router, logger}) {
    this.logger = logger('Server');
    this.logger.trace('constructor');
    this.config = config;
    this.express = express();

    this.express.disable('x-powered-by');
    this.express.use(router);
  }

  /**
   * starts the http server
   * @return {promise} promise that resolves when the server starts
   */
  start() {
    this.logger.trace('start');
    return new Promise((resolve) => {
      const http = this.express
          .listen(this.config.web.port, () => {
            const {port} = http.address();
            this.logger.info(`[p ${process.pid}] Listening at port ${port}`);
            resolve();
          });
    });
  }
}
