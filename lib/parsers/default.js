'use strict';


exports.exec = function () {};

exports.rc = function (code, callback) {
  callback (null, code);
};

exports.getLevel = function () {
  return 0;
};
