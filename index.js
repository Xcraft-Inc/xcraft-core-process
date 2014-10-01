'use strict';

var spawn  = require ('child_process').spawn;

exports.spawn = function (bin, args,
                          callbackDone,
                          callbackStdout,
                          callbackStderr) {
  var prog = spawn (bin, args);

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
