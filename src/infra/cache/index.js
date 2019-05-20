
/**
 * Cache a redis wrapper
 */
export default class Cache {
  /**
   * constructor for teh cache class
   * @param {object} options with a config property
   */
  constructor({config}) {
    this.config=config;
  }

  /**
   * starts the connection to the cache
   */
  async start() {

  }
}
