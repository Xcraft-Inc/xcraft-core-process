'use strict';


exports.exec = function () {
  return false;
};

exports.rc = function (code, callback) {
  callback (null, code);
};

exports.getLevel = function () {
  return 0;
};
