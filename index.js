'use strict';

var exec = function (prog,
                     callback,
                     callbackStdout,
                     callbackStderr) {
  if (prog.stdout) {
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
  }

  if (prog.stderr) {
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
  }

  prog.on ('error', function (data) {
    if (callback) {
      callback (data);
    }
  });

  prog.on ('close', function (code) {
    if (callback) {
      callback (null, code);
    }
  });
};

exports.spawn = function (bin, args, opts,
                          callback,
                          callbackStdout,
                          callbackStderr) {
  var spawn  = require ('child_process').spawn;
  var prog = spawn (bin, args, opts);

  exec (prog, callback, callbackStdout, callbackStderr);
  return prog;
};

exports.fork = function (bin, args, opts,
                         callback,
                         callbackStdout,
                         callbackStderr) {
  var fork = require ('child_process').fork;
  var prog = fork (bin, args, opts);

  exec (prog, callback, callbackStdout, callbackStderr);
  return prog;
};
