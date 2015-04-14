'use strict';

var PrintBuffer = require ('../printbuffer.js');


module.exports = function (opts) {
  var xLog      = require ('xcraft-core-log') (opts.mod);
  var forwarder = require ('../forwarders/' + opts.forwarder + '.js');

  var stdout = new PrintBuffer ();
  var stderr = new PrintBuffer ();

  return {
    onStdout: function (line) {
      stdout.buf (line, function (line) {
        xLog[forwarder.level (line, 'stdout')] (line);
      });
    },

    onStderr: function (line) {
      stderr.buf (line, function (line) {
        xLog[forwarder.level (line, 'stderr')] (line);
      });
    },

    onClose: function (code, callback) {
      callback (null, code);
    }
  };
};
