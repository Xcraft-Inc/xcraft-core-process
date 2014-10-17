'use strict';

var exec = function (prog,
                     callbackDone,
                     callbackStdout,
                     callbackStderr) {
  prog.stdout.on ('data', function (data) {
    data.toString ().replace (/\r/g, '').split ('\n').forEach (function (line) {
      if (line.trim ().length) {
        if (callbackStdout) {
          callbackStdout (line);
        } else {
          console.log (line);
        }
      }
    });
  });

  prog.stderr.on ('data', function (data) {
    data.toString ().replace (/\r/g, '').split ('\n').forEach (function (line) {
      if (line.trim ().length) {
        if (callbackStderr) {
          callbackStderr (line);
        } else {
          console.log (line);
        }
      }
    });
  });

  prog.on ('error', function (data) {
    console.log (data);

    if (callbackDone) {
      callbackDone (false);
    }
  });

  prog.on ('close', function (code) { /* jshint ignore:line */
    if (callbackDone) {
      callbackDone (true);
    }
  });
};

exports.spawn = function (bin, args,
                          callbackDone,
                          callbackStdout,
                          callbackStderr) {
  var spawn  = require ('child_process').spawn;
  var prog = spawn (bin, args);

  exec (prog, callbackDone, callbackStdout, callbackStderr);
  return prog;
};

exports.fork = function (bin, args, opts,
                         callbackDone,
                         callbackStdout,
                         callbackStderr) {
  var fork = require ('child_process').fork;
  var prog = fork (bin, args, opts);

  exec (prog, callbackDone, callbackStdout, callbackStderr);
  return prog;
};
