// logger.js
import debug from 'debug';

const base = 'queue-port';

export const createLogger = (submodule = '') => {
  return debug(submodule ? `${base}:${submodule}` : base);
};
