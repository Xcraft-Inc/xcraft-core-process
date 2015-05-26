'use strict';

exports.exec = function (line, events) {
  if (!events) {
    return;
  }

  var busLog = {};

  /* busLog is not a mandatory dependency. */
  try {
    busLog = require ('xcraft-core-buslog');
  } catch (ex) {
    if (ex.code === 'MODULE_NOT_FOUND') {
      return;
    }
  }

  var regex = new RegExp (/\[[ ]*([0-9]{1,})%\]/g);
  var match = null;
  while ((match = regex.exec (line))) {
    busLog.progress ('Building', match[1], 100);
  }
};

exports.rc = function (code, callback) {
  callback (null, code);
};
