'use strict';

module.exports = function(opts) {
  var forwarder = require('../forwarders/' + opts.forwarder + '.js');
  var parser = require('../parsers/' + opts.parser + '.js');

  opts.resp.log.setVerbosity(parser.getLevel(), true);

  var onStd = function(line, std) {
    var exec = parser.exec(line, std, opts.args, opts.resp);
    if (!exec) {
      opts.resp.log[forwarder.level(line, std)](line);
    }
  };

  return {
    onStdout: function(line) {
      onStd(line, 'stdout');
    },

    onStderr: function(line) {
      onStd(line, 'stderr');
    },

    onClose: function(code, callback) {
      parser.rc(code, opts.args, callback);
    },
  };
};
