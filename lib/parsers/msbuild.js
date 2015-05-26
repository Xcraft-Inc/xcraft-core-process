'use strict';


exports.exec = function () {};

exports.rc = function (code, callback) {
  var err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = 'build has failed';
  }

  callback (err, code);
};
