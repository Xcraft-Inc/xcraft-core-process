'use strict';

exports.exec = function (line, output, args, resp) {
  if (!resp) {
    return false;
  }

  const regex = /\[ *([0-9]+)[,.][0-9]%\] (.*)/g;
  let match = null;
  let res = false;
  while ((match = regex.exec(line))) {
    res = true;
    resp.log.progress(match[2], match[1], 100);
  }

  return res;
};

exports.rc = function (code, args, callback) {
  let err = null;

  if (code) {
    err = `esign error, exit code: ${code}, args: ${(args || []).join(' ')}`;
  }

  callback(err, code);
};

exports.getLevel = function () {
  return 0;
};
