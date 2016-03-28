'use strict';


exports.exec = function (line, output, args) {
  if (args.indexOf ('--listfiles') !== -1 &&
      output === 'stdout') {
    return true;
  }

  if (args.indexOf ('--list-index-packages') !== -1 &&
      output === 'stdout' &&
      /\.ctrl[\r\n]*$/.test (line)) {
    console.dir (line);
    return true;
  }

  return false;
};

exports.rc = function (code, args, callback) {
  var err = null;

  if (args.indexOf ('--is-installed') !== -1) {
    if (code > 2) {
      err = 'error with --is-installed option';
    }
  } else if (code) {
    err = 'wpkg error';
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 0;
};
