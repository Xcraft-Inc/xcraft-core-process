'use strict';

const PrintBuffer = require('./lib/printbuffer.js');

var parseLine = function (encoding, out, data) {
  var lines = data.toString(encoding).replace(/\r/g, '').split('\n');

  lines.forEach(function (line, index) {
    out(line + (index !== lines.length - 1 ? '\n' : ''));
  });
};

var parse = function (
  prog,
  logger,
  encoding,
  callback,
  callbackStdout,
  callbackStderr
) {
  let fired = false;

  const buffer = {
    stdout: new PrintBuffer(),
    stderr: new PrintBuffer(),
  };

  if (prog.stdout) {
    prog.stdout.on('data', function (data) {
      parseLine(
        encoding,
        function (line) {
          buffer.stdout.buf(line, (line) => {
            logger.onStdout(line);
            if (callbackStdout) {
              callbackStdout(line);
            }
          });
        },
        data
      );
    });
  }

  if (prog.stderr) {
    prog.stderr.on('data', function (data) {
      parseLine(
        encoding,
        function (line) {
          buffer.stderr.buf(line, (line) => {
            logger.onStderr(line);
            if (callbackStderr) {
              callbackStderr(line);
            }
          });
        },
        data
      );
    });
  }

  const drain = () => {
    if (buffer.stdout.data) {
      logger.onStdout(buffer.stdout.data);
      if (callbackStdout) {
        callbackStdout(buffer.stdout.data);
      }
    }
    if (buffer.stderr.data) {
      logger.onStderr(buffer.stdout.data);
      if (callbackStderr) {
        callbackStderr(buffer.stdout.data);
      }
    }
  };

  prog.on('error', function (data) {
    if (callback) {
      drain();
      callback(data);
      fired = true;
    }
  });

  const closeEvent = prog.stdout || prog.stderr ? 'close' : 'exit';
  prog.on(closeEvent, function (code) {
    if (!fired) {
      drain();
      logger.onClose(code, callback);
    }
  });
};

module.exports = function (options) {
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
  let pid = -1;

  return {
    getpid: () => {
      return pid;
    },

    spawn: function (
      bin,
      args,
      opts,
      callback,
      callbackStdout,
      callbackStderr
    ) {
      var spawn = require('child_process').spawn;

      options.args = args;
      options.encoding = opts.encoding;

      delete opts.encoding;

      var logger = null;
      var prog = null;
      try {
        prog = spawn(bin, args, opts);

        options.pid = pid = prog.pid;
        logger = loggerFile(options);

        parse(
          prog,
          logger,
          options.encoding,
          callback,
          callbackStdout,
          callbackStderr
        );
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

        exec('"' + bin + '" ' + args.join(' '), function (err, stdout, stderr) {
          parseLine(
            options.encoding,
            function (line) {
              logger.onStdout(line);
              if (callbackStdout) {
                callbackStdout(line);
              }
            },
            stdout
          );

          parseLine(
            options.encoding,
            function (line) {
              logger.onStderr(line);
              if (callbackStderr) {
                callbackStderr(line);
              }
            },
            stderr
          );

          if (err) {
            logger.onClose(err.code, callback);
          }
        });

        return null;
      }
    },

    fork: function (bin, args, opts, callback, callbackStdout, callbackStderr) {
      var fork = require('child_process').fork;
      var prog = fork(bin, args, opts);

      options.pid = pid = prog.pid;
      options.args = args;
      var logger = loggerFile(options);

      parse(
        prog,
        logger,
        options.encoding,
        callback,
        callbackStdout,
        callbackStderr
      );
      return prog;
    },
  };
};
