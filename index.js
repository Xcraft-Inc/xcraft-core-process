'use strict';


var parseLine = function (out, data) {
  var lastNewline = false;
  var lines = data.toString ().replace (/\r/g, '').split ('\n');

  if (!lines[lines.length - 1].length) {
    lastNewline = true;
    lines.splice (-1, 1);
  }

  lines.forEach (function (line) {
    var nl = lastNewline ? '\n' : '';
    out (line + nl);
  });
};

var parse = function (prog, parser, callback, callbackStdout, callbackStderr) {
  if (prog.stdout) {
    prog.stdout.on ('data', function (data) {
      if (callbackStdout) {
        parseLine (callbackStdout, data);
      } else {
        parseLine (parser.onStdout, data);
      }
    });
  }

  if (prog.stderr) {
    prog.stderr.on ('data', function (data) {
      if (callbackStderr) {
        parseLine (callbackStderr, data);
      } else {
        parseLine (parser.onStderr, data);
      }
    });
  }

  prog.on ('error', function (data) {
    if (callback) {
      callback (data);
    }
  });

  prog.on ('close', function (code) {
    parser.onClose (code, callback);
  });
};

module.exports = function (parsing, opts) {
  if (!parsing) {
    parsing = 'default';
  }

  var parserFile = require ('./lib/loggers/' + parsing + '.js');
  var parserOpts = opts || {};

  return {
    spawn: function (bin, args, opts, callback, callbackStdout, callbackStderr) {
      var spawn = require ('child_process').spawn;
      var prog = null;
      try {
        prog = spawn (bin, args, opts);

        parserOpts.pid = prog.pid;
        var parser = parserFile (parserOpts);

        parse (prog, parser, callback, callbackStdout, callbackStderr);
        return prog;
      } catch (ex) {
        /* Some installers fail with spawn for an unknown reason, then we try with
         * the exec method instead.
         */
        if (ex.code !== 'UNKNOWN') {
          throw ex;
        }

        var exec = require ('child_process').exec;

        exec ('"' + bin + '" ' + args.join (' '), function (err, stdout, stderr) {
          if (callbackStdout) {
            parseLine (callbackStdout, stdout);
          } else {
            parseLine (parser.onStdout, stdout);
          }

          if (callbackStderr) {
            parseLine (callbackStderr, stderr);
          } else {
            parseLine (parser.onStderr, stderr);
          }

          if (err) {
            parser.onClose (err.code, callback);
          }
        });

        return null;
      }
    },

    fork: function (bin, args, opts, callback, callbackStdout, callbackStderr) {
      var fork = require ('child_process').fork;
      var prog = fork (bin, args, opts);

      parserOpts.pid = prog.pid;
      var parser = parserFile (parserOpts);

      parse (prog, parser, callback, callbackStdout, callbackStderr);
      return prog;
    }
  };
};
