'use strict';


exports.exec = function () {
  return false;
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
