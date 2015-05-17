'use strict';

exports.exec = function (line, events) {
  if (!events) {
    return;
  }

  var busLog = require ('xcraft-core-buslog');

  var match = line.match (/^\[[ ]*([0-9]{1,})%\]/);
  if (!match) {
    return;
  }

  var length   = 100;
  var position = match[1];
  var task     = 'Building';

  busLog.progress (task, position, length);
};
