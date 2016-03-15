'use strict';

var moduleName = 'process/git';


exports.exec = function (line, output, args, events) {
  if (!events) {
    return false;
  }

  var xLog = require ('xcraft-core-log') (moduleName);

  var regex = new RegExp (/(Compressing|Receiving|Resolving)[^0-9%]*([0-9]{1,})%/g);
  var match = null;
  var res   = false;
  while ((match = regex.exec (line))) {
    res = true;
    xLog.progress (match[1], match[2], 100);
  }

  return res;
};

exports.rc = function (code, args, callback) {
  var err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = 'git error';
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 0;
};
