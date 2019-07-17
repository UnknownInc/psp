const {shiphold} = require('ship-hold');

/**
 * EventsDatabase infra for events db
 */
export default class EventsDatabase {
  /**
   * constructor for events database
   * @param {object} options {config, logging}
   */
  constructor({config, logger}) {
    this.config=config;
    this.logger=logger('EDB');
    this.logger.trace('constructor');
  }

  /**
   * returns the status of the db connection
   */
  get status() {
    return {
      status: this._status,
    };
  }

  /**
   * connect to the database
   */
  async connect() {
    this.logger.trace('connect');
    this.logger.debug(`connecting to ${process.env['EVENTS_SERVER']}`);
    try {
      this.sh = shiphold({
        host: process.env['EVENTS_SERVER'],
        port: process.env['EVENTS_SERVER_PORT'],
        user: process.env['EVENTS_USER'],
        password: process.env['EVENTS_PASSWORD'],
        database: 'psb',
      });

      await this.sh.connect();

      this.Events = this.sh.service({
        name: 'Events',
        table: 'users_events',
      });

      this.Nodes = this.sh.service({
        name: 'Nodes',
        table: 'nodes',
        primaryKey: 'node_id',
      });
    } catch (err) {
      this.logger.error(err);
      this._status='Connection Failure';
    }
  }
}
