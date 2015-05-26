'use strict';


module.exports = function (opts) {
  var forwarder = require ('../forwarders/' + opts.forwarder + '.js');
  var parser    = require ('../parsers/' + opts.parser + '.js');

  var output = {
    verb: 'stdout',
    info: 'stdout',
    warn: 'stdout',
    err:  'stderr'
  };

  var onStd = function (line, std) {
    process[output[forwarder.level (line, std)]].write (line);
    parser.exec (line, opts.events);
  };

  return {
    onStdout: function (line) {
      onStd (line, 'stdout');
    },

    onStderr: function (line) {
      onStd (line, 'stderr');
    },

    onClose: parser.rc
  };
};
