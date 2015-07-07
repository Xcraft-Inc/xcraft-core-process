'use strict';


exports.exec = function () {
  return false;
};

exports.rc = function (code, args, callback) {
  var err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = 'msbuild error';
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 0;
};
