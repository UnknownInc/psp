const Redis = require('ioredis');

/**
 * Cache a redis wrapper
 */
export default class Cache {
  /**
   * constructor for teh cache class
   * @param {object} options with a config property
   */
  constructor({config, logger}) {
    this.config = config;
    this.logger = logger('Cache');
    this.status = {};
    this.logger.trace('constructor');
  }

  /**
   * starts the connection to the cache
   */
  async connect() {
    this.logger.trace('connect');
    this.cache = new Redis({
      host: process.env['CACHE_SERVER'],
      port: Number.parseInt(process.env['CACHE_PORT']),
      password: process.env['CACHE_PASSWORD'],
    });

    this.get = this.cache.get.bind(this.cache);
    this.set = this.cache.set.bind(this.cache);

    this.cache.on('connect', (err) => {
      this.logger.info('REDIS: connected.');
      this.status.connectionStatus = 'connected';
      this.status.serverInfo = Object.assign({}, this.cache.server_info);
    });

    this.cache.on('error', (err) => {
      this.logger.error('REDIS: Error ', err);
      this.status.lastError=err;
    });

    this.cache.on('ready', (err) => {
      this.logger.info('REDIS: ready.');
      this.status.connectionStatus = 'ready';
    });

    this.cache.on('end', (err) => {
      this.logger.warn('REDIS: disconnected');
      this.status.connectionStatus = 'disconnected';
    });

    this.cache.on('reconnecting', (err) => {
      this.logger.warn('REDIS: reconnecting');
      this.status.connectionStatus = 'reconnecting';
    });
  }
}
