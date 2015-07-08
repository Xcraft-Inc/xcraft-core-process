'use strict';

exports.level = function (line, output) {
  switch (output) {
  case 'stdout': {
    if (/error MSB[0-9]{1,}/.test (line)) {
      return 'err';
    }

    return 'verb';
  }

  case 'stderr': {
    return 'warn';
  }
  }
};
