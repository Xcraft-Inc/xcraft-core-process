'use strict';

var PrintBuffer = require ('../printbuffer.js');


module.exports = function (opts) {
  var xLog      = require ('xcraft-core-log') (opts.mod);
  var forwarder = require ('../forwarders/' + opts.forwarder + '.js');
  var parser    = require ('../parsers/' + opts.parser + '.js');

  xLog.setVerbosity (parser.getLevel (), true);

  var buffer = {
    stdout: new PrintBuffer (),
    stderr: new PrintBuffer ()
  };

  var onStd = function (line, std) {
    buffer[std].buf (line, function (line) {
      var exec = parser.exec (line, std, opts.args, opts.events);
      if (!exec) {
        xLog[forwarder.level (line, std)] (line);
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
