'use strict';

var PrintBuffer = require ('../printbuffer.js');


module.exports = function (opts) {
  var xLog = require ('xcraft-core-log') (opts.mod);

  var stdout = new PrintBuffer ();
  var stderr = new PrintBuffer ();

  return {
    onStdout: function (line) {
      stdout.buf (line, xLog.verb);
    },

    onStderr: function (line) {
      stderr.buf (line, xLog.warn);
    },

    onClose: function (code, callback) {
      callback (null, code);
    }
  };
};
