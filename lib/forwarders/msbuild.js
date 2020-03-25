'use strict';

exports.level = function(line, output) {
  switch (output) {
    case 'stdout': {
      if (
        /error (MSB|CS|CA)[0-9]{1,}/.test(line) ||
        line.indexOf('Command line error') >= 0
      ) {
        return 'err';
      }

      if (/warning (MSB|CS|CA)[0-9]{1,}/.test(line)) {
        return 'warn';
      }

      return 'verb';
    }

    case 'stderr': {
      return 'warn';
    }
  }
};
