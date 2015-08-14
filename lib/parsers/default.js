'use strict';


exports.exec = function () {
  return false;
};

exports.rc = function (code, args, callback) {
  var err = null;

  if (code) {
    err = 'rc=' + code;
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 0;
};
