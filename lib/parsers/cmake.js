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

  var match = line.match (/^\[[ ]*([0-9]{1,})%\]/);
  if (!match) {
    return;
  }

  var length   = 100;
  var position = match[1];
  var task     = 'Building';

  busLog.progress (task, position, length);
};
