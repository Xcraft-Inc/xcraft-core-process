'use strict';

const ansiRegex = require('ansi-regex');

exports.level = function (line, output) {
  switch (output) {
    case 'stdout': {
      let lineNoColor = line.replace(ansiRegex(), '');
      const matches = lineNoColor.match(
        /^[a-zA-Z]+ \[[a-zA-Z/.\-_]+\] (Verb|Info|Warn|Err|Dbg):/
      );
      if (matches && matches.length >= 2) {
        return matches[1].toLowerCase();
      }

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
