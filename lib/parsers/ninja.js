'use strict';

exports.exec = (line, output, args, resp) => {
  if (!resp) {
    return false;
  }

  const regex = new RegExp(/\[([0-9]+)\/([0-9]+)\] /g);
  let match = null;
  let res = false;
  while ((match = regex.exec(line))) {
    res = true;
    resp.log.progress('Ninja building', match[1], match[2]);
  }

  return res;
};

exports.rc = (code, args, callback) => {
  let err = null;

  /* TODO: handle all sort of error codes */
  if (code) {
    err = 'ninja error';
  }

  callback(err, code);
};

exports.getLevel = () => 0;
