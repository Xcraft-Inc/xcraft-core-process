'use strict';

var PrintBuffer = require ('../printbuffer.js');


module.exports = function (opts) {
  var stdout = new PrintBuffer ();
  var stderr = new PrintBuffer ();

  var prefix = '(' + opts.pid + ') ';

  return {
    onStdout: function (line) {
      stdout.buf (line, function (line) {
        process.stdout.write (line);
      }, prefix);
    },

    onStderr: function (line) {
      stderr.buf (line, function (line) {
        process.stderr.write (line);
      }, prefix);
    },

    onClose: function (code, callback) {
      callback (null, code);
    }
  };
};
