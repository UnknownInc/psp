/**
 * Application class for root of the app
 */
export default class Application {
  /**
   * Application constructor
   * @param {object} param0
   */
  constructor({server, database, logger, config}) {
    this.server = server;
    this.database = database;
    this.logger = logger;
    this.config = config;
  }

  /**
   * start the application
   */
  async start() {
    this.logger.info(`Builtinfo: ${this.config.buildInfo.date}, commit: ${this.config.buildInfo.commit}`);
    if (this.database) {
      await this.database.authenticate();
    }

    await this.server.start();
  }
}
