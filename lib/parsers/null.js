'use strict';


exports.exec = function () {
  return true;
};

exports.rc = function (code, args, callback) {
  callback (null, code);
};

exports.getLevel = function () {
  return 0;
};
