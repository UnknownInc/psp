/**
 * Application class for root of the app
 */
export default class Application {
  /**
   * Application constructor
   * @param {object} param0
   */
  constructor({server, database, cache, logger, config}) {
    this.logger = logger('Application');
    this.logger.trace('constructor');
    this.server = server;
    this.database = database;
    this.config = config;
    this.cache = cache;
  }

  /**
   * start the application
   */
  async start() {
    this.logger.info('Buildinfo: ', this.config.buildInfo);

    if (this.cache) {
      await this.cache.connect();
    }
    if (this.database) {
      await this.database.connect();
    }

    await this.server.start();
  }
}
