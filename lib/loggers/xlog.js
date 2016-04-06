'use strict';

var PrintBuffer = require ('../printbuffer.js');


module.exports = function (opts) {
  var forwarder = require ('../forwarders/' + opts.forwarder + '.js');
  var parser    = require ('../parsers/' + opts.parser + '.js');

  opts.response.log.setVerbosity (parser.getLevel (), true);

  var buffer = {
    stdout: new PrintBuffer (),
    stderr: new PrintBuffer ()
  };

  var onStd = function (line, std) {
    buffer[std].buf (line, function (line) {
      var exec = parser.exec (line, std, opts.args, opts.response);
      if (!exec) {
        opts.response.log[forwarder.level (line, std)] (line);
      }
    });
  };

  return {
    onStdout: function (line) {
      onStd (line, 'stdout');
    },

    onStderr: function (line) {
      onStd (line, 'stderr');
    },

    onClose: function (code, callback) {
      parser.rc (code, opts.args, callback);
    }
  };
};
