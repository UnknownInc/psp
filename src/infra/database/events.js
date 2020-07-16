const {shiphold} = require('ship-hold');
const { Pool } = require('pg');

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

  async setup() {
    this.logger.trace(`EDB setup`);
    try {
      const setupresults=await this.sh.query(`

    CREATE TABLE IF NOT EXISTS questions(
        question_id VARCHAR PRIMARY KEY,
        date DATE NOT NULL,
        data jsonb
    );
    
    CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR PRIMARY KEY,
        email VARCHAR(100) NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS nodes (
      node_id VARCHAR PRIMARY KEY,
      user_id VARCHAR,
      children VARCHAR[],
      type VARCHAR,
      name VARCHAR
    );
    
    CREATE TABLE IF NOT EXISTS events(
        source_id VARCHAR,
        groups jsonb,
        event_type VARCHAR,
        event_ref VARCHAR  NOT NULL,
        time TIMESTAMP NOT NULL,
        event_data jsonb,
        value REAL,
        category VARCHAR,
        PRIMARY KEY (source_id, event_ref, time)
    );
    
    -- This creates a hypertable that is partitioned by time
    --   using the values in the 'time' column.
    
    SELECT create_hypertable('events', 'time', chunk_time_interval => interval '1 day', if_not_exists => TRUE);


    CREATE INDEX IF NOT EXISTS idx_e_cat ON events(category); 
    CREATE INDEX IF NOT EXISTS idx_e_et ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_e_grp_gin ON events USING GIN (groups); 
    CREATE INDEX IF NOT EXISTS idx_e_ed_gin ON events USING GIN (event_data);
      `);
      this.logger.info('EDB setup: ', setupresults);
    } catch(err) {
      this.logger.error(err);
      this._status='Setup Failure';
    }
  }

  /**
   * connect to the database
   */
  async connect() {
    this.logger.trace(`${__filename} connect`);
    const host = process.env['EVENTS_SERVER'];
    const port = process.env['EVENTS_SERVER_PORT'];
    const user = process.env['EVENTS_USER'];
    const password = process.env['EVENTS_PASSWORD'];
    const database = 'psb';

    try {
      this.logger.debug(`POSTGRES connecting to ${host}:${port}`);
      this.pool = new Pool({
        connectionString: `postgresql://${user}:${password}@${host}:${port}/${database}`,
      });

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

      await this.setup();

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
