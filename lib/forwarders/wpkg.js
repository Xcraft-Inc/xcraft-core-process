'use strict';

exports.level = function (line, output) {
  switch (output) {
  case 'stdout': {
    if (/^error/.test (line)) {
      return 'err';
    }

    return 'verb';
  }

  case 'stderr': {
    if (/^wpkg:debug/.test (line)) {
      return 'verb';
    } else if (/^wpkg:info/.test (line)) {
      return 'info';
    } else if (/^wpkg:warning/.test (line) ||
               /^\(node\) warning/.test (line)) {
      return 'warn';
    }

    return 'err';
  }
  }
};
