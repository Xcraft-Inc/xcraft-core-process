'use strict';

module.exports = (opts) => {
  const parser = require('../parsers/' + opts.parser + '.js');
  return {
    onStdout: () => {},
    onStderr: () => {},
    onClose: (code, callback) => {
      parser.rc(code, opts.args, callback);
    },
  };
};
