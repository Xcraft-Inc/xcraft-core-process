'use strict';

const PrintBuffer = require('./lib/printbuffer.js');

var parseLine = function(out, data) {
  var lines = data
    .toString()
    .replace(/\r/g, '')
    .split('\n');

  lines.forEach(function(line, index) {
    out(line + (index !== lines.length - 1 ? '\n' : ''));
  });
};

var parse = function(prog, logger, callback, callbackStdout, callbackStderr) {
  let fired = false;

  const buffer = {
    stdout: new PrintBuffer(),
    stderr: new PrintBuffer(),
  };

  if (prog.stdout) {
    prog.stdout.on('data', function(data) {
      parseLine(function(line) {
        buffer.stdout.buf(line, line => {
          logger.onStdout(line);
          if (callbackStdout) {
            callbackStdout(line);
          }
        });
      }, data);
    });
  }

  if (prog.stderr) {
    prog.stderr.on('data', function(data) {
      parseLine(function(line) {
        buffer.stderr.buf(line, line => {
          logger.onStderr(line);
          if (callbackStderr) {
            callbackStderr(line);
          }
        });
      }, data);
    });
  }

  prog.on('error', function(data) {
    if (callback) {
      callback(data);
      fired = true;
    }
  });

  prog.on('exit', function(code) {
    if (!fired) {
      logger.onClose(code, callback);
    }
  });
};

module.exports = function(options) {
  if (!options) {
    options = {};
  }

  if (!options.hasOwnProperty('logger')) {
    options.logger = 'default';
  }

  if (!options.hasOwnProperty('forwarder')) {
    options.forwarder = 'default';
  }

  if (!options.hasOwnProperty('parser')) {
    options.parser = 'default';
  }

  var loggerFile = require('./lib/loggers/' + options.logger + '.js');

  return {
    spawn: function(bin, args, opts, callback, callbackStdout, callbackStderr) {
      var spawn = require('child_process').spawn;

      options.args = args;

      var logger = null;
      var prog = null;
      try {
        prog = spawn(bin, args, opts);

        options.pid = prog.pid;
        logger = loggerFile(options);

        parse(prog, logger, callback, callbackStdout, callbackStderr);
        return prog;
      } catch (ex) {
        /* Some installers fail with spawn for an unknown reason, then we try with
         * the exec method instead.
         */
        if (ex.code !== 'UNKNOWN') {
          throw ex;
        }

        var exec = require('child_process').exec;

        options.pid = -1;
        logger = loggerFile(options);

        exec('"' + bin + '" ' + args.join(' '), function(err, stdout, stderr) {
          parseLine(function(line) {
            logger.onStdout(line);
            if (callbackStdout) {
              callbackStdout(line);
            }
          }, stdout);

          parseLine(function(line) {
            logger.onStderr(line);
            if (callbackStderr) {
              callbackStderr(line);
            }
          }, stderr);

          if (err) {
            logger.onClose(err.code, callback);
          }
        });

        return null;
      }
    },

    fork: function(bin, args, opts, callback, callbackStdout, callbackStderr) {
      var fork = require('child_process').fork;
      var prog = fork(bin, args, opts);

      options.pid = prog.pid;
      options.args = args;
      var logger = loggerFile(options);

      parse(prog, logger, callback, callbackStdout, callbackStderr);
      return prog;
    },
  };
};
