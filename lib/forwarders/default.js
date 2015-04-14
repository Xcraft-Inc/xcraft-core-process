'use strict';

exports.level = function (line, output) {
  var level = {
    stdout: 'verb',
    stderr: 'warn'
  };

  return level[output];
};
