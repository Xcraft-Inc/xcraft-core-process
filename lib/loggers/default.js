'use strict';


module.exports = function (opts) {
  var forwarder = require ('../forwarders/' + opts.forwarder + '.js');

  var output = {
    verb: 'stdout',
    info: 'stdout',
    warn: 'stdout',
    err:  'stderr'
  };

  return {
    onStdout: function (line) {
      process[output[forwarder.level (line, 'stdout')]].write (line);
    },

    onStderr: function (line) {
      process[output[forwarder.level (line, 'stderr')]].write (line);
    },

    onClose: function (code, callback) {
      callback (null, code);
    }
  };
};
