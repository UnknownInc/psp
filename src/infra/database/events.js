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
    this.logger.trace(`${__filename} connect`);
    const host = process.env['EVENTS_SERVER'];
    const port = process.env['EVENTS_SERVER_PORT'];
    try {
      this.logger.debug(`POSTGRES connecting to ${host}:${port}`);
      this.sh = shiphold({
        host,
        port,
        user: process.env['EVENTS_USER'],
        password: process.env['EVENTS_PASSWORD'],
        database: 'psb',
      });

      await this.sh.connect();
      this.logger.info(`POSTGRES Connected to ${host}`);
      this._status='Ready';

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
/*

    const {shiphold} = require('ship-hold');
    const host = process.env['EVENTS_SERVER'];
    const port = process.env['EVENTS_SERVER_PORT'];
    const user = process.env['EVENTS_USER'];
    const password = process.env['EVENTS_PASSWORD'];
    const database = 'psb';

    const { Pool, Client } = require('pg')
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    const pool = new Pool({
      connectionString: connectionString,
    });

    pool.query('SELECT NOW()', (err, res) => {
      console.log(err, res)
      pool.end()
    });

    const client = new Client({
      connectionString: connectionString,
    });

    client.connect();

    client.query('SELECT NOW()', (err, res) => {
      console.log(err, res)
      client.end()
    });

*/
