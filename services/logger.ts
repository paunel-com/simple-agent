const noop = (...args) => undefined;
const logger = {
  log: noop,
  error: noop,
  debug: noop
}

if (process.env.DEBUG || process.env.NODE_ENV !== 'production') {
  logger.log = console.log;
  logger.error = console.error;
  logger.debug = console.debug;
}

export default logger;