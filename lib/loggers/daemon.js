'use strict';

module.exports = function(opts) {
  var defaultLogger = require('./default.js')(opts);

  var prefix = '(' + opts.pid + ') ';

  return {
    onStdout: function(line) {
      defaultLogger.onStdout(prefix + line);
    },

    onStderr: function(line) {
      defaultLogger.onStderr(prefix + line);
    },

    onClose: function(code, callback) {
      defaultLogger.onClose(code, callback);
    },
  };
};
