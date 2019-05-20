
export default class Database {
  /**
   * 
   * @param {object} options {config, logging}
   */
  constructor({config, logger}){
    logger.trace('Database.constructor');
    this.logger=logger;
  }

  authenticate(){
    this.logger.trace('Database.authenticate')
    return Promise.resolve({})
  }
}