'use strict';

var moduleName = 'process/cmake';


exports.exec = function (line, events) {
  if (!events) {
    return;
  }

  var xLog = require ('xcraft-core-log') (moduleName);

  var regex = new RegExp (/\[[ ]*([0-9]{1,})%\]/g);
  var match = null;
  while ((match = regex.exec (line))) {
    xLog.progress ('Building', match[1], 100);
  }
};

exports.rc = function (code, callback) {
  var err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = 'build has failed';
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 2;
};
