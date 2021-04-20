'use strict';

exports.exec = function (line, output, args, resp) {
  if (!resp) {
    return false;
  }

  var regex = new RegExp(
    /(Compressing|Receiving|Resolving|Counting objects|Checking out files|Updating files)[^0-9%]*([0-9]{1,})%/g
  );
  var match = null;
  var res = false;
  while ((match = regex.exec(line))) {
    res = true;
    resp.log.progress(match[1], match[2], 100);
  }

  return res;
};

exports.rc = function (code, args, callback) {
  var err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = `git error, exit code: ${code}, args: ${(args || []).join(' ')}`;
  }

  callback(err, code);
};

exports.getLevel = function () {
  return 0;
};
