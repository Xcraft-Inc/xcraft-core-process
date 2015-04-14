'use strict';


module.exports = function () {
  return {
    onStdout: function (line) {
      process.stdout.write (line);
    },

    onStderr: function (line) {
      process.stderr.write (line);
    },

    onClose: function (code, callback) {
      callback (null, code);
    }
  };
};
