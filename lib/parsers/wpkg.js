'use strict';


exports.exec = function () {
  return false;
};

exports.rc = function (code, args, callback) {
  var err = null;

  if (args.indexOf ('--is-installed') !== -1) {
    if (code > 2) {
      err = 'error with --is-installed option';
    }
  } else if (code) {
    err = 'error with wpkg';
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 0;
};
