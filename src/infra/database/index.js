const mongoose = require('mongoose');
/**
 * Database infra for mongo db
 */
export default class Database {
  /**
   * Database constructor
   * @param {object} options {config, logging}
   */
  constructor({config, logger}) {
    logger.trace('Database.constructor');
    this.config=config;
    this.logger=logger;
  }

  /**
   * returns the status of the db connection
   */
  get status() {
    return {status: this._status, readyState: this.db.readyState};
  }

  /**
   * Connect to the mongo db
   * @return {Promise} that gets resolved when the db is connected.
   */
  async authenticate() {
    this.logger.trace('Database.authenticate');
    const uri = `mongodb://${process.env['DB_SERVER']}:${process.env['DB_PORT']}/pulsedb`;
    this.db = mongoose.createConnection();

    this.db.on('connected', ()=>{
      this._status='connected';
      this.logger.info(`DB connected to ${uri}.`);
    });

    this.db.on('error', (err)=>{
      this.lastError=err;
      this.logger.error('DB error', err);
    });

    this.db.on('reconnected', ()=>{
      this._status='connected';
      this.logger.warn('DB reconnected');
    });

    this.db.on('disconnected', ()=>{
      this._status='disconnected';
      this.logger.error('DB disconnected');
    });

    try {
      this.logger.debug('DB connecting to '+uri);
      await this.db.openUri(uri, {
        user: process.env['DB_USERNAME'],
        pass: process.env['DB_PASSWORD'],
        useNewUrlParser: true,
      });
    } catch (err) {
      this.logger.error(`DB unable to connect to ${uri}`, err);
      throw err;
    }
  }
}
