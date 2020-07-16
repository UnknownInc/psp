/* eslint-disable max-len */
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
    this.config=config;
    this.logger=logger('DB');
    this.logger.trace('constructor');
  }

  /**
   * returns the status of the db connection
   */
  get status() {
    return {
      status: this._status,
      readyState: this.db.readyState,
      lastError: this.lastError,
    };
  }

  /**
   * connect the model to the db connection
   */
  createModels() {
    this.Question = this.db.model('Question', require('../../schemas/question').default);
    this.QuestionSet = this.db.model('QuestionSet', require('../../schemas/questionset').default);
    this.Response = this.db.model('Response', require('../../schemas/response').default);
    this.User = this.db.model('User', require('../../schemas/user').default);
    this.Company = this.db.model('Company', require('../../schemas/company').default);
    this.Node = this.db.model('Node', require('../../schemas/node').default);
    this.Token = this.db.model('Token', require('../../schemas/token').default);
    this.Options = this.db.model('Options', require('../../schemas/options').default);
  }

  /**
   * listen to mongo db events
   */
  _setupDBEvents() {
    this.db.on('connected', ()=>{
      this._status='connected';
      this.logger.info(`DB connected.`);
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
  }

  /**
   * Connect to the mongo db
   * @return {Promise} that gets resolved when the db is connected.
   */
  async connect() {
    this.logger.trace('connect');
    const uri = `mongodb://${process.env['DB_SERVER']}:${process.env['DB_PORT']}/pulsedb`;
    this.db = mongoose.createConnection();

    this._setupDBEvents();

    try {
      this.logger.debug('MONGODB connecting to ' + uri);
      await this.db.openUri(uri, {
        user: process.env['DB_USERNAME'],
        pass: process.env['DB_PASSWORD'],
        useNewUrlParser: true,
        useMongoClient: true,
        autoIndex: false, // Don't build indexes
      });
      this.createModels();
    } catch (err) {
      this.logger.error(`DB unable to connect to ${uri}`, err);
      throw err;
    }
  }
}
