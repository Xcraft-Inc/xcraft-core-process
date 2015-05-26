'use strict';

var PrintBuffer = require ('../printbuffer.js');


module.exports = function (opts) {
  var xLog      = require ('xcraft-core-log') (opts.mod);
  var forwarder = require ('../forwarders/' + opts.forwarder + '.js');
  var parser    = require ('../parsers/' + opts.parser + '.js');

  var buffer = {
    stdout: new PrintBuffer (),
    stderr: new PrintBuffer ()
  };

  var onStd = function (line, std) {
    buffer[std].buf (line, function (line) {
      xLog[forwarder.level (line, std)] (line);
      parser.exec (line, opts.events);
    });
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
