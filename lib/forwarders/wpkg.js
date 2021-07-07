'use strict';

exports.level = function (line, output) {
  switch (output) {
    case 'stdout': {
      if (/^error/.test(line)) {
        return process.env.PEON_DEBUG_ENV === '1' ? 'warn' : 'err';
      }

      return 'verb';
    }

    case 'stderr': {
      if (/^wpkg(_static)?:debug/.test(line)) {
        return 'verb';
      } else if (/^wpkg(_static)?:info/.test(line)) {
        return 'info';
      } else if (
        /^wpkg(_static)?:warning/.test(line) ||
        /^\(node\) warning/.test(line)
      ) {
        return 'warn';
      }

      return process.env.PEON_DEBUG_ENV === '1' ? 'warn' : 'err';
    }
  }
};
