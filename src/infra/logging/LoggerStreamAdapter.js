const LoggerStreamAdapter = {
  toStream(logger) {
    const log=logger('HTTP');
    return {
      write(message) {
        log.info(message.slice(0, -1));
      },
    };
  },
};

module.exports = LoggerStreamAdapter;
