'use strict';

var moduleName = 'process/cmake';


exports.exec = function (line, events) {
  if (!events) {
    return false;
  }

  var xLog = require ('xcraft-core-log') (moduleName);

  var regex = new RegExp (/\[[ ]*([0-9]{1,})%\]/g);
  var match = null;
  var res   = false;
  while ((match = regex.exec (line))) {
    res = true;
    xLog.progress ('Building', match[1], 100);
  }

  return res;
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
  return 0;
};
