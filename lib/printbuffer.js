'use strict';


function PrintBuffer () {
  this.data = '';
}

PrintBuffer.prototype.buf = function (line, outFunc, prepend, append) {
  if (!/\n$/.test (line)) {
    this.data += line;
    return;
  }

  if (this.data.length && prepend) {
    prepend = '';
  }

  outFunc ((prepend || '') + this.data + line + (append || ''));
  this.data = '';
};

module.exports = PrintBuffer;
