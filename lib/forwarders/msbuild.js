'use strict';

exports.level = function(line, output) {
  switch (output) {
    case 'stdout': {
      if (
        /error (MSB|CS)[0-9]{1,}/.test(line) ||
        line.indexOf('Command line error') >= 0
      ) {
        return 'err';
      }

      return 'verb';
    }

    case 'stderr': {
      return 'warn';
    }
  }
};
