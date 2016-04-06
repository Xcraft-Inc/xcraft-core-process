'use strict';


exports.exec = function (line, output, args, response) {
  if (!response) {
    return false;
  }

  var regex = new RegExp (/\[[ ]*([0-9]{1,})%\]/g);
  var match = null;
  var res   = false;
  while ((match = regex.exec (line))) {
    res = true;
    response.log.progress ('Building', match[1], 100);
  }

  return res;
};

exports.rc = function (code, args, callback) {
  var err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = 'cmake error';
  }

  callback (err, code);
};

exports.getLevel = function () {
  return 0;
};
