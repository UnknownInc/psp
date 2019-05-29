/**
 * Application class for root of the app
 */
export default class Application {
  /**
   * Application constructor
   * @param {object} param0
   */
  constructor({server, database, cache, logger, config}) {
    logger.trace('Application.constructor');
    this.server = server;
    this.database = database;
    this.logger = logger;
    this.config = config;
    this.cache = cache;
  }

  /**
   * start the application
   */
  async start() {
    this.logger.info('Buildinfo: ', this.config.buildInfo);

    if (this.cache) {
      await this.cache.start();
    }
    if (this.database) {
      await this.database.authenticate();
    }

    await this.server.start();
  }
}
