#!/usr/bin/env node
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

},{}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
'use strict';

var format = require('./format');
var disparity = require('disparity');

var hr = '==================================================================' +
  '==============';

// these headers make more sense in this context
disparity.added = 'expected';
disparity.removed = 'actual';

exports.chars = chars;
function chars(str, opts, fileName) {
  var result = disparity.chars(str, format(str, opts));
  if (!result) {
    return '';
  }
  // we add a line break at the end because it looks better
  return getHeader(fileName) + result + '\n';
}

function getHeader(fileName) {
  return fileName ? cyan(fileName) + '\n' + cyan(hr) + '\n' : '';
}

function cyan(str) {
  return '\u001b[36m' + str + '\u001b[39m';
}

exports.unified = unified;
function unified(str, opts, fileName) {
  return disparity.unified(str, format(str, opts), {
    paths: [fileName]
  });
}

exports.unifiedNoColor = unifiedNoColor;
function unifiedNoColor(str, opts, fileName) {
  return disparity.unifiedNoColor(str, format(str, opts), {
    paths: [fileName]
  });
}

},{"./format":6,"disparity":55}],6:[function(require,module,exports){
'use strict';

var _options = require('./options');
// we use espree because it supports more ES6 features than esprima at the
// moment and supports JSX
var espree = require('espree');
var npmRun = require('npm-run');
var plugins = require('./plugins');
var rocambole = require('rocambole');
var transform = require('./transform');


exports = module.exports = format;
function format(str, opts) {
  // we need to load and register the plugins as soon as possible otherwise
  // `stringBefore` won't be called and default settings won't be used
  _options.set(opts);

  // remove shebang before pipe because piped commands might not know how
  // to handle it
  var prefix = '';
  if (_options.get('esformatter.allowShebang')) {
    prefix = getShebang(str);
    if (prefix) {
      str = str.replace(prefix, '');
    }
  }

  var pipeCommands = _options.get('pipe');

  if (pipeCommands) {
    str = pipe(pipeCommands.before, str).toString();
  }

  str = doFormat(str, opts);

  if (pipeCommands) {
    str = pipe(pipeCommands.after, str).toString();
  }

  // we only restore bang after pipe because piped commands might not know how
  // to handle it
  return prefix + str;
}


// allows users to override parser
exports.parseFn = espree.parse;
exports.parseContext = espree;
exports.parseOptions = {
  ecmaFeatures: {
    arrowFunctions: true,
    blockBindings: true,
    destructuring: true,
    regexYFlag: true,
    regexUFlag: true,
    templateStrings: true,
    binaryLiterals: true,
    octalLiterals: true,
    unicodeCodePointEscapes: true,
    defaultParams: true,
    restParams: true,
    forOf: true,
    objectLiteralComputedProperties: true,
    objectLiteralShorthandMethods: true,
    objectLiteralShorthandProperties: true,
    objectLiteralDuplicateProperties: true,
    generators: true,
    spread: true,
    classes: true,
    modules: true,
    jsx: true,
    globalReturn: true
  }
};


function getShebang(str) {
  var result = (/^#!.+\n/).exec(str);
  return result ? result[0] : '';
}


function doFormat(str) {
  str = plugins.stringBefore(str);
  // allows user to override the parser
  rocambole.parseFn = exports.parseFn;
  rocambole.parseContext = exports.parseContext;
  var ast = rocambole.parse(str, exports.parseOptions);
  transform(ast, transform.BYPASS_OPTIONS);
  str = ast.toString();
  str = plugins.stringAfter(str);
  return str;
}


// run cli tools in series passing the stdout of previous tool as stdin of next
// one
function pipe(commands, input) {
  if (!commands) {
    return input;
  }
  return commands.reduce(function(input, cmd) {
    return npmRun.sync(cmd, {
      input: input
    });
  }, input);
}

},{"./options":49,"./plugins":50,"./transform":53,"espree":58,"npm-run":69,"rocambole":96}],7:[function(require,module,exports){
"use strict";


// Hooks for each node.type that should be processed individually
// ---
// using an object to store each transform method to avoid a long switch
// statement, will be more organized in the long run and also allow
// monkey-patching/spies/mock/stub.


// we are not using something like https://npmjs.org/package/require-all
// because we want esformatter to be able to run in the browser in the future

exports.ArrayExpression = require('./hooks/ArrayExpression');
exports.ArrayPattern = require('./hooks/ArrayPattern');
exports.ArrowFunctionExpression = require('./hooks/ArrowFunctionExpression');
exports.AssignmentExpression = require('./hooks/AssignmentExpression');
exports.BinaryExpression = require('./hooks/BinaryExpression');
exports.CallExpression = exports.NewExpression = require('./hooks/CallExpression');
exports.CatchClause = require('./hooks/CatchClause');
exports.ClassDeclaration = require('./hooks/ClassDeclaration');
exports.ConditionalExpression = require('./hooks/ConditionalExpression');
exports.DoWhileStatement = require('./hooks/DoWhileStatement');
exports.ExportAllDeclaration = require('./hooks/ExportAllDeclaration');
exports.ExportDefaultDeclaration = require('./hooks/ExportDefaultDeclaration');
exports.ExportNamedDeclaration = require('./hooks/ExportNamedDeclaration');
exports.ExportSpecifier = require('./hooks/ExportSpecifier');
exports.ForInStatement = require('./hooks/ForInStatement');
exports.ForStatement = require('./hooks/ForStatement');
exports.FunctionDeclaration = require('./hooks/FunctionDeclaration');
exports.FunctionExpression = require('./hooks/FunctionExpression');
exports.IfStatement = require('./hooks/IfStatement');
exports.ImportDeclaration = require('./hooks/ImportDeclaration');
exports.ImportSpecifier = require('./hooks/ImportSpecifier');
exports.LogicalExpression = require('./hooks/LogicalExpression');
exports.MemberExpression = require('./hooks/MemberExpression');
exports.MethodDefinition = require('./hooks/MethodDefinition');
exports.ObjectExpression = require('./hooks/ObjectExpression');
exports.ObjectPattern = require('./hooks/ObjectPattern');
exports.ReturnStatement = require('./hooks/ReturnStatement');
exports.SequenceExpression = require('./hooks/SequenceExpression');
exports.SwitchStatement = require('./hooks/SwitchStatement');
exports.SwitchCase = require('./hooks/SwitchCase');
exports.ThrowStatement = require('./hooks/ThrowStatement');
exports.TryStatement = require('./hooks/TryStatement');
exports.UnaryExpression = require('./hooks/UnaryExpression');
exports.UpdateExpression = require('./hooks/UpdateExpression');
exports.VariableDeclaration = require('./hooks/VariableDeclaration');
exports.WhileStatement = require('./hooks/WhileStatement');




},{"./hooks/ArrayExpression":8,"./hooks/ArrayPattern":9,"./hooks/ArrowFunctionExpression":10,"./hooks/AssignmentExpression":11,"./hooks/BinaryExpression":12,"./hooks/CallExpression":13,"./hooks/CatchClause":14,"./hooks/ClassDeclaration":15,"./hooks/ConditionalExpression":16,"./hooks/DoWhileStatement":17,"./hooks/ExportAllDeclaration":18,"./hooks/ExportDefaultDeclaration":19,"./hooks/ExportNamedDeclaration":20,"./hooks/ExportSpecifier":21,"./hooks/ForInStatement":22,"./hooks/ForStatement":23,"./hooks/FunctionDeclaration":24,"./hooks/FunctionExpression":25,"./hooks/IfStatement":26,"./hooks/ImportDeclaration":27,"./hooks/ImportSpecifier":28,"./hooks/LogicalExpression":29,"./hooks/MemberExpression":30,"./hooks/MethodDefinition":31,"./hooks/ObjectExpression":32,"./hooks/ObjectPattern":33,"./hooks/ReturnStatement":35,"./hooks/SequenceExpression":36,"./hooks/SwitchCase":37,"./hooks/SwitchStatement":38,"./hooks/ThrowStatement":39,"./hooks/TryStatement":40,"./hooks/UnaryExpression":41,"./hooks/UpdateExpression":42,"./hooks/VariableDeclaration":43,"./hooks/WhileStatement":44}],8:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function ArrayExpression(node) {
  if (node.elements.length) {
    _limit.around(node.startToken, 'ArrayExpressionOpening');
    _limit.around(node.endToken, 'ArrayExpressionClosing');

    node.elements.forEach(function(el) {
      // sparse arrays have `null` elements
      if (!el) return;

      var prev = _tk.findPrevNonEmpty(el.startToken);
      if (prev.value === ',') {
        _limit.around(prev, 'ArrayExpressionComma');
      }
    });
  } else {
    // empty array should be single line
    _limit.after(node.startToken, 0);
  }
};


exports.getIndentEdges = function(node) {
  var start;
  var prev = node.startToken;

  // this will grab the start of first element that is on a new line
  node.elements.some(function(el, i, els) {
    // sparse arrays have `null` elements! which is very weird
    if (i) {
      var prevEl = els[i - 1];
      prev = prevEl ? prevEl.endToken : _tk.findNextNonEmpty(prev);
    }
    var next = el ? el.startToken : _tk.findNextNonEmpty(prev);

    if (_tk.findInBetween(prev, next, _tk.isBr)) {
      start = prev;
      return true;
    }
  });

  var end = node.endToken.prev;

  // if it ends on same line as previous non-empty we need to change the indent
  // rule to make sure {}, [] and () are aligned
  var sibling = _tk.findPrevNonEmpty(node.endToken);
  if (!_tk.findInBetween(sibling, node.endToken, _tk.isBr)) {
    end = node.endToken;
  }

  return start ? {
    startToken: start,
    endToken: end
  } : false;
};


},{"../limit":47,"rocambole-token":85}],9:[function(require,module,exports){
'use strict';

var limit = require('../limit');
var tk = require('rocambole-token');

exports.format = function ArrayPattern(node) {
  limit.around(node.startToken, 'ArrayPatternOpening');
  limit.around(node.endToken, 'ArrayPatternClosing');

  node.elements.forEach(function(el) {
    var comma = tk.findNext(el.endToken, [',', ']']);
    if (comma.value === ',') {
      limit.around(comma, 'ArrayPatternComma');
    }
  });
};

},{"../limit":47,"rocambole-token":85}],10:[function(require,module,exports){
'use strict';

var tk = require('rocambole-token');
var limit = require('../limit');
var _params = require('./Params');

exports.format = function ArrowFunctionExpression(node) {
  var body = node.body;
  if (body.type === 'BlockStatement') {
    limit.around(body.startToken, 'ArrowFunctionExpressionOpeningBrace');
    limit.around(body.endToken, 'ArrowFunctionExpressionClosingBrace');
  }

  var arrow = tk.findPrev(body.startToken, '=>');
  limit.around(arrow, 'ArrowFunctionExpressionArrow');

  // make sure we handle `(x) => x` and `x => x`
  if (shouldHandleParams(node)) {
    _params.format(node);
  }
};

exports.getIndentEdges = function(node, opts) {
  var edges = [
    node.body
  ];
  if (shouldHandleParams(node)) {
    edges.push(_params.getIndentEdges(node, opts));
  }
  return edges;
};

function shouldHandleParams(node) {
  var arrow = tk.findPrev(node.body.startToken, '=>');
  // we don't check based on `node.params` because of `node.defaults`
  return tk.findPrevNonEmpty(arrow).value === ')';
}

},{"../limit":47,"./Params":34,"rocambole-token":85}],11:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var _br = require('rocambole-linebreak');


exports.format = function AssignmentExpression(node) {
  // can't use node.right.startToken since it might be surrounded by
  // a parenthesis (see #5)
  var operator = _tk.findNext(node.left.endToken, node.operator);
  _br.limit(operator, 'AssignmentOperator');
  _ws.limit(operator, 'AssignmentOperator');
};


exports.getIndentEdges = function(node, opts) {
  var operator = _tk.findNext(node.left.endToken, node.operator);
  if (_tk.findInBetween(operator, node.right.startToken, _tk.isBr) ||
    (opts['AssignmentExpression.' + node.right.type] &&
    _tk.findInBetween(operator, node.right.endToken, _tk.isBr))) {
    // we only indent if assignment is on next line
    return {
      startToken: operator,
      endToken: node.endToken.type !== 'Punctuator' ?
        node.endToken.next : node.endToken
    };
  }
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],12:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function BinaryExpression(node) {
  var operator = _tk.findNext(node.left.endToken, node.operator);
  _ws.limit(operator, 'BinaryExpressionOperator');
};

exports.getIndentEdges = function(node) {
  // we only add indent for the top most BinaryExpression (in case we have
  // multiple operations in a row)
  if (node.parent.type === 'BinaryExpression') {
    return;
  }

  return {
    startToken: node.startToken.next,
    endToken: node.endToken.next || node.endToken
  };
};

},{"rocambole-token":85,"rocambole-whitespace":94}],13:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _br = require('rocambole-linebreak');
var _ws = require('rocambole-whitespace');
var _limit = require('../limit');
var _parens = require('./expressionParentheses');


exports.format = function CallExpression(node) {
  var openingParentheses = _tk.findNext(node.callee.endToken, _tk.isCode);
  var closingParentheses = node.endToken;
  var hasParentheses = closingParentheses.value === ')';

  // NewExpression is almost the same as CallExpression, simpler to keep it here
  if (node.type === 'NewExpression') {
    _br.limitAfter(node.startToken, 0);
    _ws.limitAfter(node.startToken, 1);
  }

  if (hasParentheses) {
    _limit.around(openingParentheses, 'CallExpressionOpeningParentheses');
    _limit.around(closingParentheses, 'CallExpressionClosingParentheses');
  }

  var args = node['arguments'];

  if (args.length) {
    _limit.before(_tk.findNextNonEmpty(openingParentheses), 'ArgumentList');

    args.forEach(function(arg) {
      var next = _tk.findInBetween(arg.endToken, closingParentheses, ',');
      if (next && next.value === ',') {
        _limit.around(next, 'ArgumentComma');
      }
    });

    _limit.after(_tk.findPrevNonEmpty(closingParentheses), 'ArgumentList');

  } else if (hasParentheses) {
    _limit.after(openingParentheses, 0);
    _limit.before(closingParentheses, 0);
  }

  // iife
  if (node.callee.type !== 'FunctionExpression') {
    return;
  }

  var parens = _parens.getParentheses({
    type: 'Special',
    startToken: node.startToken,
    endToken: node.endToken
  });

  if (parens) {
    _limit.after(parens.opening, 'IIFEOpeningParentheses');
    _limit.before(parens.closing, 'IIFEClosingParentheses');
  }

};

exports.getIndentEdges = function(node, opts) {

  var openingParentheses = _tk.findNext(node.callee.endToken, _tk.isCode);
  if (openingParentheses.value !== '(') return;

  if (!node.arguments.length) {
    // it might contain comments inside even tho there are no args
    return {
      startToken: openingParentheses,
      endToken: _tk.findNext(openingParentheses, ')')
    };
  }

  var start;

  function hasBr(start, end) {
    return _tk.findInBetween(start, end, _tk.isBr);
  }

  node.arguments.some(function(arg, i, args) {
    var prev = i ? args[i - 1].endToken.next : openingParentheses;
    if (hasBr(prev, arg.startToken)) {
      start = prev;
      return true;
    }
  });

  if (!start) {
    // we handle BinaryExpressions here because multiple operations are grouped
    // inside the same root node, and we need to indent if it breaks lines
    node.arguments.some(function(arg) {
      if (opts['CallExpression.' + arg.type] &&
        hasBr(arg.startToken, arg.endToken)) {
        start = arg.startToken.next;
        return true;
      }
    });
  }

  return start ? {
    startToken: start,
    endToken: node.endToken
  } : false;

};

},{"../limit":47,"./expressionParentheses":45,"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],14:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function CatchClause(node) {
  _limit.around(node.startToken, 'CatchKeyword');

  _limit.before(node.param.startToken, 'CatchParameterList');
  _limit.after(node.param.endToken, 'CatchParameterList');

  _limit.around(node.body.startToken, 'CatchOpeningBrace');
  _limit.around(node.body.endToken, 'CatchClosingBrace');

  // only remove line breaks if there are no comments inside. Ref #169
  if (!node.body.body.length && !containsCommentsInside(node.body)) {
    _tk.removeEmptyInBetween(node.body.startToken, node.body.endToken);
  }
};


function containsCommentsInside(node) {
  return !!_tk.findInBetween(node.startToken, node.endToken, _tk.isComment);
}

exports.getIndentEdges = function(node) {
  return node.body;
};

},{"../limit":47,"rocambole-token":85}],15:[function(require,module,exports){
'use strict';

var tk = require('rocambole-token');
var ws = require('rocambole-whitespace');
var br = require('rocambole-linebreak');
var limit = require('../limit');

exports.format = function ClassDeclaration(node) {
  var opening = tk.findNext(node.startToken, '{');
  var closing = node.endToken;
  // yes, we remove all the line breaks and limit to a single whitespace in
  // between the words since line breaks here are stupid and would make things
  // more complex
  limitInBetweenKeywords(node.startToken, opening);
  limit.around(opening, 'ClassDeclarationOpeningBrace');
  limit.around(closing, 'ClassDeclarationClosingBrace');
};

function limitInBetweenKeywords(start, end) {
  var token = start;
  while (token && token !== end) {
    if (!tk.isEmpty(token)) {
      br.limitAfter(token, 0);
      ws.limitAfter(token, 1);
    }
    token = token.next;
  }
}

exports.getIndentEdges = function(node) {
  return node;
};

},{"../limit":47,"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],16:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function ConditionalExpression(node) {
  // we need to grab the actual punctuators since parenthesis aren't counted
  // as part of test/consequent/alternate
  var questionMark = _tk.findNext(node.test.endToken, '?');
  var colon = _tk.findNext(node.consequent.endToken, ':');

  _ws.limitBefore(questionMark, _ws.expectedAfter('ConditionalExpressionTest'));
  _ws.limitAfter(questionMark, _ws.expectedBefore('ConditionalExpressionConsequent'));
  _ws.limitBefore(colon, _ws.expectedAfter('ConditionalExpressionConsequent'));
  _ws.limitAfter(colon, _ws.expectedBefore('ConditionalExpressionAlternate'));
};


exports.getIndentEdges = function(node) {
  if (_tk.findInBetween(node.test.endToken, node.consequent.startToken, _tk.isBr)) {
    return {
      startToken: node.test.endToken.next,
      endToken: node.endToken.next
    };
  }
  if (_tk.findInBetween(node.consequent.endToken, node.alternate.startToken, _tk.isBr)) {
    return {
      startToken: node.consequent.endToken.next,
      endToken: node.endToken.next
    };
  }
};

},{"rocambole-token":85,"rocambole-whitespace":94}],17:[function(require,module,exports){
'use strict';

var _tk = require('rocambole-token');
var _limit = require('../limit');
var _ws = require('rocambole-whitespace');


exports.format = function DoWhileStatement(node) {
  if (node.body.type === 'BlockStatement') {
    _limit.around(node.body.startToken, 'DoWhileStatementOpeningBrace');
    _limit.around(node.body.endToken, 'DoWhileStatementClosingBrace');
  } else {
    _ws.limitAfter(node.startToken, 1);
  }
  var whileKeyword = _tk.findPrev(node.test.startToken, 'while');
  _ws.limit(whileKeyword, 1);
};


exports.getIndentEdges = function(node) {
  return [
    { // do
      startToken: node.startToken.next,
      endToken: node.body.endToken
    },
    { // while
      startToken: _tk.findNext(node.body.endToken, '('),
      endToken: _tk.findPrev(node.endToken, ')')
    }
  ];
};

},{"../limit":47,"rocambole-token":85,"rocambole-whitespace":94}],18:[function(require,module,exports){
'use strict';

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');

exports.format = function ExportAllDeclaration(node) {
  var star = _tk.findNext(node.startToken, '*');
  _br.limit(star, 0);
  _ws.limit(star, 1);

  var fromKeyword = _tk.findNext(node.startToken, 'from');
  _br.limit(fromKeyword, 0);
  _ws.limit(fromKeyword, 1);
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],19:[function(require,module,exports){
'use strict';

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');

exports.format = function ExportDefaultDeclaration(node) {
  var def = _tk.findNext(node.startToken, 'default');
  _br.limit(def, 0);
  _ws.limit(def, 1);
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],20:[function(require,module,exports){
'use strict';

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');

exports.format = function ExportNamedDeclaration(node) {
  _br.limitAfter(node.startToken, 0);
  _ws.limitAfter(node.startToken, 1);

  // node.specifiers is actually handled by the ExportSpecifier hook!

  if (!node.specifiers.length) return;

  var fromKeyword = _tk.findPrev(node.endToken, 'from');
  if (fromKeyword) {
    // safeguard against `export { foo, bar };` (no "from")
    _br.limit(fromKeyword, 0);
    _ws.limit(fromKeyword, 1);
  }
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],21:[function(require,module,exports){
'use strict';

module.exports = require('./ImportSpecifier');

},{"./ImportSpecifier":28}],22:[function(require,module,exports){
"use strict";

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function ForInStatement(node) {
  var expressionStart = _tk.findNext(node.startToken, '(');
  var expressionEnd = _tk.findPrev(node.body.startToken, ')');

  _br.limit(expressionStart, 'ForInStatementExpressionOpening');
  _ws.limit(expressionStart, 'ForInStatementExpressionOpening');

  _br.limit(expressionEnd, 'ForInStatementExpressionClosing');
  _ws.limit(expressionEnd, 'ForInStatementExpressionClosing');

  if (node.body.type === 'BlockStatement' && node.body.body.length) {
    var bodyStart = node.body.startToken;
    var bodyEnd = node.body.endToken;

    _br.limit(bodyStart, 'ForInStatementOpeningBrace');
    _ws.limit(bodyStart, 'ForInStatementOpeningBrace');

    _br.limit(bodyEnd, 'ForInStatementClosingBrace');
    _ws.limit(bodyEnd, 'ForInStatementClosingBrace');

    _ws.limitAfter(expressionEnd, 'ForInStatementExpression');
  }

  _ws.limitAfter(node.left.endToken, 1);
  _ws.limitBefore(node.right.startToken, 1);
};


exports.getIndentEdges = function(node) {
  var edges = [];

  edges.push({
    startToken: node.left.startToken,
    endToken: node.right.endToken
  });

  if (node.body.type === 'BlockStatement') {
    edges.push(node.body);
  } else {
    edges.push({
      startToken: _tk.findNext(node.right.endToken, ')').next,
      endToken: node.endToken
    });
  }

  return edges;
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],23:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var _limit = require('../limit');


exports.format = function ForStatement(node) {
  var semi_1 = _tk.findNext(node.startToken, ';');
  var semi_2 = _tk.findPrev(node.body.startToken, ';');
  _ws.limit(semi_1, 'ForStatementSemicolon');
  _ws.limit(semi_2, 'ForStatementSemicolon');

  var expressionStart = _tk.findNext(node.startToken, '(');
  var expressionEnd = _tk.findPrev(node.body.startToken, ')');
  _limit.around(expressionStart, 'ForStatementExpressionOpening');
  _limit.around(expressionEnd, 'ForStatementExpressionClosing');

  if (node.body.type === 'BlockStatement') {
    var bodyStart = node.body.startToken;
    var bodyEnd = node.body.endToken;
    _limit.around(bodyStart, 'ForStatementOpeningBrace');
    _limit.around(bodyEnd, 'ForStatementClosingBrace');
  }
};


exports.getIndentEdges = function(node) {
  var edges = [];

  var args = {
    startToken: _tk.findNext(node.startToken, '('),
    endToken: _tk.findPrev(node.body.startToken, ')')
  };
  edges.push(args);

  if (node.body.type === 'BlockStatement') {
    edges.push(node.body);
  } else {
    edges.push({
      startToken: args.endToken,
      endToken: node.endToken
    });
  }

  return edges;
};

},{"../limit":47,"rocambole-token":85,"rocambole-whitespace":94}],24:[function(require,module,exports){
"use strict";

var _limit = require('../limit');
var _params = require('./Params');


exports.format = function FunctionDeclaration(node) {
  if (node.id) {
    _limit.around(node.id.startToken, 'FunctionName');
  }
  _params.format(node);
  _limit.around(node.body.startToken, 'FunctionDeclarationOpeningBrace');
  _limit.around(node.body.endToken, 'FunctionDeclarationClosingBrace');
};


exports.getIndentEdges = function(node, opts) {
  return [
    _params.getIndentEdges(node, opts),
    node.body
  ];
};

},{"../limit":47,"./Params":34}],25:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var _params = require('./Params');
var _limit = require('../limit');


exports.format = function FunctionExpression(node) {
  _limit.around(node.body.startToken, 'FunctionExpressionOpeningBrace');
  _limit.around(node.endToken, 'FunctionExpressionClosingBrace');

  if (node.id) {
    _ws.limit(node.id.startToken, 'FunctionName');
  } else {
    _ws.limit(node.startToken, 'FunctionReservedWord');
  }

  if (_tk.isWs(node.endToken.next) &&
      _tk.isSemiColon(node.endToken.next.next)) {
    _tk.remove(node.endToken.next);
  }

  if (node.parent.type === 'CallExpression') {
    _ws.limitAfter(node.endToken, 0);
  }

  var bodyFirstNonEmpty = _tk.findNextNonEmpty(node.body.startToken);
  if (bodyFirstNonEmpty.value === '}') {
    // noop
    _limit.after(node.body.startToken, 0);
  }

  _params.format(node);
};


exports.getIndentEdges = function(node, opts) {
  var params = _params.getIndentEdges(node, opts);
  // TODO make this a plugin
  if (!opts.TopLevelFunctionBlock && isTopLevelFunctionBlock(node)) {
    return params;
  }
  return [
    params,
    {
      startToken: node.body.startToken,
      endToken: _tk.findPrevNonEmpty(node.body.endToken).next
    }
  ];
};


function isTopLevelFunctionBlock(node) {
  // exception for UMD blocks
  return !(node.params.length === 1 && node.params[0].name === "factory") &&
    // regular IFEE
    (isOfType(node.parent, 'CallExpression') ||
      // module.exports assignment
      isOfType(node.parent, 'AssignmentExpression')) &&
    !isOfType(node.parent.callee, 'MemberExpression') &&
    isOfType(node.parent.parent, 'ExpressionStatement') &&
    isOfType(node.parent.parent.parent, 'Program');
}


// TODO: extract into rocambole-node
function isOfType(node, type) {
  return node && node.type === type;
}

},{"../limit":47,"./Params":34,"rocambole-token":85,"rocambole-whitespace":94}],26:[function(require,module,exports){
"use strict";

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var _limit = require('../limit');


exports.format = function IfStatement(node) {

  var startBody = node.consequent.startToken;
  var endBody = node.consequent.endToken;

  var conditionalStart = _tk.findPrev(node.test.startToken, '(');
  var conditionalEnd = _tk.findNext(node.test.endToken, ')');

  _ws.limit(conditionalStart, 'IfStatementConditionalOpening');
  _ws.limit(conditionalEnd, 'IfStatementConditionalClosing');

  var alt = node.alternate;
  if (alt) {
    var elseKeyword = _tk.findPrev(alt.startToken, 'else');

    if (alt.type === 'IfStatement') {
      // ElseIfStatement
      _br.limitBefore(alt.startToken, 0);
      _ws.limitBefore(alt.startToken, 1);

      if (alt.consequent.type === 'BlockStatement') {
        _br.limitBefore(alt.consequent.startToken, 'ElseIfStatementOpeningBrace');
        _br.limitBefore(alt.consequent.endToken, 'ElseIfStatementClosingBrace');
      }

      _br.limitBefore(elseKeyword, 'ElseIfStatement');
      if (! alt.alternate) {
        // we only limit the line breaks after the ElseIfStatement if it is not
        // followed by an ElseStatement, otherwise it would add line breaks
        // that it shouldn't
        _br.limitAfter(alt.consequent.endToken, 'ElseIfStatement');
      }

    } else if (alt.type === 'BlockStatement') {
      // ElseStatement

      _limit.around(alt.startToken, 'ElseStatementOpeningBrace');

      _br.limitBefore(elseKeyword, 'ElseStatement');
      _br.limitAfter(alt.endToken, 'ElseStatement');

      _ws.limitBefore(elseKeyword, 1);

      _limit.around(alt.endToken, 'ElseStatementClosingBrace');
    } else {
      // ElseStatement without curly braces
      _ws.limitAfter(elseKeyword, 1);
    }
  }

  // only handle braces if block statement
  if (node.consequent.type === 'BlockStatement') {
    _limit.around(startBody, 'IfStatementOpeningBrace');
    if (!alt) {
      _br.limit(endBody, 'IfStatementClosingBrace');
    } else {
      _br.limitBefore(endBody, 'IfStatementClosingBrace');
    }
    _ws.limit(endBody, 'IfStatementClosingBrace');
  }

};


exports.getIndentEdges = function(node, opts) {
  var edges = [];

  var test = node.test;
  var consequent = node.consequent;
  var alt = node.alternate;

  // test (IfStatementConditional)
  edges.push({
    level: opts.IfStatementConditional,
    startToken: _tk.findNext(node.startToken, '('),
    endToken: _tk.findPrev(consequent.startToken, ')'),
  });

  function isExecutable(token) {
    return _tk.isNotEmpty(token) && !_tk.isComment(token);
  }

  // consequent (body)
  edges.push({
    startToken: (
      consequent.type === 'BlockStatement' ?
      consequent.startToken :
      test.endToken.next
    ),
    // we have some special rules for comments just before the `else` statement
    // because of jQuery style guide. maybe in the future we will add
    // a setting to toggle this behavior (if someone asks for it)
    endToken: (
      alt && _tk.isComment(_tk.findPrevNonEmpty(consequent.endToken)) ?
      _tk.findPrev(consequent.endToken, isExecutable).next :
      consequent.endToken
    )
  });

  // alt (else)
  if (alt && alt.type !== 'IfStatement') {
    // it the alternate is IfStatement it will already take care of indentation
    edges.push({
      startToken: (
        alt.type === 'BlockStatement' ?
        alt.startToken :
        _tk.findPrevNonEmpty(alt.startToken).next
      ),
      endToken: alt.endToken
    });
  }

  return edges;
};

},{"../limit":47,"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],27:[function(require,module,exports){
'use strict';

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');

exports.format = function ImportDeclaration(node) {
  _br.limitAfter(node.startToken, 0);
  _ws.limitAfter(node.startToken, 1);

  // node.specifiers is actually handled by the ImportSpecifier hook!

  if (!node.specifiers.length) return;

  var fromKeyword = _tk.findPrev(node.endToken, 'from');
  _br.limit(fromKeyword, 0);
  _ws.limit(fromKeyword, 1);
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],28:[function(require,module,exports){
'use strict';

// this logic is shared with ExportSpecifier

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');

exports.format = function(node) {
  var braceStart = _tk.findPrev(node.startToken, _tk.isCode);
  var braceEnd = _tk.findNext(node.endToken, _tk.isCode);

  // handle `import foo, { lorem, ipsum } from 'lib';`
  if (braceStart.value === '{' || braceStart.value === ',') {
    _br.limit(braceStart, 0);
    _ws.limitBefore(braceStart, braceStart.value === '{' ? 1 : 0);
    _ws.limitAfter(braceStart, 1);
  }

  if (braceEnd.value === '}' || braceEnd.value === ',') {
    _br.limit(braceEnd, 0);
    var next = _tk.findNextNonEmpty(braceEnd);
    _ws.limitAfter(braceEnd, next.value === ';' ? 0 : 1);
    _ws.limitBefore(braceEnd, braceEnd.value === '}' ? 1 : 0);
  }

  _br.limit(node.startToken, 0);
  _br.limit(node.endToken, 0);

  if (node.startToken !== node.endToken) {
    // handle spaces around "as"
    // eg: `import { named1 as myNamed1 } from 'lib'`
    // eg: `import * as myLib from 'lib'`
    _ws.limitAfter(node.startToken, 1);
    _ws.limitBefore(node.endToken, 1);
  }
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],29:[function(require,module,exports){
"use strict";

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function LogicalExpression(node) {
  var operator = _tk.findNext(node.left.endToken, node.operator);
  _ws.limit(operator, 'LogicalExpressionOperator');
  // revert line breaks since parenthesis might not be part of
  // node.startToken and node.endToken
  if (node.parent.type === 'ExpressionStatement') {
    var prev = _tk.findPrevNonEmpty(node.left.startToken);
    if (prev && prev.value === '(') {
      _br.limit(prev, 'ExpressionOpeningParentheses');
      _ws.limit(prev, 'ExpressionOpeningParentheses');
      node.startToken = prev;
    }
    var next = _tk.findNextNonEmpty(node.right.endToken);
    if (next && next.value === ')') {
      _br.limit(next, 'ExpressionClosingParentheses');
      _ws.limit(next, 'ExpressionClosingParentheses');
      node.endToken = next;
    }
  }
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],30:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function MemberExpression(node) {
  var opening = _tk.findPrevNonEmpty(node.property.startToken),
    closing = _tk.findNextNonEmpty(node.property.endToken);
  if (opening && closing && opening.value === '[' && closing.value === ']') {
    _ws.limitAfter(opening, "MemberExpressionOpening");
    _ws.limitBefore(closing, "MemberExpressionClosing");
  }
};


exports.getIndentEdges = function(node) {
  var edge = {};
  edge.startToken = node.object.endToken;

  if (node.object.type !== 'CallExpression') {
    edge.startToken = edge.startToken.next;
  }

  edge.endToken = node.endToken;
  if (node.parent.type === 'CallExpression' &&
    node.parent.callee.type === 'MemberExpression') {
    edge.endToken = node.parent.endToken;
  }

  // only indent if on a different line
  if (!_tk.findInBetween(edge.startToken, node.property.startToken, _tk.isBr)) {
    return false;
  }

  return edge;
};


},{"rocambole-token":85,"rocambole-whitespace":94}],31:[function(require,module,exports){
'use strict';

var ws = require('rocambole-whitespace');
var br = require('rocambole-linebreak');

exports.format = function MethodDefinition(node) {
  br.limitAfter(node.startToken, 0);
  // limit to one space after get/set/static
  if (node.startToken !== node.key) {
    ws.limitAfter(node.startToken, 1);
  }
  ws.limitAfter(node.key.endToken, 0);
};

},{"rocambole-linebreak":83,"rocambole-whitespace":94}],32:[function(require,module,exports){
"use strict";

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var _limit = require('../limit');


exports.format = function ObjectExpression(node) {
  if (!node.properties.length) return;

  // TODO: improve this, there are probably more edge cases
  var shouldBeSingleLine = node.parent.type === 'ForInStatement';

  if (!shouldBeSingleLine) {
    _limit.around(node.startToken, 'ObjectExpressionOpeningBrace');
  } else {
    // XXX: we still have this rule that looks weird, maybe change it in the
    // future since it is not flexible (edge-case tho)
    _tk.removeEmptyInBetween(node.startToken, node.endToken);
  }

  node.properties.forEach(function(prop) {
    var valueStart = getValueStart(prop);
    var valueEnd = getValueEnd(prop);
    var keyStart = getKeyStart(prop);
    var keyEnd = getKeyEnd(prop);

    // convert comma-first to comma-last
    var comma = _tk.findNext(valueEnd, [',', '}']);
    if (_tk.isComma(comma)) {
      _tk.removeInBetween(valueEnd, comma, _tk.isBr);
      _tk.remove(comma);
      _tk.after(valueEnd, comma);
    }

    if (!shouldBeSingleLine) {
      _br.limitBefore(keyStart, 'PropertyName');
      _br.limitAfter(keyEnd, 'PropertyName');
      if (valueStart) {
        _br.limitBefore(valueStart, 'PropertyValue');
        _br.limitAfter(valueEnd, 'PropertyValue');
      }
    } else if (keyStart.prev.value !== '{') {
      _ws.limitBefore(keyStart, 'Property');
    }

    if (prop.kind === 'get' || prop.kind === 'set') {
      _ws.limitBefore(keyStart, 1);
      _ws.limitAfter(keyEnd, 0);
      return;
    }

    _ws.limitBefore(keyStart, 'PropertyName');
    _ws.limitAfter(keyEnd, 'PropertyName');
    if (valueStart) {
      _ws.limitBefore(valueStart, 'PropertyValue');
      _ws.limitAfter(valueEnd, 'PropertyValue');
    }
  });

  if (!shouldBeSingleLine) {
    _limit.around(node.endToken, 'ObjectExpressionClosingBrace');
  }
};


function getKeyStart(prop) {
  var start = prop.key.startToken;
  start = _tk.findPrev(start, ['{', ',']);
  return _tk.findNext(start, _tk.isCode);
}


function getKeyEnd(prop) {
  var end = prop.key.endToken;
  end = _tk.findNext(end, [':', '(', ',', '}']);
  return _tk.findPrev(end, _tk.isCode);
}


function getValueStart(prop) {
  if (prop.key.startToken === prop.value.startToken) {
    return null;
  }
  var start = prop.value.startToken;
  return (prop.kind === 'get' || prop.kind === 'set') ?
    start :
    // we need to grab first/last "executable" token to avoid issues (see #191)
    _tk.findNext(_tk.findPrev(start, ':'), _tk.isCode);
}


function getValueEnd(prop) {
  if (prop.key.startToken === prop.value.startToken) {
    return null;
  }
  // we need to grab next "," or "}" because value might be surrounded by
  // parenthesis which would break the regular logic
  var end = _tk.findNext(prop.value.endToken, [',', '}']);
  return  _tk.findPrev(end, _tk.isCode);
}


exports.getIndentEdges = function(node, opts) {
  var edges = [{
    startToken: node.startToken,
    endToken: _tk.findInBetweenFromEnd(node.startToken, node.endToken, _tk.isBr)
  }];

  node.properties.forEach(function(property) {
    if (!opts['ObjectExpression.' + property.value.type]) return;
    edges.push({
      startToken: getValueStart(property),
      endToken: getValueEnd(property)
    });
  });

  return edges;
};

},{"../limit":47,"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],33:[function(require,module,exports){
'use strict';

var limit = require('../limit');
var tk = require('rocambole-token');

exports.format = function ObjectPattern(node) {
  limit.around(node.startToken, 'ObjectPatternOpeningBrace');
  limit.around(node.endToken, 'ObjectPatternClosingBrace');

  node.properties.forEach(function(prop) {
    var comma = tk.findNext(prop.endToken, [',', '}']);
    if (comma.value === ',') {
      limit.around(comma, 'ObjectPatternComma');
    }
  });
};

},{"../limit":47,"rocambole-token":85}],34:[function(require,module,exports){
"use strict";

// Important: Params is a "virtual" node type, not part of the AST spec.
// this hook is actually called by FunctionDeclaration and FunctionExpression
// hooks. It's mainly a way to share the common logic between both hooks.

var _ws = require('rocambole-whitespace');
var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function Params(node) {
  var params = node.params;
  var defaults = node.defaults;
  var opening = node.startToken.value === '(' ?
    node.startToken :
    _tk.findNext(node.startToken, '(');
  var closing = _tk.findPrev(node.body.startToken, ')');

  if (params.length) {
    _ws.limitBefore(_tk.findNextNonEmpty(opening), 'ParameterList');
    params.forEach(function(param, i) {
      // if only one param or last one there are no commas to look for
      if (i === params.length - 1) return;

      _ws.limit(_tk.findNext(param.startToken, ','), 'ParameterComma');
    });
    defaults.forEach(function(init) {
      if (init) {
        _limit.around(_tk.findPrev(init.startToken, '='), 'ParameterDefault');
      }
    });
    _ws.limitAfter(_tk.findPrevNonEmpty(closing), 'ParameterList');
  } else {
    _limit.after(opening, 0);
  }
};

exports.getIndentEdges = function(node, opts) {
  var params = node.params;
  if (params.length && opts.ParameterList) {
    // get/set on ObjectEpression affect drastically the FunctionExpression
    // structure so we need to handle it differently
    var start = node.parent.type === 'Property' ?
      node.parent.startToken :
      node.startToken;
    return {
      // we check if start is equal to "(" because of arrow functions
      startToken: start.value === '(' ? start : _tk.findNext(start, '('),
      endToken: _tk.findPrev(node.body.startToken, ')'),
      level: opts.ParameterList
    };
  }
  return null;
};

},{"../limit":47,"rocambole-token":85,"rocambole-whitespace":94}],35:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');

var expressionParentheses = require('./expressionParentheses');


exports.format = function ReturnStatement(node) {
  // need to make sure we only remove line breaks inside the node itself
  // because of ASI (see #29)
  var nonEmpty = _tk.findInBetween(node.startToken.next, node.endToken, _tk.isNotEmpty);
  // XXX: we want to remove line breaks and white spaces inside the node, not
  // using _br.limitAfter to avoid changing the program behavior (ASI)
  if (nonEmpty) _tk.removeEmptyInBetween(node.startToken, nonEmpty);

  _ws.limitAfter(node.startToken, 1);
  if (_tk.isSemiColon(node.endToken)) {
    // XXX: we want semicolon to be on same line and no whitespaces for now.
    _tk.removeEmptyInBetween(_tk.findPrevNonEmpty(node.endToken), node.endToken);
  }

  if (node.argument) {
    expressionParentheses.addSpaceInside(node.argument);
  }
};


var _specialArguments = {
  'BinaryExpression': true
};


exports.getIndentEdges = function(node, opts) {
  // we bypass indentation if argument already adds indentation
  if (!node.argument ||
    (opts[node.argument.type] && !_specialArguments[node.argument.type])) {
    return false;
  }

  var parentheses = expressionParentheses.getParentheses(node.argument);
  return parentheses ?
    {
      startToken: parentheses.opening,
      endToken: parentheses.closing
    } :
    {
      startToken: node.startToken.next,
      endToken: node.endToken
    };
};

},{"./expressionParentheses":45,"rocambole-token":85,"rocambole-whitespace":94}],36:[function(require,module,exports){
"use strict";

var _ws = require('rocambole-whitespace');


exports.format = function SequenceExpression(node) {
  node.expressions.forEach(function(expr, i) {
    if (i) {
      var operator = expr.startToken.prev;
      while (operator.value !== ',') {
        operator = operator.prev;
      }
      _ws.limit(operator, 'CommaOperator');
    }
  });
};

},{"rocambole-whitespace":94}],37:[function(require,module,exports){
"use strict";

var _ws = require('rocambole-whitespace');
var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var limit = require('../limit');


exports.format = function SwitchCase(node) {
  if (node.test) {
    // we want case to always be on the same line!
    _br.limitBefore(node.test.startToken, 0);
    _ws.limitBefore(node.test.startToken, 1);
  }
  var endToken = node.endToken;
  if (endToken.value !== ':') {
    // endToken might be ":" or "break" or ";"
    var breakKeyword = _tk.findPrev(endToken.next, 'break');
    if (breakKeyword) {
      limit.before(breakKeyword, 'BreakKeyword');
      limit.after(endToken, 'BreakKeyword');
    }
  }
};


exports.getIndentEdges = function(node) {
  return {
    startToken: node.startToken,
    // we need to get the next token because `default` might end with a `}`
    // (ie. IfStatement) we also need to search for next `case` or `}` or
    // `break` or `default` to make sure comments are included inside the range
    endToken: _tk.findNext(node.endToken, ['}', 'case', 'break', 'default']).prev
  };
};

},{"../limit":47,"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],38:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function SwitchStatement(node) {
  var opening = _tk.findPrev(node.discriminant.startToken, '(');
  var closing = _tk.findNext(node.discriminant.endToken, ')');
  var openingBrace = _tk.findNext(closing, '{');
  var closingBrace = node.endToken;

  _limit.around(openingBrace, 'SwitchOpeningBrace');
  _limit.around(closingBrace, 'SwitchClosingBrace');
  _limit.around(opening, 'SwitchDiscriminantOpening');
  _limit.around(closing, 'SwitchDiscriminantClosing');

  // cases are handled by SwitchCase hook!
};


exports.getIndentEdges = function(node) {
  return {
    startToken: _tk.findNext(node.discriminant.endToken, '{'),
    endToken: node.endToken
  };
};

},{"../limit":47,"rocambole-token":85}],39:[function(require,module,exports){
"use strict";

var _ws = require('rocambole-whitespace');


exports.format = function ThrowStatement(node) {
  _ws.limit(node.startToken, 'ThrowKeyword');
};

},{"rocambole-whitespace":94}],40:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function TryStatement(node) {
  var finalizer = node.finalizer;
  if (finalizer) {
    var finallyKeyword = _tk.findPrev(finalizer.startToken, 'finally');
    _limit.around(finallyKeyword, 'FinallyKeyword');
    _limit.around(finalizer.startToken, 'FinallyOpeningBrace');
    _limit.around(finalizer.endToken, 'FinallyClosingBrace');

    if (!finalizer.body.length && !containsCommentsInside(finalizer)) {
      // XXX: empty body, so we should remove all white spaces
      _tk.removeEmptyInBetween(finalizer.startToken, finalizer.endToken);
    }
  }

  // CatchClause is handled by its own hook

  _limit.around(node.startToken, 'TryKeyword');
  _limit.around(node.block.startToken, 'TryOpeningBrace');
  _limit.around(node.block.endToken, 'TryClosingBrace');
};


function containsCommentsInside(node) {
  return !!_tk.findInBetween(node.startToken, node.endToken, _tk.isComment);
}


exports.getIndentEdges = function(node) {
  var edges = [node.block];

  if (node.finalizer) {
    edges.push(node.finalizer);
  }

  // CatchClause is handled by it's own node (automatically)

  return edges;
};

},{"../limit":47,"rocambole-token":85}],41:[function(require,module,exports){
"use strict";

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function UnaryExpression(node) {
  if (node.operator === 'delete') {
    _ws.limitAfter(node.startToken, 1);
    _br.limitBefore(node.startToken, 'DeleteOperator');
    var endToken = node.endToken;
    if (_tk.isSemiColon(endToken.next)) {
      endToken = endToken.next;
    }
    _br.limitAfter(endToken, 'DeleteOperator');
  } else if (node.operator === 'typeof' || node.operator === 'void') {
    _ws.limitAfter(node.startToken, 1);
  } else {
    _ws.limit(node.startToken, 'UnaryExpressionOperator');
  }
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],42:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');

exports.format = function UpdateExpression(node) {
  // XXX: should never have spaces or line breaks before/after "++" and "--"!
  _tk.removeEmptyInBetween(node.startToken, node.endToken);
};

},{"rocambole-token":85}],43:[function(require,module,exports){
"use strict";

var _br = require('rocambole-linebreak');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');


exports.format = function VariableDeclaration(node) {
  var insideFor = node.parent.type === 'ForStatement';

  node.declarations.forEach(function(declarator, i) {
    var idStartToken = declarator.id.startToken;

    // need to swap comma-first line break
    var prevNonEmpty = _tk.findPrevNonEmpty(idStartToken);
    if (i && prevNonEmpty.value === ',') {
      if (_tk.isBr(prevNonEmpty.prev) || _tk.isBr(prevNonEmpty.prev.prev)) {
        var beforeComma = _tk.findPrev(prevNonEmpty, function(t) {
          return !_tk.isEmpty(t) && !_tk.isComment(t);
        });
        _ws.limit(prevNonEmpty, 0);
        _tk.remove(prevNonEmpty);
        _tk.after(beforeComma, prevNonEmpty);
      }
    }

    if (!i && !_tk.isComment(_tk.findPrevNonEmpty(idStartToken))) {
      // XXX: we don't allow line breaks or multiple spaces after "var"
      // keyword for now (might change in the future)
      _tk.removeEmptyAdjacentBefore(idStartToken);
    } else if (!insideFor && declarator.init) {
      _br.limit(idStartToken, 'VariableName');
    }
    _ws.limitBefore(idStartToken, 'VariableName');

    if (declarator.init) {
      _ws.limitAfter(declarator.id.endToken, 'VariableName');
      var equalSign = _tk.findNext(declarator.id.endToken, '=');
      var valueStart = _tk.findNextNonEmpty(equalSign);
      _br.limitBefore(valueStart, 'VariableValue');
      _ws.limitBefore(valueStart, 'VariableValue');
      _br.limitAfter(declarator.endToken, 'VariableValue');
      _ws.limitAfter(declarator.endToken, 'VariableValue');
    }
  });

  // always add a space after the "var" keyword
  _ws.limitAfter(node.startToken, 1);
};


exports.getIndentEdges = function(node, opts) {
  var edges = [];

  if (opts.MultipleVariableDeclaration && node.declarations.length > 1) {
    edges.push(node);
  }

  node.declarations.forEach(function(declaration) {
    var init = declaration.init;
    if (init && opts['VariableDeclaration.' + init.type]) {
      var end = init.endToken.value === ')' ?
        _tk.findPrevNonEmpty(init.endToken) :
        init.endToken.next;
      edges.push({
        startToken: init.startToken,
        endToken: end
      });
    }
  });

  return edges;
};

},{"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],44:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function WhileStatement(node) {
  var conditionalStart = _tk.findNext(node.startToken, '(');
  var conditionalEnd = _tk.findPrev(node.body.startToken, ')');

  _limit.around(conditionalStart, 'WhileStatementConditionalOpening');

  if (node.body.type === 'BlockStatement') {
    var bodyStart = node.body.startToken;
    var bodyEnd = node.body.endToken;
    _limit.around(bodyStart, 'WhileStatementOpeningBrace');
    _limit.around(bodyEnd, 'WhileStatementClosingBrace');
    _limit.around(conditionalEnd, 'WhileStatementConditionalClosing');
  } else {
    var next = _tk.findNextNonEmpty(conditionalEnd);
    _limit.before(conditionalEnd, 'WhileStatementConditionalClosing');
    if (_tk.isSemiColon(next)) {
      _limit.after(conditionalEnd, 0);
    } else {
      _limit.after(conditionalEnd, 'WhileStatementConditionalClosing');
    }
  }
};


exports.getIndentEdges = function(node) {
  var edges = [
    {
      startToken: _tk.findNext(node.startToken, '('),
      endToken: _tk.findPrev(node.body.startToken, ')')
    }
  ];

  if (node.body.type !== 'EmptyStatement') {
    edges.push(node.body);
  }

  return edges;
};

},{"../limit":47,"rocambole-token":85}],45:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var debug = require('debug')('esformatter:parentheses');


exports.addSpaceInside = addSpaceInsideExpressionParentheses;
function addSpaceInsideExpressionParentheses(node) {
  var parentheses = getParentheses(node);
  if (parentheses) {
    _ws.limitAfter(parentheses.opening, 'ExpressionOpeningParentheses');
    _ws.limitBefore(parentheses.closing, 'ExpressionClosingParentheses');
  }
}


exports.getParentheses = getParentheses;
function getParentheses(node) {
  if (!isValidExpression(node)) {
    debug('not valid expression: %s', node.type);
    return;
  }

  var opening = node.startToken;
  if (/^(?:Binary|Logical)Expression$/.test(node.type) || opening.value !== '(') {
    opening = _tk.findPrevNonEmpty(opening);
  }

  if (!opening || opening.value !== '(') {
    // "safe" to assume it is not inside parentheses
    debug(
      'opening is not a parentheses; type: %s, opening: "%s"',
      node.type,
      opening && opening.value
    );
    return;
  }

  var token = opening;
  var count = 0;
  var closing;

  while(token) {
    if (token.value === '(') {
      count += 1;
    } else if (token.value === ')') {
      count -= 1;
    }
    if (count === 0) {
      closing = token;
      break;
    }
    token = token.next;
  }

  if (!closing) {
    debug('not inside parentheses', count);
    return;
  }

  debug(
    'found parentheses; type: %s, opening: "%s", closing: "%s"',
    node.type,
    opening && opening.value,
    closing && closing.value
  );

  return {
    opening: opening,
    closing: closing
  };
}

// Literal when inside BinaryExpression might be surrounded by parenthesis
// CallExpression and ArrayExpression don't need spaces
var needExpressionParenthesesSpaces = {
  Literal: true,
  CallExpression: false,
  FunctionExpression: false,
  ArrayExpression: false,
  ObjectExpression: false,
  // Special is used when we need to override default behavior
  Special: true
};


function isValidExpression(node) {
  var needSpaces = needExpressionParenthesesSpaces[node.type];

  if (needSpaces) {
    return true;
  }

  if (needSpaces == null && node.type.indexOf('Expression') !== -1) {
    if (node.type === 'ExpressionStatement' &&
      (node.expression.callee && node.expression.callee.type === 'FunctionExpression')) {
      // bypass IIFE
      return false;
    }
    return true;
  }

  return false;
}


},{"debug":54,"rocambole-token":85,"rocambole-whitespace":94}],46:[function(require,module,exports){
"use strict";

var rocambole = require('rocambole');
var indent = require('rocambole-indent');
var debug = require('debug')('esformatter:indent');
var hooks = require('./hooks');

// ---


var _opts;

// this hash table is used to map special node types (used only for
// indentation) into the real hooks
var _specialTypes = {
  'VariableDeclaration': 'MultipleVariableDeclaration'
};


// ---


exports.setOptions = setOptions;
function setOptions(opts){
  _opts = opts;
  indent.setOptions(opts);
}


// transform AST in place
exports.transform = transform;
function transform(ast) {
  rocambole.walk(ast, transformNode);
  indent.sanitize(ast);
  // on v0.6.0 we named the property starting with uppercase "A" by mistake, so
  // now we need to support both styles to keep consistency :(
  if (_opts.alignComments) {
    indent.alignComments(ast);
  }
  return ast;
}


function transformNode(node) {
  var indentLevel = getIndentLevel(node);
  if (indentLevel) {
    var type = node.type;
    var edges;

    if (type in hooks && hooks[type].getIndentEdges) {
      edges = hooks[type].getIndentEdges(node, _opts);
      // for some nodes we might decide that they should not be indented
      // (complex rules based on context)
      if (!edges) {
        debug('[transformNode]: hook returned no edges');
        return;
      }
    } else {
      edges = node;
    }

    debug(
      '[transformNode] type: %s, edges: "%s", "%s"',
      node.type,
      edges && edges.startToken && edges.startToken.value,
      edges && edges.endToken && edges.endToken.value
    );

    // some complex nodes like IfStatement contains multiple sub-parts that
    // should be indented, so we allow an Array of edges as well
    if (Array.isArray(edges)) {
      edges.forEach(function(edge) {
        if (!edge) {
          // to simplify the logic we allow empty/falsy values on the edges
          // array, that way we can use same logic for single/multiple edges
          return;
        }
        indentEdge(edge, indentLevel);
      });
    } else {
      indentEdge(edges, indentLevel);
    }
  }
}


function indentEdge(edge, level) {
  indent.inBetween(edge.startToken, edge.endToken, edge.level || level);
}


function getIndentLevel(node) {
  var value = _opts[node.type];
  debug('[getIndentLevel] type: %s, value: %s', node.type, value);
  if (node.type in _specialTypes) {
    value = value || _opts[_specialTypes[node.type]];
    debug('[specialNodeType] indent: %s', value);
  }
  return value;
}


},{"./hooks":7,"debug":54,"rocambole":96,"rocambole-indent":78}],47:[function(require,module,exports){
'use strict';

// limit amount of consecutive white spaces and line breaks adjacent to a given
// token.

var _br = require('rocambole-linebreak');
var _ws = require('rocambole-whitespace');

exports.before = limitBefore;
function limitBefore(token, typeOrValue) {
  _br.limitBefore(token, typeOrValue);
  _ws.limitBefore(token, typeOrValue);
}


exports.after = limitAfter;
function limitAfter(token, typeOrValue) {
  _br.limitAfter(token, typeOrValue);
  _ws.limitAfter(token, typeOrValue);
}


exports.around = limitAround;
function limitAround(token, typeOrValue) {
  _br.limit(token, typeOrValue);
  _ws.limit(token, typeOrValue);
}

},{"rocambole-linebreak":83,"rocambole-whitespace":94}],48:[function(require,module,exports){
'use strict';

// this module is used for automatic line break around nodes.


var _tk = require('rocambole-token');
var _br = require('rocambole-linebreak');
var debugAround = require('debug')('esformatter:br:around');


// ---


module.exports = aroundNodeIfNeeded;
function aroundNodeIfNeeded(node) {
  var shouldLimit = shouldLimitLineBreakAroundNode(node);
  debugAround('[aroundNodeIfNeeded] type: %s, shouldLimit: %s, ', node.type, shouldLimit);
  if (!shouldLimit) return;

  var type = node.type;
  _br.limitBefore(node.startToken, type);

  if (_tk.isSemiColon(node.endToken)) {
    _br.limitAfter(node.endToken, type);
  }
}



// tokens that only break line for special reasons
var CONTEXTUAL_LINE_BREAK = {
  AssignmentExpression: 1,
  ConditionalExpression: 1,
  CallExpression: 1,
  ExpressionStatement: 1,
  SequenceExpression: 1,
  LogicalExpression: 1,
  VariableDeclaration: 1
};

// bypass automatic line break of direct child
var BYPASS_CHILD_LINE_BREAK = {
  CallExpression: 1,
  DoWhileStatement: 1,
  IfStatement: 1,
  WhileStatement: 1,
  ForStatement: 1,
  ForInStatement: 1,
  ReturnStatement: 1,
  ThrowStatement: 1
};

// add line break only if great parent is one of these
var CONTEXTUAL_LINE_BREAK_GREAT_PARENTS = {
  Program: 1,
  BlockStatement: 1,
  IfStatement: 1,
  FunctionExpression: 1
};

function shouldLimitLineBreakAroundNode(node) {

  if (node.parent) {
    // EmptyStatement shouldn't cause line breaks by default since user might
    // be using asi and it's common to add it to begin of line when needed
    if (node.parent.prev &&
      node.parent.prev.type === 'EmptyStatement') {
      return false;
    }
    // it is on root it should cause line breaks
    if (node.parent.type === 'Program') {
      return true;
    }
    // if inside "if" test we change the rules since you probaly don't
    // want to change the line break of the input ("test" can contain
    // AssignmentExpression, SequenceExpression, BinaryExpression, ...)
    if (isInsideIfTest(node)) {
      return false;
    }
  }

  if (!(node.type in CONTEXTUAL_LINE_BREAK)) {
    return true;
  }
  if (node.parent.type in BYPASS_CHILD_LINE_BREAK) {
    return false;
  }

  // iife
  if (node.type === 'CallExpression' &&
    node.callee.type === 'FunctionExpression') {
    return false;
  }

  var gp = node.parent.parent;
  if (gp && gp.type in CONTEXTUAL_LINE_BREAK_GREAT_PARENTS) {
    return true;
  }

  return false;
}


function isInsideIfTest(node) {
  if (node.parent && node.parent.type === 'IfStatement') {
    return node === node.parent.test;
  }
  // we don't check further than great parent since it's "expensive" and we
  // consider it as an edge case (you probably should not have too much logic
  // inside the "test")
  var greatParent = node.parent && node.parent.parent;
  return greatParent && greatParent.type === 'IfStatement' &&
    node.parent === greatParent.test;
}


},{"debug":54,"rocambole-linebreak":83,"rocambole-token":85}],49:[function(require,module,exports){
(function (process){
"use strict";

var stripJsonComments = require('strip-json-comments');
var fs = require('fs');
var path = require('path');

var _ws = require('rocambole-whitespace');
var _br = require('rocambole-linebreak');
var indent = require('./indent');
var plugins = require('./plugins');

var deepMixIn = require('mout/object/deepMixIn');
var merge = require('mout/object/merge');
var get = require('mout/object/get');
var isObject = require('mout/lang/isObject');
var userHome = require('user-home');


// ---

var _curOpts;

// ---

exports.presets = {
  'default': require('./preset/default.json'),
  'jquery' : require('./preset/jquery.json')
};


exports.set = function(opts) {
  var preset = opts && opts.preset ? opts.preset : 'default';
  // we need to pass all the user settings and default settings to the plugins
  // so they are able to toggle the behavior and make changes based on the
  // options
  _curOpts = mergeOptions(preset, opts);

  // FIXME: deprecate AlignComments on v1.0
  // on v0.6.0 we named the property starting with uppercase "A" by mistake, so
  // now we need to support both styles to keep consistency :(
  if (_curOpts.indent && 'AlignComments' in _curOpts.indent) {
    _curOpts.indent.alignComments = _curOpts.indent.AlignComments;
  }

  _ws.setOptions(_curOpts.whiteSpace);
  _br.setOptions(_curOpts.lineBreak);
  indent.setOptions(_curOpts.indent);
  plugins.setOptions(_curOpts);

  // user provided options should override default settings and also any
  // changes made by plugins
  if (opts) {
    _curOpts = deepMixIn(_curOpts, opts);
  }
};


function mergeOptions(preset, opts){
  if (!(preset in exports.presets)) {
    throw new Error('Invalid preset file "' + preset + '".');
  }
  var baseOpts = exports.presets[preset];
  // recursively merge options to allow a "prototype chain"
  if (baseOpts.preset) {
    baseOpts = mergeOptions(baseOpts.preset, baseOpts);
  }
  return merge({}, baseOpts, opts);
}


exports.get = function(prop) {
  return prop ? get(_curOpts, prop) : _curOpts;
};


exports.getRc = getRc;
function getRc(filePath, customOptions) {
  // if user sets the "preset" we don't load any other config file
  // we assume the "preset" overrides any user settings
  if (isTopLevel(customOptions)) {
    return customOptions;
  }

  if (isObject(filePath)) {
    customOptions = filePath;
    filePath = null;
  }
  // we search for config file starting from source directory or from cwd if
  // path is not provided
  var basedir = filePath ? path.dirname(filePath) : process.cwd();
  var cwd = process.cwd();
  var rc = findAndMergeConfigs(basedir);
  if (!rc && basedir !== cwd) {
    rc = findAndMergeConfigs(cwd);
  }
  return merge(rc || getGlobalConfig(), customOptions);
}


function findAndMergeConfigs(basedir) {
  if (!basedir || !basedir.length) return;

  var configFiles = ['.esformatter', 'package.json'];
  var config;

  configFiles.some(function(name) {
    var filePath = path.join(basedir, name);
    if (!fs.existsSync(filePath)) return;

    var cur = loadAndParseConfig(filePath);
    if (name === 'package.json') {
      cur = cur.esformatter;
    }

    if (!cur) return;

    // we merge configs on same folder as well just in case user have
    // ".esformatter" and "package.json" on same folder
    // notice that ".esformatter" file takes precedence and will override the
    // "package.json" settings.
    config = config ? merge(cur, config) : cur;

    // stop the loop
    if (isTopLevel(config)) return true;
  });

  if (isTopLevel(config)) {
    return config;
  }

  // we merge configs from parent folders so it's easier to add different rules
  // for each folder on a project and/or override just specific settings
  var parentDir = path.resolve(basedir, '..');
  // we need to check if parentDir is different from basedir to avoid conflicts
  // on windows (see #174)
  var parentConfig = parentDir && parentDir !== basedir ?
    findAndMergeConfigs(parentDir) :
    {};
  // notice that current folder config overrides the parent folder config
  return merge(parentConfig, config);
}


function isTopLevel(config) {
  // if config contains 'root:true' or inherit from another "preset" we
  // consider it as top-level and don't merge the settings with config files on
  // parent folders.
  return config && (config.root || config.preset);
}


function getGlobalConfig() {
  var file = path.join(userHome, '.esformatter');
  return fs.existsSync(file) ? loadAndParseConfig(file) : {};
}


exports.loadAndParseConfig = loadAndParseConfig;
function loadAndParseConfig(file) {
  try {
    return JSON.parse(stripJsonComments(fs.readFileSync(file).toString()));
  } catch (e) {
    // include file name and let user know error was caused by config file
    // parsing. this is redundant for ENOENT errors but very helpful for
    // JSON.parse
    throw new Error(
      "Can't parse configuration file '" + file + "'. Exception: " + e.message
    );
  }
}



}).call(this,require('_process'))
},{"./indent":46,"./plugins":50,"./preset/default.json":51,"./preset/jquery.json":52,"_process":4,"fs":undefined,"mout/lang/isObject":107,"mout/object/deepMixIn":113,"mout/object/get":116,"mout/object/merge":"mout/object/merge","path":3,"rocambole-linebreak":83,"rocambole-whitespace":94,"strip-json-comments":97,"user-home":98}],50:[function(require,module,exports){
"use strict";

var partial = require('mout/function/partial');
var remove = require('mout/array/remove');

var _plugins = [];


exports.register = register;
function register(plugin) {
  if (_plugins.indexOf(plugin) === -1) {
    _plugins.push(plugin);
  }
}


exports.unregister = partial(remove, _plugins);


exports.unregisterAll = unregisterAll;
function unregisterAll() {
  _plugins = [];
}


exports.setOptions = function(opts) {
  loadAndRegister(opts && opts.plugins);
  exec('setOptions', opts);
};


exports.loadAndRegister = loadAndRegister;
function loadAndRegister(ids) {
  ids = ids || [];
  ids.forEach(function(id) {
    var module;
    try {
      module = require(id);
    } catch (e) {
      throw new Error(
        'Error: Cannot find plugin \'' + id + '\'.' + ' Make sure ' +
        'you used the correct name on the config file or run `npm install ' +
        '--save-dev ' + id + '` to add it as a project dependency.'
      );
    }
    register(module);
  });
}


exportMethods([
  'tokenBefore',
  'tokenAfter',
  'nodeBefore',
  'nodeAfter',
  // "transform" is an alias to "transformAfter" but we do not recommend using
  // it going forward. it might be deprecated in the future.
  'transform',
  'transformAfter',
  'transformBefore'
], exec);

exportMethods([
  'stringBefore',
  'stringAfter'
], pipe);


function exportMethods(arr, fn) {
  arr.forEach(function(methodName) {
    exports[methodName] = partial(fn, methodName);
  });
}


function exec(methodName) {
  var args = Array.prototype.slice.call(arguments, 1);
  _plugins.forEach(function(plugin) {
    if (methodName in plugin) {
      plugin[methodName].apply(plugin, args);
    }
  });
}


function pipe(methodName, input) {
  return _plugins.reduce(function(output, plugin) {
    return methodName in plugin ? plugin[methodName](output) : output;
  }, input);
}

},{"mout/array/remove":101,"mout/function/partial":103}],51:[function(require,module,exports){
module.exports={
  "esformatter": {
    "allowShebang": true
  },

  "indent" : {
    "value": "  ",
    "alignComments": true,

    "ArrayExpression": 1,
    "ArrayPattern": 1,
    "ArrowFunctionExpression": 1,
    "AssignmentExpression": 1,
    "AssignmentExpression.BinaryExpression": 1,
    "AssignmentExpression.LogicalExpression": 1,
    "AssignmentExpression.UnaryExpression": 1,
    "CallExpression": 1,
    "CallExpression.BinaryExpression": 1,
    "CallExpression.LogicalExpression": 1,
    "CallExpression.UnaryExpression": 1,
    "CatchClause": 1,
    "ConditionalExpression": 1,
    "CommentInsideEmptyBlock": 1,
    "ClassDeclaration": 1,
    "DoWhileStatement": 1,
    "ForInStatement": 1,
    "ForStatement": 1,
    "FunctionDeclaration": 1,
    "FunctionExpression": 1,
    "IfStatement": 1,
    "MemberExpression": 1,
    "MultipleVariableDeclaration": 1,
    "NewExpression": 1,
    "ObjectExpression": 1,
    "ObjectExpression.BinaryExpression": 1,
    "ObjectExpression.LogicalExpression": 1,
    "ObjectExpression.UnaryExpression": 1,
    "ObjectPattern": 1,
    "ParameterList": 1,
    "ReturnStatement": 1,
    "SwitchCase": 1,
    "SwitchStatement": 1,
    "TopLevelFunctionBlock": 1,
    "TryStatement": 1,
    "VariableDeclaration.BinaryExpression": 1,
    "VariableDeclaration.LogicalExpression": 1,
    "VariableDeclaration.UnaryExpression": 1,
    "WhileStatement": 1
  },


  "lineBreak" : {
    "value" : "\n",

    "before" : {
      "AssignmentExpression" : ">=1",
      "AssignmentOperator": 0,
      "ArrayPatternOpening": 0,
      "ArrayPatternClosing": 0,
      "ArrayPatternComma": 0,
      "ArrowFunctionExpressionArrow": 0,
      "ArrowFunctionExpressionOpeningBrace": 0,
      "ArrowFunctionExpressionClosingBrace": ">=1",
      "BlockStatement" : 0,
      "BreakKeyword": ">=1",
      "CallExpression" : -1,
      "CallExpressionOpeningParentheses" : 0,
      "CallExpressionClosingParentheses" : -1,
      "ClassDeclaration" : ">=1",
      "ClassDeclarationOpeningBrace" : 0,
      "ClassDeclarationClosingBrace" : ">=1",
      "ConditionalExpression" : ">=1",
      "CatchOpeningBrace" : 0,
      "CatchClosingBrace" : ">=1",
      "CatchKeyword": 0,
      "DeleteOperator" : ">=1",
      "DoWhileStatement" : ">=1",
      "DoWhileStatementOpeningBrace" : 0,
      "DoWhileStatementClosingBrace" : ">=1",
      "EndOfFile" : -1,
      "EmptyStatement" : -1,
      "FinallyKeyword" : -1,
      "FinallyOpeningBrace" : 0,
      "FinallyClosingBrace" : ">=1",
      "ForInStatement" : ">=1",
      "ForInStatementExpressionOpening" : 0,
      "ForInStatementExpressionClosing" : 0,
      "ForInStatementOpeningBrace" : 0,
      "ForInStatementClosingBrace" : ">=1",
      "ForStatement" : ">=1",
      "ForStatementExpressionOpening" : 0,
      "ForStatementExpressionClosing" : "<2",
      "ForStatementOpeningBrace" : 0,
      "ForStatementClosingBrace" : ">=1",
      "FunctionExpression" : -1,
      "FunctionExpressionOpeningBrace" : 0,
      "FunctionExpressionClosingBrace" : ">=1",
      "FunctionDeclaration" : ">=1",
      "FunctionDeclarationOpeningBrace" : 0,
      "FunctionDeclarationClosingBrace" : ">=1",
      "IIFEClosingParentheses" : 0,
      "IfStatement" : ">=1",
      "IfStatementOpeningBrace" : 0,
      "IfStatementClosingBrace" : ">=1",
      "ElseIfStatement" : 0,
      "ElseIfStatementOpeningBrace" : 0,
      "ElseIfStatementClosingBrace" : ">=1",
      "ElseStatement" : 0,
      "ElseStatementOpeningBrace" : 0,
      "ElseStatementClosingBrace" : ">=1",
      "LogicalExpression" : -1,
      "MethodDefinition": ">=1",
      "ObjectExpressionClosingBrace" : ">=1",
      "ObjectPatternOpeningBrace": 0,
      "ObjectPatternClosingBrace": 0,
      "ObjectPatternComma": 0,
      "ParameterDefault" : 0,
      "Property" : ">=1",
      "PropertyValue" : 0,
      "ReturnStatement" : -1,
      "SwitchOpeningBrace" : 0,
      "SwitchClosingBrace" : ">=1",
      "ThisExpression" : -1,
      "ThrowStatement" : ">=1",
      "TryKeyword": -1,
      "TryOpeningBrace" : 0,
      "TryClosingBrace" : ">=1",
      "VariableName" : ">=1",
      "VariableValue" : 0,
      "VariableDeclaration" : ">=1",
      "VariableDeclarationWithoutInit" : ">=1",
      "WhileStatement" : ">=1",
      "WhileStatementOpeningBrace" : 0,
      "WhileStatementClosingBrace" : ">=1"
    },

    "after" : {
      "AssignmentExpression" : ">=1",
      "AssignmentOperator" : 0,
      "ArrayPatternOpening": 0,
      "ArrayPatternClosing": 0,
      "ArrayPatternComma": 0,
      "ArrowFunctionExpressionArrow": 0,
      "ArrowFunctionExpressionOpeningBrace": ">=1",
      "ArrowFunctionExpressionClosingBrace": -1,
      "BlockStatement" : 0,
      "BreakKeyword": -1,
      "CallExpression" : -1,
      "CallExpressionOpeningParentheses" : -1,
      "CallExpressionClosingParentheses" : -1,
      "ClassDeclaration" : ">=1",
      "ClassDeclarationOpeningBrace" : ">=1",
      "ClassDeclarationClosingBrace" : ">=1",
      "CatchOpeningBrace" : ">=1",
      "CatchClosingBrace" : ">=0",
      "CatchKeyword": 0,
      "ConditionalExpression" : ">=1",
      "DeleteOperator" : ">=1",
      "DoWhileStatement" : ">=1",
      "DoWhileStatementOpeningBrace" : ">=1",
      "DoWhileStatementClosingBrace" : 0,
      "EmptyStatement" : -1,
      "FinallyKeyword" : -1,
      "FinallyOpeningBrace" : ">=1",
      "FinallyClosingBrace" : ">=1",
      "ForInStatement" : ">=1",
      "ForInStatementExpressionOpening" : "<2",
      "ForInStatementExpressionClosing" : -1,
      "ForInStatementOpeningBrace" : ">=1",
      "ForInStatementClosingBrace" : ">=1",
      "ForStatement" : ">=1",
      "ForStatementExpressionOpening" : "<2",
      "ForStatementExpressionClosing" : -1,
      "ForStatementOpeningBrace" : ">=1",
      "ForStatementClosingBrace" : ">=1",
      "FunctionExpression" : ">=1",
      "FunctionExpressionOpeningBrace" : ">=1",
      "FunctionExpressionClosingBrace" : -1,
      "FunctionDeclaration" : ">=1",
      "FunctionDeclarationOpeningBrace" : ">=1",
      "FunctionDeclarationClosingBrace" : ">=1",
      "IIFEOpeningParentheses" : 0,
      "IfStatement" : ">=1",
      "IfStatementOpeningBrace" : ">=1",
      "IfStatementClosingBrace" : ">=1",
      "ElseIfStatement" : ">=1",
      "ElseIfStatementOpeningBrace" : ">=1",
      "ElseIfStatementClosingBrace" : ">=1",
      "ElseStatement" : ">=1",
      "ElseStatementOpeningBrace" : ">=1",
      "ElseStatementClosingBrace" : ">=1",
      "LogicalExpression" : -1,
      "MethodDefinition": ">=1",
      "ObjectExpressionOpeningBrace" : ">=1",
      "ObjectPatternOpeningBrace": 0,
      "ObjectPatternClosingBrace": 0,
      "ObjectPatternComma": 0,
      "ParameterDefault" : 0,
      "Property" : 0,
      "PropertyName" : 0,
      "ReturnStatement" : -1,
      "SwitchOpeningBrace" : ">=1",
      "SwitchClosingBrace" : ">=1",
      "ThisExpression" : 0,
      "ThrowStatement" : ">=1",
      "TryKeyword": -1,
      "TryOpeningBrace" : ">=1",
      "TryClosingBrace" : 0,
      "VariableDeclaration" : ">=1",
      "WhileStatement" : ">=1",
      "WhileStatementOpeningBrace" : ">=1",
      "WhileStatementClosingBrace" : ">=1"
    }
  },


  "whiteSpace" : {
    "value" : " ",
    "removeTrailing" : 1,

    "before" : {
      "ArrayExpressionOpening" : 0,
      "ArrayExpressionClosing" : 0,
      "ArrayExpressionComma" : 0,
      "ArrayPatternOpening": 1,
      "ArrayPatternClosing": 0,
      "ArrayPatternComma": 0,
      "ArrowFunctionExpressionArrow": 1,
      "ArrowFunctionExpressionOpeningBrace": 1,
      "ArrowFunctionExpressionClosingBrace": 0,
      "ArgumentComma" : 0,
      "ArgumentList" : 0,
      "AssignmentOperator" : 1,
      "BinaryExpression": 0,
      "BinaryExpressionOperator" : 1,
      "BlockComment" : 1,
      "CallExpression" : -1,
      "CallExpressionOpeningParentheses" : 0,
      "CallExpressionClosingParentheses" : -1,
      "CatchParameterList" : 0,
      "CatchOpeningBrace" : 1,
      "CatchClosingBrace" : 1,
      "CatchKeyword" : 1,
      "CommaOperator" : 0,
      "ClassDeclarationOpeningBrace" : 1,
      "ClassDeclarationClosingBrace" : 1,
      "ConditionalExpressionConsequent" : 1,
      "ConditionalExpressionAlternate" : 1,
      "DoWhileStatementOpeningBrace" : 1,
      "DoWhileStatementClosingBrace" : 1,
      "DoWhileStatementConditional" : 1,
      "EmptyStatement" : 0,
      "ExpressionClosingParentheses" : 0,
      "FinallyKeyword" : -1,
      "FinallyOpeningBrace" : 1,
      "FinallyClosingBrace" : 1,
      "ForInStatement" : 1,
      "ForInStatementExpressionOpening" : 1,
      "ForInStatementExpressionClosing" : 0,
      "ForInStatementOpeningBrace" : 1,
      "ForInStatementClosingBrace" : 1,
      "ForStatement" : 1,
      "ForStatementExpressionOpening" : 1,
      "ForStatementExpressionClosing" : 0,
      "ForStatementOpeningBrace" : 1,
      "ForStatementClosingBrace" : 1,
      "ForStatementSemicolon" : 0,
      "FunctionDeclarationOpeningBrace" : 1,
      "FunctionDeclarationClosingBrace" : 1,
      "FunctionExpressionOpeningBrace" : 1,
      "FunctionExpressionClosingBrace" : 1,
      "FunctionName" : 1,
      "IIFEClosingParentheses" : 0,
      "IfStatementConditionalOpening" : 1,
      "IfStatementConditionalClosing" : 0,
      "IfStatementOpeningBrace" : 1,
      "IfStatementClosingBrace" : 1,
      "ElseStatementOpeningBrace" : 1,
      "ElseStatementClosingBrace" : 1,
      "ElseIfStatementOpeningBrace" : 1,
      "ElseIfStatementClosingBrace" : 1,
      "LineComment" : 1,
      "LogicalExpressionOperator" : 1,
      "MemberExpressionClosing" : 0,
      "ObjectExpressionOpeningBrace": -1,
      "ObjectExpressionClosingBrace": 0,
      "ObjectPatternOpeningBrace": 1,
      "ObjectPatternClosingBrace": 0,
      "ObjectPatternComma": 0,
      "Property" : 1,
      "PropertyValue" : 1,
      "ParameterComma" : 0,
      "ParameterDefault" : 1,
      "ParameterList" : 0,
      "SwitchDiscriminantOpening" : 1,
      "SwitchDiscriminantClosing" : 0,
      "ThrowKeyword": 1,
      "TryKeyword": -1,
      "TryOpeningBrace" : 1,
      "TryClosingBrace" : 1,
      "UnaryExpressionOperator": 0,
      "VariableName" : 1,
      "VariableValue" : 1,
      "WhileStatementConditionalOpening" : 1,
      "WhileStatementConditionalClosing" : 0,
      "WhileStatementOpeningBrace" : 1,
      "WhileStatementClosingBrace" : 1
    },

    "after" : {
      "ArrayExpressionOpening" : 0,
      "ArrayExpressionClosing" : 0,
      "ArrayExpressionComma" : 1,
      "ArrayPatternOpening": 0,
      "ArrayPatternClosing": 1,
      "ArrayPatternComma": 1,
      "ArrowFunctionExpressionArrow": 1,
      "ArrowFunctionExpressionOpeningBrace": 0,
      "ArrowFunctionExpressionClosingBrace": 0,
      "ArgumentComma" : 1,
      "ArgumentList" : 0,
      "AssignmentOperator" : 1,
      "BinaryExpression": 0,
      "BinaryExpressionOperator" : 1,
      "BlockComment" : 1,
      "CallExpression" : -1,
      "CallExpressionOpeningParentheses" : -1,
      "CallExpressionClosingParentheses" : -1,
      "CatchParameterList" : 0,
      "CatchOpeningBrace" : 1,
      "CatchClosingBrace" : 1,
      "CatchKeyword" : 1,
      "ClassDeclarationOpeningBrace" : 1,
      "ClassDeclarationClosingBrace" : 1,
      "CommaOperator" : 1,
      "ConditionalExpressionConsequent" : 1,
      "ConditionalExpressionTest" : 1,
      "DoWhileStatementOpeningBrace" : 1,
      "DoWhileStatementClosingBrace" : 1,
      "DoWhileStatementBody" : 1,
      "EmptyStatement" : 0,
      "ExpressionOpeningParentheses" : 0,
      "FinallyKeyword" : -1,
      "FinallyOpeningBrace" : 1,
      "FinallyClosingBrace" : 1,
      "ForInStatement" : 1,
      "ForInStatementExpressionOpening" : 0,
      "ForInStatementExpressionClosing" : 1,
      "ForInStatementOpeningBrace" : 1,
      "ForInStatementClosingBrace" : 1,
      "ForStatement" : 1,
      "ForStatementExpressionOpening" : 0,
      "ForStatementExpressionClosing" : 1,
      "ForStatementClosingBrace" : 1,
      "ForStatementOpeningBrace" : 1,
      "ForStatementSemicolon" : 1,
      "FunctionReservedWord": 0,
      "FunctionName" : 0,
      "FunctionExpressionOpeningBrace" : 1,
      "FunctionExpressionClosingBrace" : 0,
      "FunctionDeclarationOpeningBrace" : 1,
      "FunctionDeclarationClosingBrace" : 1,
      "IIFEOpeningParentheses" : 0,
      "IfStatementConditionalOpening" : 0,
      "IfStatementConditionalClosing" : 1,
      "IfStatementOpeningBrace" : 1,
      "IfStatementClosingBrace" : 1,
      "ElseStatementOpeningBrace" : 1,
      "ElseStatementClosingBrace" : 1,
      "ElseIfStatementOpeningBrace" : 1,
      "ElseIfStatementClosingBrace" : 1,
      "MemberExpressionOpening" : 0,
      "LogicalExpressionOperator" : 1,
      "ObjectExpressionOpeningBrace": 0,
      "ObjectExpressionClosingBrace": 0,
      "ObjectPatternOpeningBrace": 0,
      "ObjectPatternClosingBrace": 1,
      "ObjectPatternComma": 1,
      "PropertyName" : 0,
      "PropertyValue" : 0,
      "ParameterComma" : 1,
      "ParameterDefault" : 1,
      "ParameterList" : 0,
      "SwitchDiscriminantOpening" : 0,
      "SwitchDiscriminantClosing" : 1,
      "ThrowKeyword": 1,
      "TryKeyword": -1,
      "TryOpeningBrace" : 1,
      "TryClosingBrace" : 1,
      "UnaryExpressionOperator": 0,
      "VariableName" : 1,
      "WhileStatementConditionalOpening" : 0,
      "WhileStatementConditionalClosing" : 1,
      "WhileStatementOpeningBrace" : 1,
      "WhileStatementClosingBrace" : 1
    }
  }

}

},{}],52:[function(require,module,exports){
module.exports={
  "preset" : "default",

  "indent" : {
    "value" : "\t",
    "IfStatementConditional": 2,
    "SwitchStatement" : 0,
    "TopLevelFunctionBlock" : 0
  },

  "lineBreak" : {
    "before" : {
      "ObjectExpressionOpeningBrace": -1,
      "ObjectExpressionClosingBrace": -1,
      "Property": -1,
      "VariableDeclarationWithoutInit" : 0
    },

    "after": {
      "AssignmentOperator": -1,
      "ObjectExpressionOpeningBrace": -1,
      "ObjectExpressionClosingBrace": -1,
      "Property": -1
    }
  },

  "whiteSpace" : {
    "before" : {
      "ArgumentList" : 1,
      "ArrayExpressionClosing" : 1,
      "CatchParameterList": 1,
      "ExpressionClosingParentheses" : 1,
      "ForInStatementExpressionClosing" : 1,
      "ForStatementExpressionClosing" : 1,
      "IfStatementConditionalClosing" : 1,
      "IIFEClosingParentheses": 1,
      "MemberExpressionClosing" : 1,
      "ObjectExpressionClosingBrace": 1,
      "ParameterList" : 1,
      "SwitchDiscriminantClosing" : 1,
      "WhileStatementConditionalClosing" : 1
    },
    "after" : {
      "ArgumentList" : 1,
      "ArrayExpressionOpening" : 1,
      "CatchParameterList": 1,
      "ExpressionOpeningParentheses" : 1,
      "ForInStatementExpressionOpening" : 1,
      "ForStatementExpressionOpening" : 1,
      "IfStatementConditionalOpening" : 1,
      "IIFEOpeningParentheses": 1,
      "MemberExpressionOpening" : 1,
      "ObjectExpressionOpeningBrace": 1,
      "ParameterList" : 1,
      "PropertyValue": -1,
      "SwitchDiscriminantOpening" : 1,
      "WhileStatementConditionalOpening" : 1
    }
  }
}

},{}],53:[function(require,module,exports){
'use strict';

var _br = require('rocambole-linebreak');
var _options = require('./options');
var _tk = require('rocambole-token');
var _ws = require('rocambole-whitespace');
var addBrAroundNode = require('./lineBreakAroundNode');
var expressionParentheses = require('./hooks/expressionParentheses');
var hooks = require('./hooks');
var indent = require('./indent');
var plugins = require('./plugins');
var rocambole = require('rocambole');

// ---

var _shouldRemoveTrailingWs;

// ---

exports = module.exports = transform;
// used to make sure we don't call setOptions twice when executing `transform`
// from inside `format`
exports.BYPASS_OPTIONS = {};

// ---

function transform(ast, opts) {
  if (opts !== exports.BYPASS_OPTIONS) {
    _options.set(opts);
  }
  // we store this here to avoid calling `_options.get` for each token
  _shouldRemoveTrailingWs = Boolean(_options.get('whiteSpace.removeTrailing'));

  plugins.transformBefore(ast);

  _tk.eachInBetween(ast.startToken, ast.endToken, preprocessToken);
  rocambole.moonwalk(ast, transformNode);
  _tk.eachInBetween(ast.startToken, ast.endToken, postprocessToken);
  _br.limitBeforeEndOfFile(ast);

  // indent should come after all other transformations since it depends on
  // line breaks caused by "parent" nodes, otherwise it will cause conflicts.
  // it should also happen after the postprocessToken since it adds line breaks
  // before/after comments and that changes the indent logic
  indent.transform(ast);

  // plugin transformation comes after the indentation since we assume user
  // knows what he is doing (will increase flexibility and allow plugin to
  // override the indentation logic)
  // we have an alias "transform" to match v0.3 API, but favor `transformAfter`
  // moving forward. (we might deprecate "transform" in the future)
  plugins.transform(ast);
  plugins.transformAfter(ast);

  return ast;
}


function transformNode(node) {
  plugins.nodeBefore(node);
  addBrAroundNode(node);

  var hook = hooks[node.type];
  if (hook && 'format' in hook) {
    hook.format(node);
  }

  // empty program doesn't have startToken or endToken
  if (node.startToken) {
    // automatic white space comes afterwards since line breaks introduced by
    // the hooks affects it
    _ws.limitBefore(node.startToken, node.type);
    _ws.limitAfter(node.endToken, node.type);
  }

  // handle parenthesis automatically since it is needed by multiple node types
  // and it avoids code duplication and reduces complexity of each hook
  expressionParentheses.addSpaceInside(node);
  plugins.nodeAfter(node);
}


function preprocessToken(token) {
  if (_tk.isComment(token)) {
    _br.limit(token, token.type);
  }
  plugins.tokenBefore(token);
}


function postprocessToken(token) {
  if (_tk.isComment(token)) {
    processComment(token);
  } else if (_shouldRemoveTrailingWs && _tk.isWs(token)) {
    removeTrailingWs(token);
  }
  plugins.tokenAfter(token);
}


function processComment(token) {
  _ws.limitBefore(token, token.type);
  // only block comment needs space afterwards
  if (token.type === 'BlockComment') {
    _ws.limitAfter(token, token.type);
    return;
  }

  // CommentGroup is composed of multiple LineComment
  var prev = _tk.findPrevNonEmpty(token);
  var next = _tk.findNextNonEmpty(token);
  if (!_tk.isComment(prev)) {
    _br.limitBefore(token, 'CommentGroup');
  }
  if (!_tk.isComment(next)) {
    _br.limitAfter(token, 'CommentGroup');
  }
}


function removeTrailingWs(token) {
  if (_tk.isBr(token.next) || !token.next) {
    _tk.remove(token);
  }
}

},{"./hooks":7,"./hooks/expressionParentheses":45,"./indent":46,"./lineBreakAroundNode":48,"./options":49,"./plugins":50,"rocambole":96,"rocambole-linebreak":83,"rocambole-token":85,"rocambole-whitespace":94}],54:[function(require,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],55:[function(require,module,exports){
'use strict';

var stringDiff = require('diff');
var ansi = require('ansi-styles');

// ---

exports.unified = unified;
exports.unifiedNoColor = unifiedNoColor;
exports.chars = chars;
exports.removed = 'removed';
exports.added = 'added';
exports.colors = {
  charsRemoved: ansi.bgRed,
  charsAdded: ansi.bgGreen,
  removed: ansi.red,
  added: ansi.green,
  header: ansi.yellow,
  section: ansi.magenta,
};

// ---

function chars(str1, str2, opts) {
  if (str1 === str2) {
    return '';
  }

  opts = opts || {};

  // how many lines to add before/after the chars diff
  var context = opts.context != null ? opts.context : 3;

  var path1 = opts.paths && opts.paths[0] || exports.removed;
  var path2 = opts.paths && opts.paths[1] || exports.added;

  // text displayed before diff
  var header = colorize(path1, 'charsRemoved') + ' ' +
    colorize(path2, 'charsAdded') + '\n\n';

  var changes = stringDiff.diffChars(str1, str2);
  var diff = changes.map(function(c) {
    var val = replaceInvisibleChars(c.value);
    if (c.removed) return colorize(val, 'charsRemoved');
    if (c.added) return colorize(val, 'charsAdded');
    return val;
  }).join('');

  // this RegExp will include the '\n' char into the lines, easier to join()
  var lines = diff.split(/^/m);

  lines = addLineNumbers(lines);
  lines = removeLinesOutOfContext(lines, context);

  return header + lines.join('');
}

function addLineNumbers(lines) {
  var nChars = lines.length.toString().length;
  return lines.map(function(line, i) {
    return alignRight(i + 1, nChars) + ' | ' + line;
  });
}

function colorize(str, colorId) {
  var color = exports.colors[colorId];
  // avoid highlighting the "\n" (would highlight till the end of the line)
  return str.replace(/[^\n\r]+/g, color.open + '$&' + color.close);
}

function replaceInvisibleChars(str) {
  return str
    .replace(/\t/g, '<tab>')
    .replace(/\r/g, '<CR>')
    .replace(/\n/g, '<LF>\n');
}

function alignRight(val, nChars) {
  val = val.toString();
  var diff = nChars - val.length;
  return diff ? (new Array(diff + 1)).join(' ') + val : val;
}

function removeLinesOutOfContext(lines, context) {
  // we cache the results since same line ends up being checked multiple times
  var diffMap = {};
  var lastDiff = -Infinity;
  function hasDiff(line, i) {
    if (!(i in diffMap)) {
      diffMap[i] = hasCharDiff(line);
    }
    return diffMap[i];
  }

  function hasDiffBefore(i) {
    return lastDiff + context >= i;
  }

  function hasDiffAfter(i) {
    var max = Math.min(i + context, lines.length - 1);
    var n = i;
    while (++n <= max) {
      if (hasDiff(lines[n], n)) return true;
    }
    return false;
  }

  return lines.filter(function(line, i, arr) {
    var has = hasDiff(line, i);
    if (has) {
      lastDiff = i;
    }
    return has || hasDiffBefore(i) || hasDiffAfter(i);
  });
}

function hasCharDiff(line) {
  return line.indexOf(exports.colors.charsAdded.open) !== -1 ||
    line.indexOf(exports.colors.charsRemoved.open) !== -1;
}

function unified(str1, str2, opts) {
  if (str2 === str1) {
    return '';
  }

  var changes = unifiedNoColor(str1, str2, opts);
  // this RegExp will include all the `\n` chars into the lines, easier to join
  var lines = changes.split(/^/m);

  var start = colorize(lines.slice(0, 2).join(''), 'header');
  var end = lines.slice(2).join('')
    .replace(/^\-.*/gm, colorize('$&', 'removed'))
    .replace(/^\+.*/gm, colorize('$&', 'added'))
    .replace(/^@@.+@@/gm, colorize('$&', 'section'));

  return start + end;
}

function unifiedNoColor(str1, str2, opts) {
  if (str2 === str1) {
    return '';
  }

  opts = opts || {};
  var path1 = opts.paths && opts.paths[0] || '';
  var path2 = opts.paths && opts.paths[1] || path1;

  var changes = stringDiff.createPatch('', str1, str2, '', '');

  // remove first 2 lines (header)
  changes = changes.replace(/^([^\n]+)\n([^\n]+)\n/m, '');

  function appendPath(str, filePath, state) {
    var result = str;
    if (filePath) {
      result += ' ' + filePath;
    }
    if (state) {
      result += filePath ? '\t' : ' ';
      result += state;
    }
    return result;
  }

  changes = changes
    .replace(/^---.*/gm, appendPath('---', path1, exports.removed))
    .replace(/^\+\+\+.*/gm, appendPath('+++', path2, exports.added));

  return changes;
}

},{"ansi-styles":56,"diff":57}],56:[function(require,module,exports){
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{}],57:[function(require,module,exports){
/* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */
(function(global, undefined) {
  var objectPrototypeToString = Object.prototype.toString;

  /*istanbul ignore next*/
  function map(arr, mapper, that) {
    if (Array.prototype.map) {
      return Array.prototype.map.call(arr, mapper, that);
    }

    var other = new Array(arr.length);

    for (var i = 0, n = arr.length; i < n; i++) {
      other[i] = mapper.call(that, arr[i], i, arr);
    }
    return other;
  }
  function clonePath(path) {
    return { newPos: path.newPos, components: path.components.slice(0) };
  }
  function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  function escapeHTML(s) {
    var n = s;
    n = n.replace(/&/g, '&amp;');
    n = n.replace(/</g, '&lt;');
    n = n.replace(/>/g, '&gt;');
    n = n.replace(/"/g, '&quot;');

    return n;
  }

  // This function handles the presence of circular references by bailing out when encountering an
  // object that is already on the "stack" of items being processed.
  function canonicalize(obj, stack, replacementStack) {
    stack = stack || [];
    replacementStack = replacementStack || [];

    var i;

    for (i = 0; i < stack.length; i += 1) {
      if (stack[i] === obj) {
        return replacementStack[i];
      }
    }

    var canonicalizedObj;

    if ('[object Array]' === objectPrototypeToString.call(obj)) {
      stack.push(obj);
      canonicalizedObj = new Array(obj.length);
      replacementStack.push(canonicalizedObj);
      for (i = 0; i < obj.length; i += 1) {
        canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack);
      }
      stack.pop();
      replacementStack.pop();
    } else if (typeof obj === 'object' && obj !== null) {
      stack.push(obj);
      canonicalizedObj = {};
      replacementStack.push(canonicalizedObj);
      var sortedKeys = [],
          key;
      for (key in obj) {
        sortedKeys.push(key);
      }
      sortedKeys.sort();
      for (i = 0; i < sortedKeys.length; i += 1) {
        key = sortedKeys[i];
        canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack);
      }
      stack.pop();
      replacementStack.pop();
    } else {
      canonicalizedObj = obj;
    }
    return canonicalizedObj;
  }

  function buildValues(components, newString, oldString, useLongestToken) {
    var componentPos = 0,
        componentLen = components.length,
        newPos = 0,
        oldPos = 0;

    for (; componentPos < componentLen; componentPos++) {
      var component = components[componentPos];
      if (!component.removed) {
        if (!component.added && useLongestToken) {
          var value = newString.slice(newPos, newPos + component.count);
          value = map(value, function(value, i) {
            var oldValue = oldString[oldPos + i];
            return oldValue.length > value.length ? oldValue : value;
          });

          component.value = value.join('');
        } else {
          component.value = newString.slice(newPos, newPos + component.count).join('');
        }
        newPos += component.count;

        // Common case
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = oldString.slice(oldPos, oldPos + component.count).join('');
        oldPos += component.count;

        // Reverse add and remove so removes are output first to match common convention
        // The diffing algorithm is tied to add then remove output and this is the simplest
        // route to get the desired output with minimal overhead.
        if (componentPos && components[componentPos - 1].added) {
          var tmp = components[componentPos - 1];
          components[componentPos - 1] = components[componentPos];
          components[componentPos] = tmp;
        }
      }
    }

    return components;
  }

  function Diff(ignoreWhitespace) {
    this.ignoreWhitespace = ignoreWhitespace;
  }
  Diff.prototype = {
    diff: function(oldString, newString, callback) {
      var self = this;

      function done(value) {
        if (callback) {
          setTimeout(function() { callback(undefined, value); }, 0);
          return true;
        } else {
          return value;
        }
      }

      // Handle the identity case (this is due to unrolling editLength == 0
      if (newString === oldString) {
        return done([{ value: newString }]);
      }
      if (!newString) {
        return done([{ value: oldString, removed: true }]);
      }
      if (!oldString) {
        return done([{ value: newString, added: true }]);
      }

      newString = this.tokenize(newString);
      oldString = this.tokenize(oldString);

      var newLen = newString.length, oldLen = oldString.length;
      var editLength = 1;
      var maxEditLength = newLen + oldLen;
      var bestPath = [{ newPos: -1, components: [] }];

      // Seed editLength = 0, i.e. the content starts with the same values
      var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
      if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
        // Identity per the equality and tokenizer
        return done([{value: newString.join('')}]);
      }

      // Main worker method. checks all permutations of a given edit length for acceptance.
      function execEditLength() {
        for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
          var basePath;
          var addPath = bestPath[diagonalPath - 1],
              removePath = bestPath[diagonalPath + 1],
              oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
          if (addPath) {
            // No one else is going to attempt to use this value, clear it
            bestPath[diagonalPath - 1] = undefined;
          }

          var canAdd = addPath && addPath.newPos + 1 < newLen,
              canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
          if (!canAdd && !canRemove) {
            // If this path is a terminal then prune
            bestPath[diagonalPath] = undefined;
            continue;
          }

          // Select the diagonal that we want to branch from. We select the prior
          // path whose position in the new string is the farthest from the origin
          // and does not pass the bounds of the diff graph
          if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
            basePath = clonePath(removePath);
            self.pushComponent(basePath.components, undefined, true);
          } else {
            basePath = addPath;   // No need to clone, we've pulled it from the list
            basePath.newPos++;
            self.pushComponent(basePath.components, true, undefined);
          }

          oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);

          // If we have hit the end of both strings, then we are done
          if (basePath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
            return done(buildValues(basePath.components, newString, oldString, self.useLongestToken));
          } else {
            // Otherwise track this path as a potential candidate and continue.
            bestPath[diagonalPath] = basePath;
          }
        }

        editLength++;
      }

      // Performs the length of edit iteration. Is a bit fugly as this has to support the
      // sync and async mode which is never fun. Loops over execEditLength until a value
      // is produced.
      if (callback) {
        (function exec() {
          setTimeout(function() {
            // This should not happen, but we want to be safe.
            /*istanbul ignore next */
            if (editLength > maxEditLength) {
              return callback();
            }

            if (!execEditLength()) {
              exec();
            }
          }, 0);
        }());
      } else {
        while (editLength <= maxEditLength) {
          var ret = execEditLength();
          if (ret) {
            return ret;
          }
        }
      }
    },

    pushComponent: function(components, added, removed) {
      var last = components[components.length - 1];
      if (last && last.added === added && last.removed === removed) {
        // We need to clone here as the component clone operation is just
        // as shallow array clone
        components[components.length - 1] = {count: last.count + 1, added: added, removed: removed };
      } else {
        components.push({count: 1, added: added, removed: removed });
      }
    },
    extractCommon: function(basePath, newString, oldString, diagonalPath) {
      var newLen = newString.length,
          oldLen = oldString.length,
          newPos = basePath.newPos,
          oldPos = newPos - diagonalPath,

          commonCount = 0;
      while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
        newPos++;
        oldPos++;
        commonCount++;
      }

      if (commonCount) {
        basePath.components.push({count: commonCount});
      }

      basePath.newPos = newPos;
      return oldPos;
    },

    equals: function(left, right) {
      var reWhitespace = /\S/;
      return left === right || (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right));
    },
    tokenize: function(value) {
      return value.split('');
    }
  };

  var CharDiff = new Diff();

  var WordDiff = new Diff(true);
  var WordWithSpaceDiff = new Diff();
  WordDiff.tokenize = WordWithSpaceDiff.tokenize = function(value) {
    return removeEmpty(value.split(/(\s+|\b)/));
  };

  var CssDiff = new Diff(true);
  CssDiff.tokenize = function(value) {
    return removeEmpty(value.split(/([{}:;,]|\s+)/));
  };

  var LineDiff = new Diff();

  var TrimmedLineDiff = new Diff();
  TrimmedLineDiff.ignoreTrim = true;

  LineDiff.tokenize = TrimmedLineDiff.tokenize = function(value) {
    var retLines = [],
        lines = value.split(/^/m);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i],
          lastLine = lines[i - 1],
          lastLineLastChar = lastLine && lastLine[lastLine.length - 1];

      // Merge lines that may contain windows new lines
      if (line === '\n' && lastLineLastChar === '\r') {
          retLines[retLines.length - 1] = retLines[retLines.length - 1].slice(0, -1) + '\r\n';
      } else {
        if (this.ignoreTrim) {
          line = line.trim();
          // add a newline unless this is the last line.
          if (i < lines.length - 1) {
            line += '\n';
          }
        }
        retLines.push(line);
      }
    }

    return retLines;
  };

  var PatchDiff = new Diff();
  PatchDiff.tokenize = function(value) {
    var ret = [],
        linesAndNewlines = value.split(/(\n|\r\n)/);

    // Ignore the final empty token that occurs if the string ends with a new line
    if (!linesAndNewlines[linesAndNewlines.length - 1]) {
      linesAndNewlines.pop();
    }

    // Merge the content and line separators into single tokens
    for (var i = 0; i < linesAndNewlines.length; i++) {
      var line = linesAndNewlines[i];

      if (i % 2) {
        ret[ret.length - 1] += line;
      } else {
        ret.push(line);
      }
    }
    return ret;
  };

  var SentenceDiff = new Diff();
  SentenceDiff.tokenize = function(value) {
    return removeEmpty(value.split(/(\S.+?[.!?])(?=\s+|$)/));
  };

  var JsonDiff = new Diff();
  // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
  // dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
  JsonDiff.useLongestToken = true;
  JsonDiff.tokenize = LineDiff.tokenize;
  JsonDiff.equals = function(left, right) {
    return LineDiff.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
  };

  var JsDiff = {
    Diff: Diff,

    diffChars: function(oldStr, newStr, callback) { return CharDiff.diff(oldStr, newStr, callback); },
    diffWords: function(oldStr, newStr, callback) { return WordDiff.diff(oldStr, newStr, callback); },
    diffWordsWithSpace: function(oldStr, newStr, callback) { return WordWithSpaceDiff.diff(oldStr, newStr, callback); },
    diffLines: function(oldStr, newStr, callback) { return LineDiff.diff(oldStr, newStr, callback); },
    diffTrimmedLines: function(oldStr, newStr, callback) { return TrimmedLineDiff.diff(oldStr, newStr, callback); },

    diffSentences: function(oldStr, newStr, callback) { return SentenceDiff.diff(oldStr, newStr, callback); },

    diffCss: function(oldStr, newStr, callback) { return CssDiff.diff(oldStr, newStr, callback); },
    diffJson: function(oldObj, newObj, callback) {
      return JsonDiff.diff(
        typeof oldObj === 'string' ? oldObj : JSON.stringify(canonicalize(oldObj), undefined, '  '),
        typeof newObj === 'string' ? newObj : JSON.stringify(canonicalize(newObj), undefined, '  '),
        callback
      );
    },

    createTwoFilesPatch: function(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader) {
      var ret = [];

      if (oldFileName == newFileName) {
        ret.push('Index: ' + oldFileName);
      }
      ret.push('===================================================================');
      ret.push('--- ' + oldFileName + (typeof oldHeader === 'undefined' ? '' : '\t' + oldHeader));
      ret.push('+++ ' + newFileName + (typeof newHeader === 'undefined' ? '' : '\t' + newHeader));

      var diff = PatchDiff.diff(oldStr, newStr);
      diff.push({value: '', lines: []});   // Append an empty value to make cleanup easier

      // Formats a given set of lines for printing as context lines in a patch
      function contextLines(lines) {
        return map(lines, function(entry) { return ' ' + entry; });
      }

      // Outputs the no newline at end of file warning if needed
      function eofNL(curRange, i, current) {
        var last = diff[diff.length - 2],
            isLast = i === diff.length - 2,
            isLastOfType = i === diff.length - 3 && current.added !== last.added;

        // Figure out if this is the last line for the given file and missing NL
        if (!(/\n$/.test(current.value)) && (isLast || isLastOfType)) {
          curRange.push('\\ No newline at end of file');
        }
      }

      var oldRangeStart = 0, newRangeStart = 0, curRange = [],
          oldLine = 1, newLine = 1;
      for (var i = 0; i < diff.length; i++) {
        var current = diff[i],
            lines = current.lines || current.value.replace(/\n$/, '').split('\n');
        current.lines = lines;

        if (current.added || current.removed) {
          // If we have previous context, start with that
          if (!oldRangeStart) {
            var prev = diff[i - 1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;

            if (prev) {
              curRange = contextLines(prev.lines.slice(-4));
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          }

          // Output our changes
          curRange.push.apply(curRange, map(lines, function(entry) {
            return (current.added ? '+' : '-') + entry;
          }));
          eofNL(curRange, i, current);

          // Track the updated file position
          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          // Identical context lines. Track line changes
          if (oldRangeStart) {
            // Close out any changes that have been output (or join overlapping)
            if (lines.length <= 8 && i < diff.length - 2) {
              // Overlapping
              curRange.push.apply(curRange, contextLines(lines));
            } else {
              // end the range and output
              var contextSize = Math.min(lines.length, 4);
              ret.push(
                  '@@ -' + oldRangeStart + ',' + (oldLine - oldRangeStart + contextSize)
                  + ' +' + newRangeStart + ',' + (newLine - newRangeStart + contextSize)
                  + ' @@');
              ret.push.apply(ret, curRange);
              ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));
              if (lines.length <= 4) {
                eofNL(ret, i, current);
              }

              oldRangeStart = 0;
              newRangeStart = 0;
              curRange = [];
            }
          }
          oldLine += lines.length;
          newLine += lines.length;
        }
      }

      return ret.join('\n') + '\n';
    },

    createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
      return JsDiff.createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader);
    },

    applyPatch: function(oldStr, uniDiff) {
      var diffstr = uniDiff.split('\n'),
          hunks = [],
          i = 0,
          remEOFNL = false,
          addEOFNL = false;

      // Skip to the first change hunk
      while (i < diffstr.length && !(/^@@/.test(diffstr[i]))) {
        i++;
      }

      // Parse the unified diff
      for (; i < diffstr.length; i++) {
        if (diffstr[i][0] === '@') {
          var chnukHeader = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
          hunks.unshift({
            start: chnukHeader[3],
            oldlength: +chnukHeader[2],
            removed: [],
            newlength: chnukHeader[4],
            added: []
          });
        } else if (diffstr[i][0] === '+') {
          hunks[0].added.push(diffstr[i].substr(1));
        } else if (diffstr[i][0] === '-') {
          hunks[0].removed.push(diffstr[i].substr(1));
        } else if (diffstr[i][0] === ' ') {
          hunks[0].added.push(diffstr[i].substr(1));
          hunks[0].removed.push(diffstr[i].substr(1));
        } else if (diffstr[i][0] === '\\') {
          if (diffstr[i - 1][0] === '+') {
            remEOFNL = true;
          } else if (diffstr[i - 1][0] === '-') {
            addEOFNL = true;
          }
        }
      }

      // Apply the diff to the input
      var lines = oldStr.split('\n');
      for (i = hunks.length - 1; i >= 0; i--) {
        var hunk = hunks[i];
        // Sanity check the input string. Bail if we don't match.
        for (var j = 0; j < hunk.oldlength; j++) {
          if (lines[hunk.start - 1 + j] !== hunk.removed[j]) {
            return false;
          }
        }
        Array.prototype.splice.apply(lines, [hunk.start - 1, hunk.oldlength].concat(hunk.added));
      }

      // Handle EOFNL insertion/removal
      if (remEOFNL) {
        while (!lines[lines.length - 1]) {
          lines.pop();
        }
      } else if (addEOFNL) {
        lines.push('');
      }
      return lines.join('\n');
    },

    convertChangesToXML: function(changes) {
      var ret = [];
      for (var i = 0; i < changes.length; i++) {
        var change = changes[i];
        if (change.added) {
          ret.push('<ins>');
        } else if (change.removed) {
          ret.push('<del>');
        }

        ret.push(escapeHTML(change.value));

        if (change.added) {
          ret.push('</ins>');
        } else if (change.removed) {
          ret.push('</del>');
        }
      }
      return ret.join('');
    },

    // See: http://code.google.com/p/google-diff-match-patch/wiki/API
    convertChangesToDMP: function(changes) {
      var ret = [],
          change,
          operation;
      for (var i = 0; i < changes.length; i++) {
        change = changes[i];
        if (change.added) {
          operation = 1;
        } else if (change.removed) {
          operation = -1;
        } else {
          operation = 0;
        }

        ret.push([operation, change.value]);
      }
      return ret;
    },

    canonicalize: canonicalize
  };

  /*istanbul ignore next */
  /*global module */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = JsDiff;
  } else if (typeof define === 'function' && define.amd) {
    /*global define */
    define([], function() { return JsDiff; });
  } else if (typeof global.JsDiff === 'undefined') {
    global.JsDiff = JsDiff;
  }
}(this));

},{}],58:[function(require,module,exports){
/*
Copyright (C) 2015 Fred K. Schott <fkschott@gmail.com>
Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/*eslint no-undefined:0, no-use-before-define: 0*/

"use strict";

var syntax = require("./lib/syntax"),
    tokenInfo = require("./lib/token-info"),
    astNodeTypes = require("./lib/ast-node-types"),
    astNodeFactory = require("./lib/ast-node-factory"),
    defaultFeatures = require("./lib/features"),
    Messages = require("./lib/messages"),
    XHTMLEntities = require("./lib/xhtml-entities"),
    StringMap = require("./lib/string-map"),
    commentAttachment = require("./lib/comment-attachment");

var Token = tokenInfo.Token,
    TokenName = tokenInfo.TokenName,
    FnExprTokens = tokenInfo.FnExprTokens,
    Regex = syntax.Regex,
    PropertyKind,
    source,
    strict,
    index,
    lineNumber,
    lineStart,
    length,
    lookahead,
    state,
    extra;

PropertyKind = {
    Data: 1,
    Get: 2,
    Set: 4
};


// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.

function assert(condition, message) {
    /* istanbul ignore if */
    if (!condition) {
        throw new Error("ASSERT: " + message);
    }
}

// 7.4 Comments

function addComment(type, value, start, end, loc) {
    var comment;

    assert(typeof start === "number", "Comment must have valid position");

    // Because the way the actual token is scanned, often the comments
    // (if any) are skipped twice during the lexical analysis.
    // Thus, we need to skip adding a comment if the comment array already
    // handled it.
    if (state.lastCommentStart >= start) {
        return;
    }
    state.lastCommentStart = start;

    comment = {
        type: type,
        value: value
    };
    if (extra.range) {
        comment.range = [start, end];
    }
    if (extra.loc) {
        comment.loc = loc;
    }
    extra.comments.push(comment);

    if (extra.attachComment) {
        commentAttachment.addComment(comment);
    }
}

function skipSingleLineComment(offset) {
    var start, loc, ch, comment;

    start = index - offset;
    loc = {
        start: {
            line: lineNumber,
            column: index - lineStart - offset
        }
    };

    while (index < length) {
        ch = source.charCodeAt(index);
        ++index;
        if (syntax.isLineTerminator(ch)) {
            if (extra.comments) {
                comment = source.slice(start + offset, index - 1);
                loc.end = {
                    line: lineNumber,
                    column: index - lineStart - 1
                };
                addComment("Line", comment, start, index - 1, loc);
            }
            if (ch === 13 && source.charCodeAt(index) === 10) {
                ++index;
            }
            ++lineNumber;
            lineStart = index;
            return;
        }
    }

    if (extra.comments) {
        comment = source.slice(start + offset, index);
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };
        addComment("Line", comment, start, index, loc);
    }
}

function skipMultiLineComment() {
    var start, loc, ch, comment;

    if (extra.comments) {
        start = index - 2;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - 2
            }
        };
    }

    while (index < length) {
        ch = source.charCodeAt(index);
        if (syntax.isLineTerminator(ch)) {
            if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                ++index;
            }
            ++lineNumber;
            ++index;
            lineStart = index;
            if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
            }
        } else if (ch === 0x2A) {
            // Block comment ends with "*/".
            if (source.charCodeAt(index + 1) === 0x2F) {
                ++index;
                ++index;
                if (extra.comments) {
                    comment = source.slice(start + 2, index - 2);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart
                    };
                    addComment("Block", comment, start, index, loc);
                }
                return;
            }
            ++index;
        } else {
            ++index;
        }
    }

    throwError({}, Messages.UnexpectedToken, "ILLEGAL");
}

function skipComment() {
    var ch, start;

    start = (index === 0);
    while (index < length) {
        ch = source.charCodeAt(index);

        if (syntax.isWhiteSpace(ch)) {
            ++index;
        } else if (syntax.isLineTerminator(ch)) {
            ++index;
            if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                ++index;
            }
            ++lineNumber;
            lineStart = index;
            start = true;
        } else if (ch === 0x2F) { // U+002F is "/"
            ch = source.charCodeAt(index + 1);
            if (ch === 0x2F) {
                ++index;
                ++index;
                skipSingleLineComment(2);
                start = true;
            } else if (ch === 0x2A) {  // U+002A is "*"
                ++index;
                ++index;
                skipMultiLineComment();
            } else {
                break;
            }
        } else if (start && ch === 0x2D) { // U+002D is "-"
            // U+003E is ">"
            if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                // "-->" is a single-line comment
                index += 3;
                skipSingleLineComment(3);
            } else {
                break;
            }
        } else if (ch === 0x3C) { // U+003C is "<"
            if (source.slice(index + 1, index + 4) === "!--") {
                ++index; // `<`
                ++index; // `!`
                ++index; // `-`
                ++index; // `-`
                skipSingleLineComment(4);
            } else {
                break;
            }
        } else {
            break;
        }
    }
}

function scanHexEscape(prefix) {
    var i, len, ch, code = 0;

    len = (prefix === "u") ? 4 : 2;
    for (i = 0; i < len; ++i) {
        if (index < length && syntax.isHexDigit(source[index])) {
            ch = source[index++];
            code = code * 16 + "0123456789abcdef".indexOf(ch.toLowerCase());
        } else {
            return "";
        }
    }
    return String.fromCharCode(code);
}

/**
 * Scans an extended unicode code point escape sequence from source. Throws an
 * error if the sequence is empty or if the code point value is too large.
 * @returns {string} The string created by the Unicode escape sequence.
 * @private
 */
function scanUnicodeCodePointEscape() {
    var ch, code, cu1, cu2;

    ch = source[index];
    code = 0;

    // At least one hex digit is required.
    if (ch === "}") {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    while (index < length) {
        ch = source[index++];
        if (!syntax.isHexDigit(ch)) {
            break;
        }
        code = code * 16 + "0123456789abcdef".indexOf(ch.toLowerCase());
    }

    if (code > 0x10FFFF || ch !== "}") {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    // UTF-16 Encoding
    if (code <= 0xFFFF) {
        return String.fromCharCode(code);
    }
    cu1 = ((code - 0x10000) >> 10) + 0xD800;
    cu2 = ((code - 0x10000) & 1023) + 0xDC00;
    return String.fromCharCode(cu1, cu2);
}

function getEscapedIdentifier() {
    var ch, id;

    ch = source.charCodeAt(index++);
    id = String.fromCharCode(ch);

    // "\u" (U+005C, U+0075) denotes an escaped character.
    if (ch === 0x5C) {
        if (source.charCodeAt(index) !== 0x75) {
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
        }
        ++index;
        ch = scanHexEscape("u");
        if (!ch || ch === "\\" || !syntax.isIdentifierStart(ch.charCodeAt(0))) {
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
        }
        id = ch;
    }

    while (index < length) {
        ch = source.charCodeAt(index);
        if (!syntax.isIdentifierPart(ch)) {
            break;
        }
        ++index;
        id += String.fromCharCode(ch);

        // "\u" (U+005C, U+0075) denotes an escaped character.
        if (ch === 0x5C) {
            id = id.substr(0, id.length - 1);
            if (source.charCodeAt(index) !== 0x75) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
            }
            ++index;
            ch = scanHexEscape("u");
            if (!ch || ch === "\\" || !syntax.isIdentifierPart(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
            }
            id += ch;
        }
    }

    return id;
}

function getIdentifier() {
    var start, ch;

    start = index++;
    while (index < length) {
        ch = source.charCodeAt(index);
        if (ch === 0x5C) {
            // Blackslash (U+005C) marks Unicode escape sequence.
            index = start;
            return getEscapedIdentifier();
        }
        if (syntax.isIdentifierPart(ch)) {
            ++index;
        } else {
            break;
        }
    }

    return source.slice(start, index);
}

function scanIdentifier() {
    var start, id, type;

    start = index;

    // Backslash (U+005C) starts an escaped character.
    id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

    // There is no keyword or literal with only one character.
    // Thus, it must be an identifier.
    if (id.length === 1) {
        type = Token.Identifier;
    } else if (syntax.isKeyword(id, strict, extra.ecmaFeatures)) {
        type = Token.Keyword;
    } else if (id === "null") {
        type = Token.NullLiteral;
    } else if (id === "true" || id === "false") {
        type = Token.BooleanLiteral;
    } else {
        type = Token.Identifier;
    }

    return {
        type: type,
        value: id,
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}


// 7.7 Punctuators

function scanPunctuator() {
    var start = index,
        code = source.charCodeAt(index),
        code2,
        ch1 = source[index],
        ch2,
        ch3,
        ch4;

    switch (code) {
        // Check for most common single-character punctuators.
        case 40:   // ( open bracket
        case 41:   // ) close bracket
        case 59:   // ; semicolon
        case 44:   // , comma
        case 91:   // [
        case 93:   // ]
        case 58:   // :
        case 63:   // ?
        case 126:  // ~
            ++index;

            if (extra.tokenize && code === 40) {
                extra.openParenToken = extra.tokens.length;
            }

            return {
                type: Token.Punctuator,
                value: String.fromCharCode(code),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };

        case 123:  // { open curly brace
        case 125:  // } close curly brace
            ++index;

            if (extra.tokenize && code === 123) {
                extra.openCurlyToken = extra.tokens.length;
            }

            // lookahead2 function can cause tokens to be scanned twice and in doing so
            // would wreck the curly stack by pushing the same token onto the stack twice.
            // curlyLastIndex ensures each token is pushed or popped exactly once
            if (index > state.curlyLastIndex) {
                state.curlyLastIndex = index;
                if (code === 123) {
                    state.curlyStack.push("{");
                } else {
                    state.curlyStack.pop();
                }
            }

            return {
                type: Token.Punctuator,
                value: String.fromCharCode(code),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };

        default:
            code2 = source.charCodeAt(index + 1);

            // "=" (char #61) marks an assignment or comparison operator.
            if (code2 === 61) {
                switch (code) {
                    case 37:  // %
                    case 38:  // &
                    case 42:  // *:
                    case 43:  // +
                    case 45:  // -
                    case 47:  // /
                    case 60:  // <
                    case 62:  // >
                    case 94:  // ^
                    case 124: // |
                        index += 2;
                        return {
                            type: Token.Punctuator,
                            value: String.fromCharCode(code) + String.fromCharCode(code2),
                            lineNumber: lineNumber,
                            lineStart: lineStart,
                            range: [start, index]
                        };

                    case 33: // !
                    case 61: // =
                        index += 2;

                        // !== and ===
                        if (source.charCodeAt(index) === 61) {
                            ++index;
                        }
                        return {
                            type: Token.Punctuator,
                            value: source.slice(start, index),
                            lineNumber: lineNumber,
                            lineStart: lineStart,
                            range: [start, index]
                        };
                    default:
                        break;
                }
            }
            break;
    }

    // Peek more characters.

    ch2 = source[index + 1];
    ch3 = source[index + 2];
    ch4 = source[index + 3];

    // 4-character punctuator: >>>=

    if (ch1 === ">" && ch2 === ">" && ch3 === ">") {
        if (ch4 === "=") {
            index += 4;
            return {
                type: Token.Punctuator,
                value: ">>>=",
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
    }

    // 3-character punctuators: === !== >>> <<= >>=

    if (ch1 === ">" && ch2 === ">" && ch3 === ">") {
        index += 3;
        return {
            type: Token.Punctuator,
            value: ">>>",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    if (ch1 === "<" && ch2 === "<" && ch3 === "=") {
        index += 3;
        return {
            type: Token.Punctuator,
            value: "<<=",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    if (ch1 === ">" && ch2 === ">" && ch3 === "=") {
        index += 3;
        return {
            type: Token.Punctuator,
            value: ">>=",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // The ... operator (spread, restParams, JSX, etc.)
    if (extra.ecmaFeatures.spread ||
        extra.ecmaFeatures.restParams ||
        (extra.ecmaFeatures.jsx && state.inJSXSpreadAttribute)
    ) {
        if (ch1 === "." && ch2 === "." && ch3 === ".") {
            index += 3;
            return {
                type: Token.Punctuator,
                value: "...",
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
    }

    // Other 2-character punctuators: ++ -- << >> && ||
    if (ch1 === ch2 && ("+-<>&|".indexOf(ch1) >= 0)) {
        index += 2;
        return {
            type: Token.Punctuator,
            value: ch1 + ch2,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // the => for arrow functions
    if (extra.ecmaFeatures.arrowFunctions) {
        if (ch1 === "=" && ch2 === ">") {
            index += 2;
            return {
                type: Token.Punctuator,
                value: "=>",
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
    }

    if ("<>=!+-*%&|^/".indexOf(ch1) >= 0) {
        ++index;
        return {
            type: Token.Punctuator,
            value: ch1,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    if (ch1 === ".") {
        ++index;
        return {
            type: Token.Punctuator,
            value: ch1,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    throwError({}, Messages.UnexpectedToken, "ILLEGAL");
}

// 7.8.3 Numeric Literals

function scanHexLiteral(start) {
    var number = "";

    while (index < length) {
        if (!syntax.isHexDigit(source[index])) {
            break;
        }
        number += source[index++];
    }

    if (number.length === 0) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    if (syntax.isIdentifierStart(source.charCodeAt(index))) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    return {
        type: Token.NumericLiteral,
        value: parseInt("0x" + number, 16),
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

function scanBinaryLiteral(start) {
    var ch, number = "";

    while (index < length) {
        ch = source[index];
        if (ch !== "0" && ch !== "1") {
            break;
        }
        number += source[index++];
    }

    if (number.length === 0) {
        // only 0b or 0B
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }


    if (index < length) {
        ch = source.charCodeAt(index);
        /* istanbul ignore else */
        if (syntax.isIdentifierStart(ch) || syntax.isDecimalDigit(ch)) {
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
        }
    }

    return {
        type: Token.NumericLiteral,
        value: parseInt(number, 2),
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

function scanOctalLiteral(prefix, start) {
    var number, octal;

    if (syntax.isOctalDigit(prefix)) {
        octal = true;
        number = "0" + source[index++];
    } else {
        octal = false;
        ++index;
        number = "";
    }

    while (index < length) {
        if (!syntax.isOctalDigit(source[index])) {
            break;
        }
        number += source[index++];
    }

    if (!octal && number.length === 0) {
        // only 0o or 0O
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    if (syntax.isIdentifierStart(source.charCodeAt(index)) || syntax.isDecimalDigit(source.charCodeAt(index))) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    return {
        type: Token.NumericLiteral,
        value: parseInt(number, 8),
        octal: octal,
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

function scanNumericLiteral() {
    var number, start, ch;

    ch = source[index];
    assert(syntax.isDecimalDigit(ch.charCodeAt(0)) || (ch === "."),
        "Numeric literal must start with a decimal digit or a decimal point");

    start = index;
    number = "";
    if (ch !== ".") {
        number = source[index++];
        ch = source[index];

        // Hex number starts with "0x".
        // Octal number starts with "0".
        if (number === "0") {
            if (ch === "x" || ch === "X") {
                ++index;
                return scanHexLiteral(start);
            }

            // Binary number in ES6 starts with '0b'
            if (extra.ecmaFeatures.binaryLiterals) {
                if (ch === "b" || ch === "B") {
                    ++index;
                    return scanBinaryLiteral(start);
                }
            }

            if ((extra.ecmaFeatures.octalLiterals && (ch === "o" || ch === "O")) || syntax.isOctalDigit(ch)) {
                return scanOctalLiteral(ch, start);
            }

            // decimal number starts with "0" such as "09" is illegal.
            if (ch && syntax.isDecimalDigit(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
            }
        }

        while (syntax.isDecimalDigit(source.charCodeAt(index))) {
            number += source[index++];
        }
        ch = source[index];
    }

    if (ch === ".") {
        number += source[index++];
        while (syntax.isDecimalDigit(source.charCodeAt(index))) {
            number += source[index++];
        }
        ch = source[index];
    }

    if (ch === "e" || ch === "E") {
        number += source[index++];

        ch = source[index];
        if (ch === "+" || ch === "-") {
            number += source[index++];
        }
        if (syntax.isDecimalDigit(source.charCodeAt(index))) {
            while (syntax.isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
        } else {
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
        }
    }

    if (syntax.isIdentifierStart(source.charCodeAt(index))) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    return {
        type: Token.NumericLiteral,
        value: parseFloat(number),
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

/**
 * Scan a string escape sequence and return its special character.
 * @param {string} ch The starting character of the given sequence.
 * @returns {Object} An object containing the character and a flag
 * if the escape sequence was an octal.
 * @private
 */
function scanEscapeSequence(ch) {
    var code,
        unescaped,
        restore,
        escapedCh,
        octal = false;

    // An escape sequence cannot be empty
    if (!ch) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    if (syntax.isLineTerminator(ch.charCodeAt(0))) {
        ++lineNumber;
        if (ch === "\r" && source[index] === "\n") {
            ++index;
        }
        lineStart = index;
        escapedCh = "";
    } else if (ch === "u" && source[index] === "{") {
        // Handle ES6 extended unicode code point escape sequences.
        if (extra.ecmaFeatures.unicodeCodePointEscapes) {
            ++index;
            escapedCh = scanUnicodeCodePointEscape();
        } else {
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
        }
    } else if (ch === "u" || ch === "x") {
        // Handle other unicode and hex codes normally
        restore = index;
        unescaped = scanHexEscape(ch);
        if (unescaped) {
            escapedCh = unescaped;
        } else {
            index = restore;
            escapedCh = ch;
        }
    } else if (ch === "n") {
        escapedCh = "\n";
    } else if (ch === "r") {
        escapedCh = "\r";
    } else if (ch === "t") {
        escapedCh = "\t";
    } else if (ch === "b") {
        escapedCh = "\b";
    } else if (ch === "f") {
        escapedCh = "\f";
    } else if (ch === "v") {
        escapedCh = "\v";
    } else if (syntax.isOctalDigit(ch)) {
        code = "01234567".indexOf(ch);

        // \0 is not octal escape sequence
        if (code !== 0) {
            octal = true;
        }

        if (index < length && syntax.isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + "01234567".indexOf(source[index++]);

            // 3 digits are only allowed when string starts with 0, 1, 2, 3
            if ("0123".indexOf(ch) >= 0 &&
                    index < length &&
                    syntax.isOctalDigit(source[index])) {
                code = code * 8 + "01234567".indexOf(source[index++]);
            }
        }
        escapedCh = String.fromCharCode(code);
    } else {
        escapedCh = ch;
    }

    return {
        ch: escapedCh,
        octal: octal
    };
}

function scanStringLiteral() {
    var str = "",
        ch,
        escapedSequence,
        octal = false,
        start = index,
        startLineNumber = lineNumber,
        startLineStart = lineStart,
        quote = source[index];

    assert((quote === "'" || quote === "\""),
        "String literal must starts with a quote");

    ++index;

    while (index < length) {
        ch = source[index++];

        if (syntax.isLineTerminator(ch.charCodeAt(0))) {
            break;
        } else if (ch === quote) {
            quote = "";
            break;
        } else if (ch === "\\") {
            ch = source[index++];
            escapedSequence = scanEscapeSequence(ch);
            str += escapedSequence.ch;
            octal = escapedSequence.octal || octal;
        } else {
            str += ch;
        }
    }

    if (quote !== "") {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    return {
        type: Token.StringLiteral,
        value: str,
        octal: octal,
        startLineNumber: startLineNumber,
        startLineStart: startLineStart,
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

/**
 * Scan a template string and return a token. This scans both the first and
 * subsequent pieces of a template string and assumes that the first backtick
 * or the closing } have already been scanned.
 * @returns {Token} The template string token.
 * @private
 */
function scanTemplate() {
    var cooked = "",
        ch,
        escapedSequence,
        start = index,
        terminated = false,
        tail = false,
        head = (source[index] === "`");

    ++index;

    while (index < length) {
        ch = source[index++];

        if (ch === "`") {
            tail = true;
            terminated = true;
            break;
        } else if (ch === "$") {
            if (source[index] === "{") {
                ++index;
                terminated = true;
                break;
            }
            cooked += ch;
        } else if (ch === "\\") {
            ch = source[index++];
            escapedSequence = scanEscapeSequence(ch);

            if (escapedSequence.octal) {
                throwError({}, Messages.TemplateOctalLiteral);
            }

            cooked += escapedSequence.ch;

        } else if (syntax.isLineTerminator(ch.charCodeAt(0))) {
            ++lineNumber;
            if (ch === "\r" && source[index] === "\n") {
                ++index;
            }
            lineStart = index;
            cooked += "\n";
        } else {
            cooked += ch;
        }
    }

    if (!terminated) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    if (index > state.curlyLastIndex) {
        state.curlyLastIndex = index;

        if (!tail) {
            state.curlyStack.push("template");
        }

        if (!head) {
            state.curlyStack.pop();
        }
    }

    return {
        type: Token.Template,
        value: {
            cooked: cooked,
            raw: source.slice(start + 1, index - ((tail) ? 1 : 2))
        },
        head: head,
        tail: tail,
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

function testRegExp(pattern, flags) {
    var tmp = pattern,
        validFlags = "gmsi";

    if (extra.ecmaFeatures.regexYFlag) {
        validFlags += "y";
    }

    if (extra.ecmaFeatures.regexUFlag) {
        validFlags += "u";
    }

    if (!RegExp("^[" + validFlags + "]*$").test(flags)) {
        throwError({}, Messages.InvalidRegExpFlag);
    }


    if (flags.indexOf("u") >= 0) {
        // Replace each astral symbol and every Unicode code point
        // escape sequence with a single ASCII symbol to avoid throwing on
        // regular expressions that are only valid in combination with the
        // `/u` flag.
        // Note: replacing with the ASCII symbol `x` might cause false
        // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
        // perfectly valid pattern that is equivalent to `[a-b]`, but it
        // would be replaced by `[x-b]` which throws an error.
        tmp = tmp
            .replace(/\\u\{([0-9a-fA-F]+)\}/g, function ($0, $1) {
                if (parseInt($1, 16) <= 0x10FFFF) {
                    return "x";
                }
                throwError({}, Messages.InvalidRegExp);
            })
            .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
    }

    // First, detect invalid regular expressions.
    try {
        RegExp(tmp);
    } catch (e) {
        throwError({}, Messages.InvalidRegExp);
    }

    // Return a regular expression object for this pattern-flag pair, or
    // `null` in case the current environment doesn't support the flags it
    // uses.
    try {
        return new RegExp(pattern, flags);
    } catch (exception) {
        return null;
    }
}

function scanRegExpBody() {
    var ch, str, classMarker, terminated, body;

    ch = source[index];
    assert(ch === "/", "Regular expression literal must start with a slash");
    str = source[index++];

    classMarker = false;
    terminated = false;
    while (index < length) {
        ch = source[index++];
        str += ch;
        if (ch === "\\") {
            ch = source[index++];
            // ECMA-262 7.8.5
            if (syntax.isLineTerminator(ch.charCodeAt(0))) {
                throwError({}, Messages.UnterminatedRegExp);
            }
            str += ch;
        } else if (syntax.isLineTerminator(ch.charCodeAt(0))) {
            throwError({}, Messages.UnterminatedRegExp);
        } else if (classMarker) {
            if (ch === "]") {
                classMarker = false;
            }
        } else {
            if (ch === "/") {
                terminated = true;
                break;
            } else if (ch === "[") {
                classMarker = true;
            }
        }
    }

    if (!terminated) {
        throwError({}, Messages.UnterminatedRegExp);
    }

    // Exclude leading and trailing slash.
    body = str.substr(1, str.length - 2);
    return {
        value: body,
        literal: str
    };
}

function scanRegExpFlags() {
    var ch, str, flags, restore;

    str = "";
    flags = "";
    while (index < length) {
        ch = source[index];
        if (!syntax.isIdentifierPart(ch.charCodeAt(0))) {
            break;
        }

        ++index;
        if (ch === "\\" && index < length) {
            ch = source[index];
            if (ch === "u") {
                ++index;
                restore = index;
                ch = scanHexEscape("u");
                if (ch) {
                    flags += ch;
                    for (str += "\\u"; restore < index; ++restore) {
                        str += source[restore];
                    }
                } else {
                    index = restore;
                    flags += "u";
                    str += "\\u";
                }
                throwErrorTolerant({}, Messages.UnexpectedToken, "ILLEGAL");
            } else {
                str += "\\";
                throwErrorTolerant({}, Messages.UnexpectedToken, "ILLEGAL");
            }
        } else {
            flags += ch;
            str += ch;
        }
    }

    return {
        value: flags,
        literal: str
    };
}

function scanRegExp() {
    var start, body, flags, value;

    lookahead = null;
    skipComment();
    start = index;

    body = scanRegExpBody();
    flags = scanRegExpFlags();
    value = testRegExp(body.value, flags.value);

    if (extra.tokenize) {
        return {
            type: Token.RegularExpression,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    return {
        literal: body.literal + flags.literal,
        value: value,
        regex: {
            pattern: body.value,
            flags: flags.value
        },
        range: [start, index]
    };
}

function collectRegex() {
    var pos, loc, regex, token;

    skipComment();

    pos = index;
    loc = {
        start: {
            line: lineNumber,
            column: index - lineStart
        }
    };

    regex = scanRegExp();
    loc.end = {
        line: lineNumber,
        column: index - lineStart
    };

    /* istanbul ignore next */
    if (!extra.tokenize) {
        // Pop the previous token, which is likely "/" or "/="
        if (extra.tokens.length > 0) {
            token = extra.tokens[extra.tokens.length - 1];
            if (token.range[0] === pos && token.type === "Punctuator") {
                if (token.value === "/" || token.value === "/=") {
                    extra.tokens.pop();
                }
            }
        }

        extra.tokens.push({
            type: "RegularExpression",
            value: regex.literal,
            regex: regex.regex,
            range: [pos, index],
            loc: loc
        });
    }

    return regex;
}

function isIdentifierName(token) {
    return token.type === Token.Identifier ||
        token.type === Token.Keyword ||
        token.type === Token.BooleanLiteral ||
        token.type === Token.NullLiteral;
}

function advanceSlash() {
    var prevToken,
        checkToken;
    // Using the following algorithm:
    // https://github.com/mozilla/sweet.js/wiki/design
    prevToken = extra.tokens[extra.tokens.length - 1];
    if (!prevToken) {
        // Nothing before that: it cannot be a division.
        return collectRegex();
    }
    if (prevToken.type === "Punctuator") {
        if (prevToken.value === "]") {
            return scanPunctuator();
        }
        if (prevToken.value === ")") {
            checkToken = extra.tokens[extra.openParenToken - 1];
            if (checkToken &&
                    checkToken.type === "Keyword" &&
                    (checkToken.value === "if" ||
                     checkToken.value === "while" ||
                     checkToken.value === "for" ||
                     checkToken.value === "with")) {
                return collectRegex();
            }
            return scanPunctuator();
        }
        if (prevToken.value === "}") {
            // Dividing a function by anything makes little sense,
            // but we have to check for that.
            if (extra.tokens[extra.openCurlyToken - 3] &&
                    extra.tokens[extra.openCurlyToken - 3].type === "Keyword") {
                // Anonymous function.
                checkToken = extra.tokens[extra.openCurlyToken - 4];
                if (!checkToken) {
                    return scanPunctuator();
                }
            } else if (extra.tokens[extra.openCurlyToken - 4] &&
                    extra.tokens[extra.openCurlyToken - 4].type === "Keyword") {
                // Named function.
                checkToken = extra.tokens[extra.openCurlyToken - 5];
                if (!checkToken) {
                    return collectRegex();
                }
            } else {
                return scanPunctuator();
            }
            // checkToken determines whether the function is
            // a declaration or an expression.
            if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                // It is an expression.
                return scanPunctuator();
            }
            // It is a declaration.
            return collectRegex();
        }
        return collectRegex();
    }
    if (prevToken.type === "Keyword") {
        return collectRegex();
    }
    return scanPunctuator();
}

function advance() {
    var ch,
        allowJSX = extra.ecmaFeatures.jsx,
        allowTemplateStrings = extra.ecmaFeatures.templateStrings;

    /*
     * If JSX isn't allowed or JSX is allowed and we're not inside an JSX child,
     * then skip any comments.
     */
    if (!allowJSX || !state.inJSXChild) {
        skipComment();
    }

    if (index >= length) {
        return {
            type: Token.EOF,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [index, index]
        };
    }

    // if inside an JSX child, then abort regular tokenization
    if (allowJSX && state.inJSXChild) {
        return advanceJSXChild();
    }

    ch = source.charCodeAt(index);

    // Very common: ( and ) and ;
    if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
        return scanPunctuator();
    }

    // String literal starts with single quote (U+0027) or double quote (U+0022).
    if (ch === 0x27 || ch === 0x22) {
        if (allowJSX && state.inJSXTag) {
            return scanJSXStringLiteral();
        }

        return scanStringLiteral();
    }

    if (allowJSX && state.inJSXTag && syntax.isJSXIdentifierStart(ch)) {
        return scanJSXIdentifier();
    }

    // Template strings start with backtick (U+0096) or closing curly brace (125) and backtick.
    if (allowTemplateStrings) {

        // template strings start with backtick (96) or open curly (125) but only if the open
        // curly closes a previously opened curly from a template.
        if (ch === 96 || (ch === 125 && state.curlyStack[state.curlyStack.length - 1] === "template")) {
            return scanTemplate();
        }
    }

    if (syntax.isIdentifierStart(ch)) {
        return scanIdentifier();
    }

    // Dot (.) U+002E can also start a floating-point number, hence the need
    // to check the next character.
    if (ch === 0x2E) {
        if (syntax.isDecimalDigit(source.charCodeAt(index + 1))) {
            return scanNumericLiteral();
        }
        return scanPunctuator();
    }

    if (syntax.isDecimalDigit(ch)) {
        return scanNumericLiteral();
    }

    // Slash (/) U+002F can also start a regex.
    if (extra.tokenize && ch === 0x2F) {
        return advanceSlash();
    }

    return scanPunctuator();
}

function collectToken() {
    var loc, token, range, value, entry,
        allowJSX = extra.ecmaFeatures.jsx;

    /* istanbul ignore else */
    if (!allowJSX || !state.inJSXChild) {
        skipComment();
    }

    loc = {
        start: {
            line: lineNumber,
            column: index - lineStart
        }
    };

    token = advance();
    loc.end = {
        line: lineNumber,
        column: index - lineStart
    };

    if (token.type !== Token.EOF) {
        range = [token.range[0], token.range[1]];
        value = source.slice(token.range[0], token.range[1]);
        entry = {
            type: TokenName[token.type],
            value: value,
            range: range,
            loc: loc
        };
        if (token.regex) {
            entry.regex = {
                pattern: token.regex.pattern,
                flags: token.regex.flags
            };
        }
        extra.tokens.push(entry);
    }

    return token;
}

function lex() {
    var token;

    token = lookahead;
    index = token.range[1];
    lineNumber = token.lineNumber;
    lineStart = token.lineStart;

    lookahead = (typeof extra.tokens !== "undefined") ? collectToken() : advance();

    index = token.range[1];
    lineNumber = token.lineNumber;
    lineStart = token.lineStart;

    return token;
}

function peek() {
    var pos,
        line,
        start;

    pos = index;
    line = lineNumber;
    start = lineStart;

    lookahead = (typeof extra.tokens !== "undefined") ? collectToken() : advance();

    index = pos;
    lineNumber = line;
    lineStart = start;
}

function lookahead2() {
    var adv, pos, line, start, result;

    // If we are collecting the tokens, don't grab the next one yet.
    /* istanbul ignore next */
    adv = (typeof extra.advance === "function") ? extra.advance : advance;

    pos = index;
    line = lineNumber;
    start = lineStart;

    // Scan for the next immediate token.
    /* istanbul ignore if */
    if (lookahead === null) {
        lookahead = adv();
    }
    index = lookahead.range[1];
    lineNumber = lookahead.lineNumber;
    lineStart = lookahead.lineStart;

    // Grab the token right after.
    result = adv();
    index = pos;
    lineNumber = line;
    lineStart = start;

    return result;
}


//------------------------------------------------------------------------------
// JSX
//------------------------------------------------------------------------------

function getQualifiedJSXName(object) {
    if (object.type === astNodeTypes.JSXIdentifier) {
        return object.name;
    }
    if (object.type === astNodeTypes.JSXNamespacedName) {
        return object.namespace.name + ":" + object.name.name;
    }
    /* istanbul ignore else */
    if (object.type === astNodeTypes.JSXMemberExpression) {
        return (
            getQualifiedJSXName(object.object) + "." +
            getQualifiedJSXName(object.property)
        );
    }
    /* istanbul ignore next */
    throwUnexpected(object);
}

function scanJSXIdentifier() {
    var ch, start, value = "";

    start = index;
    while (index < length) {
        ch = source.charCodeAt(index);
        if (!syntax.isJSXIdentifierPart(ch)) {
            break;
        }
        value += source[index++];
    }

    return {
        type: Token.JSXIdentifier,
        value: value,
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

function scanJSXEntity() {
    var ch, str = "", start = index, count = 0, code;
    ch = source[index];
    assert(ch === "&", "Entity must start with an ampersand");
    index++;
    while (index < length && count++ < 10) {
        ch = source[index++];
        if (ch === ";") {
            break;
        }
        str += ch;
    }

    // Well-formed entity (ending was found).
    if (ch === ";") {
        // Numeric entity.
        if (str[0] === "#") {
            if (str[1] === "x") {
                code = +("0" + str.substr(1));
            } else {
                // Removing leading zeros in order to avoid treating as octal in old browsers.
                code = +str.substr(1).replace(Regex.LeadingZeros, "");
            }

            if (!isNaN(code)) {
                return String.fromCharCode(code);
            }
        /* istanbul ignore else */
        } else if (XHTMLEntities[str]) {
            return XHTMLEntities[str];
        }
    }

    // Treat non-entity sequences as regular text.
    index = start + 1;
    return "&";
}

function scanJSXText(stopChars) {
    var ch, str = "", start;
    start = index;
    while (index < length) {
        ch = source[index];
        if (stopChars.indexOf(ch) !== -1) {
            break;
        }
        if (ch === "&") {
            str += scanJSXEntity();
        } else {
            index++;
            if (ch === "\r" && source[index] === "\n") {
                str += ch;
                ch = source[index];
                index++;
            }
            if (syntax.isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                lineStart = index;
            }
            str += ch;
        }
    }
    return {
        type: Token.JSXText,
        value: str,
        lineNumber: lineNumber,
        lineStart: lineStart,
        range: [start, index]
    };
}

function scanJSXStringLiteral() {
    var innerToken, quote, start;

    quote = source[index];
    assert((quote === "\"" || quote === "'"),
        "String literal must starts with a quote");

    start = index;
    ++index;

    innerToken = scanJSXText([quote]);

    if (quote !== source[index]) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    ++index;

    innerToken.range = [start, index];

    return innerToken;
}

/*
 * Between JSX opening and closing tags (e.g. <foo>HERE</foo>), anything that
 * is not another JSX tag and is not an expression wrapped by {} is text.
 */
function advanceJSXChild() {
    var ch = source.charCodeAt(index);

    // { (123) and < (60)
    if (ch !== 123 && ch !== 60) {
        return scanJSXText(["<", "{"]);
    }

    return scanPunctuator();
}

function parseJSXIdentifier() {
    var token, marker = markerCreate();

    if (lookahead.type !== Token.JSXIdentifier) {
        throwUnexpected(lookahead);
    }

    token = lex();
    return markerApply(marker, astNodeFactory.createJSXIdentifier(token.value));
}

function parseJSXNamespacedName() {
    var namespace, name, marker = markerCreate();

    namespace = parseJSXIdentifier();
    expect(":");
    name = parseJSXIdentifier();

    return markerApply(marker, astNodeFactory.createJSXNamespacedName(namespace, name));
}

function parseJSXMemberExpression() {
    var marker = markerCreate(),
        expr = parseJSXIdentifier();

    while (match(".")) {
        lex();
        expr = markerApply(marker, astNodeFactory.createJSXMemberExpression(expr, parseJSXIdentifier()));
    }

    return expr;
}

function parseJSXElementName() {
    if (lookahead2().value === ":") {
        return parseJSXNamespacedName();
    }
    if (lookahead2().value === ".") {
        return parseJSXMemberExpression();
    }

    return parseJSXIdentifier();
}

function parseJSXAttributeName() {
    if (lookahead2().value === ":") {
        return parseJSXNamespacedName();
    }

    return parseJSXIdentifier();
}

function parseJSXAttributeValue() {
    var value, marker;
    if (match("{")) {
        value = parseJSXExpressionContainer();
        if (value.expression.type === astNodeTypes.JSXEmptyExpression) {
            throwError(
                value,
                "JSX attributes must only be assigned a non-empty " +
                    "expression"
            );
        }
    } else if (match("<")) {
        value = parseJSXElement();
    } else if (lookahead.type === Token.JSXText) {
        marker = markerCreate();
        value = markerApply(marker, astNodeFactory.createLiteralFromSource(lex(), source));
    } else {
        throwError({}, Messages.InvalidJSXAttributeValue);
    }
    return value;
}

function parseJSXEmptyExpression() {
    var marker = markerCreatePreserveWhitespace();
    while (source.charAt(index) !== "}") {
        index++;
    }
    return markerApply(marker, astNodeFactory.createJSXEmptyExpression());
}

function parseJSXExpressionContainer() {
    var expression, origInJSXChild, origInJSXTag, marker = markerCreate();

    origInJSXChild = state.inJSXChild;
    origInJSXTag = state.inJSXTag;
    state.inJSXChild = false;
    state.inJSXTag = false;

    expect("{");

    if (match("}")) {
        expression = parseJSXEmptyExpression();
    } else {
        expression = parseExpression();
    }

    state.inJSXChild = origInJSXChild;
    state.inJSXTag = origInJSXTag;

    expect("}");

    return markerApply(marker, astNodeFactory.createJSXExpressionContainer(expression));
}

function parseJSXSpreadAttribute() {
    var expression, origInJSXChild, origInJSXTag, marker = markerCreate();

    origInJSXChild = state.inJSXChild;
    origInJSXTag = state.inJSXTag;
    state.inJSXChild = false;
    state.inJSXTag = false;
    state.inJSXSpreadAttribute = true;

    expect("{");
    expect("...");

    state.inJSXSpreadAttribute = false;

    expression = parseAssignmentExpression();

    state.inJSXChild = origInJSXChild;
    state.inJSXTag = origInJSXTag;

    expect("}");

    return markerApply(marker, astNodeFactory.createJSXSpreadAttribute(expression));
}

function parseJSXAttribute() {
    var name, marker;

    if (match("{")) {
        return parseJSXSpreadAttribute();
    }

    marker = markerCreate();

    name = parseJSXAttributeName();

    // HTML empty attribute
    if (match("=")) {
        lex();
        return markerApply(marker, astNodeFactory.createJSXAttribute(name, parseJSXAttributeValue()));
    }

    return markerApply(marker, astNodeFactory.createJSXAttribute(name));
}

function parseJSXChild() {
    var token, marker;
    if (match("{")) {
        token = parseJSXExpressionContainer();
    } else if (lookahead.type === Token.JSXText) {
        marker = markerCreatePreserveWhitespace();
        token = markerApply(marker, astNodeFactory.createLiteralFromSource(lex(), source));
    } else {
        token = parseJSXElement();
    }
    return token;
}

function parseJSXClosingElement() {
    var name, origInJSXChild, origInJSXTag, marker = markerCreate();
    origInJSXChild = state.inJSXChild;
    origInJSXTag = state.inJSXTag;
    state.inJSXChild = false;
    state.inJSXTag = true;
    expect("<");
    expect("/");
    name = parseJSXElementName();
    // Because advance() (called by lex() called by expect()) expects there
    // to be a valid token after >, it needs to know whether to look for a
    // standard JS token or an JSX text node
    state.inJSXChild = origInJSXChild;
    state.inJSXTag = origInJSXTag;
    expect(">");
    return markerApply(marker, astNodeFactory.createJSXClosingElement(name));
}

function parseJSXOpeningElement() {
    var name, attributes = [], selfClosing = false, origInJSXChild,
        origInJSXTag, marker = markerCreate();

    origInJSXChild = state.inJSXChild;
    origInJSXTag = state.inJSXTag;
    state.inJSXChild = false;
    state.inJSXTag = true;

    expect("<");

    name = parseJSXElementName();

    while (index < length &&
            lookahead.value !== "/" &&
            lookahead.value !== ">") {
        attributes.push(parseJSXAttribute());
    }

    state.inJSXTag = origInJSXTag;

    if (lookahead.value === "/") {
        expect("/");
        // Because advance() (called by lex() called by expect()) expects
        // there to be a valid token after >, it needs to know whether to
        // look for a standard JS token or an JSX text node
        state.inJSXChild = origInJSXChild;
        expect(">");
        selfClosing = true;
    } else {
        state.inJSXChild = true;
        expect(">");
    }
    return markerApply(marker, astNodeFactory.createJSXOpeningElement(name, attributes, selfClosing));
}

function parseJSXElement() {
    var openingElement, closingElement = null, children = [], origInJSXChild, origInJSXTag, marker = markerCreate();

    origInJSXChild = state.inJSXChild;
    origInJSXTag = state.inJSXTag;
    openingElement = parseJSXOpeningElement();

    if (!openingElement.selfClosing) {
        while (index < length) {
            state.inJSXChild = false; // Call lookahead2() with inJSXChild = false because </ should not be considered in the child
            if (lookahead.value === "<" && lookahead2().value === "/") {
                break;
            }
            state.inJSXChild = true;
            children.push(parseJSXChild());
        }
        state.inJSXChild = origInJSXChild;
        state.inJSXTag = origInJSXTag;
        closingElement = parseJSXClosingElement();
        if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
            throwError({}, Messages.ExpectedJSXClosingTag, getQualifiedJSXName(openingElement.name));
        }
    }

    /*
     * When (erroneously) writing two adjacent tags like
     *
     *     var x = <div>one</div><div>two</div>;
     *
     * the default error message is a bit incomprehensible. Since it"s
     * rarely (never?) useful to write a less-than sign after an JSX
     * element, we disallow it here in the parser in order to provide a
     * better error message. (In the rare case that the less-than operator
     * was intended, the left tag can be wrapped in parentheses.)
     */
    if (!origInJSXChild && match("<")) {
        throwError(lookahead, Messages.AdjacentJSXElements);
    }

    return markerApply(marker, astNodeFactory.createJSXElement(openingElement, closingElement, children));
}

//------------------------------------------------------------------------------
// Location markers
//------------------------------------------------------------------------------

/**
 * Applies location information to the given node by using the given marker.
 * The marker indicates the point at which the node is said to have to begun
 * in the source code.
 * @param {Object} marker The marker to use for the node.
 * @param {ASTNode} node The AST node to apply location information to.
 * @returns {ASTNode} The node that was passed in.
 * @private
 */
function markerApply(marker, node) {

    // add range information to the node if present
    if (extra.range) {
        node.range = [marker.offset, index];
    }

    // add location information the node if present
    if (extra.loc) {
        node.loc = {
            start: {
                line: marker.line,
                column: marker.col
            },
            end: {
                line: lineNumber,
                column: index - lineStart
            }
        };
        // Attach extra.source information to the location, if present
        if (extra.source) {
            node.loc.source = extra.source;
        }
    }

    // attach leading and trailing comments if requested
    if (extra.attachComment) {
        commentAttachment.processComment(node);
    }

    return node;
}

/**
 * Creates a location marker in the source code. Location markers are used for
 * tracking where tokens and nodes appear in the source code.
 * @returns {Object} A marker object or undefined if the parser doesn't have
 *      any location information.
 * @private
 */
function markerCreate() {

    if (!extra.loc && !extra.range) {
        return undefined;
    }

    skipComment();

    return {
        offset: index,
        line: lineNumber,
        col: index - lineStart
    };
}

/**
 * Creates a location marker in the source code. Location markers are used for
 * tracking where tokens and nodes appear in the source code. This method
 * doesn't skip comments or extra whitespace which is important for JSX.
 * @returns {Object} A marker object or undefined if the parser doesn't have
 *      any location information.
 * @private
 */
function markerCreatePreserveWhitespace() {

    if (!extra.loc && !extra.range) {
        return undefined;
    }

    return {
        offset: index,
        line: lineNumber,
        col: index - lineStart
    };
}


//------------------------------------------------------------------------------
// Syntax Tree Delegate
//------------------------------------------------------------------------------

// Return true if there is a line terminator before the next token.

function peekLineTerminator() {
    var pos, line, start, found;

    pos = index;
    line = lineNumber;
    start = lineStart;
    skipComment();
    found = lineNumber !== line;
    index = pos;
    lineNumber = line;
    lineStart = start;

    return found;
}

// Throw an exception

function throwError(token, messageFormat) {

    var error,
        args = Array.prototype.slice.call(arguments, 2),
        msg = messageFormat.replace(
            /%(\d)/g,
            function (whole, index) {
                assert(index < args.length, "Message reference must be in range");
                return args[index];
            }
        );

    if (typeof token.lineNumber === "number") {
        error = new Error("Line " + token.lineNumber + ": " + msg);
        error.index = token.range[0];
        error.lineNumber = token.lineNumber;
        error.column = token.range[0] - lineStart + 1;
    } else {
        error = new Error("Line " + lineNumber + ": " + msg);
        error.index = index;
        error.lineNumber = lineNumber;
        error.column = index - lineStart + 1;
    }

    error.description = msg;
    throw error;
}

function throwErrorTolerant() {
    try {
        throwError.apply(null, arguments);
    } catch (e) {
        if (extra.errors) {
            extra.errors.push(e);
        } else {
            throw e;
        }
    }
}


// Throw an exception because of the token.

function throwUnexpected(token) {

    if (token.type === Token.EOF) {
        throwError(token, Messages.UnexpectedEOS);
    }

    if (token.type === Token.NumericLiteral) {
        throwError(token, Messages.UnexpectedNumber);
    }

    if (token.type === Token.StringLiteral || token.type === Token.JSXText) {
        throwError(token, Messages.UnexpectedString);
    }

    if (token.type === Token.Identifier) {
        throwError(token, Messages.UnexpectedIdentifier);
    }

    if (token.type === Token.Keyword) {
        if (syntax.isFutureReservedWord(token.value)) {
            throwError(token, Messages.UnexpectedReserved);
        } else if (strict && syntax.isStrictModeReservedWord(token.value)) {
            throwErrorTolerant(token, Messages.StrictReservedWord);
            return;
        }
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    if (token.type === Token.Template) {
        throwError(token, Messages.UnexpectedTemplate, token.value.raw);
    }

    // BooleanLiteral, NullLiteral, or Punctuator.
    throwError(token, Messages.UnexpectedToken, token.value);
}

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
    var token = lex();
    if (token.type !== Token.Punctuator || token.value !== value) {
        throwUnexpected(token);
    }
}

// Expect the next token to match the specified keyword.
// If not, an exception will be thrown.

function expectKeyword(keyword) {
    var token = lex();
    if (token.type !== Token.Keyword || token.value !== keyword) {
        throwUnexpected(token);
    }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
    return lookahead.type === Token.Punctuator && lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
    return lookahead.type === Token.Keyword && lookahead.value === keyword;
}

// Return true if the next token matches the specified contextual keyword
// (where an identifier is sometimes a keyword depending on the context)

function matchContextualKeyword(keyword) {
    return lookahead.type === Token.Identifier && lookahead.value === keyword;
}

// Return true if the next token is an assignment operator

function matchAssign() {
    var op;

    if (lookahead.type !== Token.Punctuator) {
        return false;
    }
    op = lookahead.value;
    return op === "=" ||
        op === "*=" ||
        op === "/=" ||
        op === "%=" ||
        op === "+=" ||
        op === "-=" ||
        op === "<<=" ||
        op === ">>=" ||
        op === ">>>=" ||
        op === "&=" ||
        op === "^=" ||
        op === "|=";
}

function consumeSemicolon() {
    var line;

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (source.charCodeAt(index) === 0x3B || match(";")) {
        lex();
        return;
    }

    line = lineNumber;
    skipComment();
    if (lineNumber !== line) {
        return;
    }

    if (lookahead.type !== Token.EOF && !match("}")) {
        throwUnexpected(lookahead);
    }
}

// Return true if provided expression is LeftHandSideExpression

function isLeftHandSide(expr) {
    return expr.type === astNodeTypes.Identifier || expr.type === astNodeTypes.MemberExpression;
}

// 11.1.4 Array Initialiser

function parseArrayInitialiser() {
    var elements = [],
        marker = markerCreate(),
        tmp;

    expect("[");

    while (!match("]")) {
        if (match(",")) {
            lex(); // only get here when you have [a,,] or similar
            elements.push(null);
        } else {
            tmp = parseSpreadOrAssignmentExpression();
            elements.push(tmp);
            if (!(match("]"))) {
                expect(","); // handles the common case of comma-separated values
            }
        }
    }

    expect("]");

    return markerApply(marker, astNodeFactory.createArrayExpression(elements));
}

// 11.1.5 Object Initialiser

function parsePropertyFunction(paramInfo, options) {
    var previousStrict = strict,
        previousYieldAllowed = state.yieldAllowed,
        generator = options ? options.generator : false,
        body;

    state.yieldAllowed = generator;

    /*
     * Esprima uses parseConciseBody() here, which is incorrect. Object literal
     * methods must have braces.
     */
    body = parseFunctionSourceElements();

    if (strict && paramInfo.firstRestricted) {
        throwErrorTolerant(paramInfo.firstRestricted, Messages.StrictParamName);
    }

    if (strict && paramInfo.stricted) {
        throwErrorTolerant(paramInfo.stricted, paramInfo.message);
    }

    strict = previousStrict;
    state.yieldAllowed = previousYieldAllowed;

    return markerApply(options.marker, astNodeFactory.createFunctionExpression(
        null,
        paramInfo.params,
        paramInfo.defaults,
        body,
        paramInfo.rest,
        generator,
        body.type !== astNodeTypes.BlockStatement
    ));
}

function parsePropertyMethodFunction(options) {
    var previousStrict = strict,
        marker = markerCreate(),
        params,
        method;

    strict = true;

    params = parseParams();

    if (params.stricted) {
        throwErrorTolerant(params.stricted, params.message);
    }

    method = parsePropertyFunction(params, {
        generator: options ? options.generator : false,
        marker: marker
    });

    strict = previousStrict;

    return method;
}

function parseObjectPropertyKey() {
    var marker = markerCreate(),
        token = lex(),
        allowObjectLiteralComputed = extra.ecmaFeatures.objectLiteralComputedProperties,
        expr,
        result;

    // Note: This function is called only from parseObjectProperty(), where
    // EOF and Punctuator tokens are already filtered out.

    switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return markerApply(marker, astNodeFactory.createLiteralFromSource(token, source));

        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return markerApply(marker, astNodeFactory.createIdentifier(token.value));

        case Token.Punctuator:
            if ((!state.inObjectLiteral || allowObjectLiteralComputed) &&
                    token.value === "[") {
                // For computed properties we should skip the [ and ], and
                // capture in marker only the assignment expression itself.
                marker = markerCreate();
                expr = parseAssignmentExpression();
                result = markerApply(marker, expr);
                expect("]");
                return result;
            }

        // no default
    }

    throwUnexpected(token);
}

function lookaheadPropertyName() {
    switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === "[";
        // no default
    }
    return false;
}

// This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
// it might be called at a position where there is in fact a short hand identifier pattern or a data property.
// This can only be determined after we consumed up to the left parentheses.
// In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
// is responsible to visit other options.
function tryParseMethodDefinition(token, key, computed, marker) {
    var value, options, methodMarker;

    if (token.type === Token.Identifier) {
        // check for `get` and `set`;

        if (token.value === "get" && lookaheadPropertyName()) {

            computed = match("[");
            key = parseObjectPropertyKey();
            methodMarker = markerCreate();
            expect("(");
            expect(")");

            value = parsePropertyFunction({
                params: [],
                defaults: [],
                stricted: null,
                firstRestricted: null,
                message: null,
                rest: null
            }, {
                marker: methodMarker
            });

            return markerApply(marker, astNodeFactory.createProperty("get", key, value, false, false, computed));

        } else if (token.value === "set" && lookaheadPropertyName()) {
            computed = match("[");
            key = parseObjectPropertyKey();
            methodMarker = markerCreate();
            expect("(");

            options = {
                params: [],
                defaultCount: 0,
                defaults: [],
                stricted: null,
                firstRestricted: null,
                paramSet: new StringMap(),
                rest: null
            };
            if (match(")")) {
                throwErrorTolerant(lookahead, Messages.UnexpectedToken, lookahead.value);
            } else {
                parseParam(options);
                if (options.defaultCount === 0) {
                    options.defaults = [];
                }
            }
            expect(")");

            value = parsePropertyFunction(options, { marker: methodMarker });
            return markerApply(marker, astNodeFactory.createProperty("set", key, value, false, false, computed));
        }
    }

    if (match("(")) {
        value = parsePropertyMethodFunction();
        return markerApply(marker, astNodeFactory.createProperty("init", key, value, true, false, computed));
    }

    // Not a MethodDefinition.
    return null;
}

/**
 * Parses Generator Properties
 * @param {ASTNode} key The property key (usually an identifier).
 * @param {Object} marker The marker to use for the node.
 * @returns {ASTNode} The generator property node.
 */
function parseGeneratorProperty(key, marker) {

    var computed = (lookahead.type === Token.Punctuator && lookahead.value === "[");

    if (!match("(")) {
        throwUnexpected(lex());
    }

    return markerApply(
        marker,
        astNodeFactory.createProperty(
            "init",
            key,
            parsePropertyMethodFunction({ generator: true }),
            true,
            false,
            computed
        )
    );
}

// TODO(nzakas): Update to match Esprima
function parseObjectProperty() {
    var token, key, id, computed, methodMarker, options;
    var allowComputed = extra.ecmaFeatures.objectLiteralComputedProperties,
        allowMethod = extra.ecmaFeatures.objectLiteralShorthandMethods,
        allowShorthand = extra.ecmaFeatures.objectLiteralShorthandProperties,
        allowGenerators = extra.ecmaFeatures.generators,
        allowDestructuring = extra.ecmaFeatures.destructuring,
        marker = markerCreate();

    token = lookahead;
    computed = (token.value === "[" && token.type === Token.Punctuator);

    if (token.type === Token.Identifier || (allowComputed && computed)) {

        id = parseObjectPropertyKey();

        /*
         * Check for getters and setters. Be careful! "get" and "set" are legal
         * method names. It's only a getter or setter if followed by a space.
         */
        if (token.value === "get" &&
                !(match(":") || match("(") || match(",") || match("}"))) {
            computed = (lookahead.value === "[");
            key = parseObjectPropertyKey();
            methodMarker = markerCreate();
            expect("(");
            expect(")");

            return markerApply(
                marker,
                astNodeFactory.createProperty(
                    "get",
                    key,
                    parsePropertyFunction({
                        generator: false
                    }, {
                        marker: methodMarker
                    }),
                    false,
                    false,
                    computed
                )
            );
        }

        if (token.value === "set" &&
                !(match(":") || match("(") || match(",") || match("}"))) {
            computed = (lookahead.value === "[");
            key = parseObjectPropertyKey();
            methodMarker = markerCreate();
            expect("(");

            options = {
                params: [],
                defaultCount: 0,
                defaults: [],
                stricted: null,
                firstRestricted: null,
                paramSet: new StringMap(),
                rest: null
            };

            if (match(")")) {
                throwErrorTolerant(lookahead, Messages.UnexpectedToken, lookahead.value);
            } else {
                parseParam(options);
                if (options.defaultCount === 0) {
                    options.defaults = [];
                }
            }

            expect(")");

            return markerApply(
                marker,
                astNodeFactory.createProperty(
                    "set",
                    key,
                    parsePropertyFunction(options, {
                        marker: methodMarker
                    }),
                    false,
                    false,
                    computed
                )
            );
        }

        // normal property (key:value)
        if (match(":")) {
            lex();
            return markerApply(
                marker,
                astNodeFactory.createProperty(
                    "init",
                    id,
                    parseAssignmentExpression(),
                    false,
                    false,
                    computed
                )
            );
        }

        // method shorthand (key(){...})
        if (allowMethod && match("(")) {
            return markerApply(
                marker,
                astNodeFactory.createProperty(
                    "init",
                    id,
                    parsePropertyMethodFunction({ generator: false }),
                    true,
                    false,
                    computed
                )
            );
        }

        // destructuring defaults (shorthand syntax)
        if (allowDestructuring && match("=")) {
            lex();
            var value = parseAssignmentExpression();
            var prop = markerApply(marker, astNodeFactory.createAssignmentExpression("=", id, value));
            prop.type = astNodeTypes.AssignmentPattern;
            var fullProperty = astNodeFactory.createProperty(
                "init",
                id,
                prop,
                false,
                true, // shorthand
                computed
            );
            return markerApply(marker, fullProperty);
        }

        /*
         * Only other possibility is that this is a shorthand property. Computed
         * properties cannot use shorthand notation, so that's a syntax error.
         * If shorthand properties aren't allow, then this is an automatic
         * syntax error. Destructuring is another case with a similar shorthand syntax.
         */
        if (computed || (!allowShorthand && !allowDestructuring)) {
            throwUnexpected(lookahead);
        }

        // shorthand property
        return markerApply(
            marker,
            astNodeFactory.createProperty(
                "init",
                id,
                id,
                false,
                true,
                false
            )
        );
    }

    // only possibility in this branch is a shorthand generator
    if (token.type === Token.EOF || token.type === Token.Punctuator) {
        if (!allowGenerators || !match("*") || !allowMethod) {
            throwUnexpected(token);
        }

        lex();

        id = parseObjectPropertyKey();

        return parseGeneratorProperty(id, marker);

    }

    /*
     * If we've made it here, then that means the property name is represented
     * by a string (i.e, { "foo": 2}). The only options here are normal
     * property with a colon or a method.
     */
    key = parseObjectPropertyKey();

    // check for property value
    if (match(":")) {
        lex();
        return markerApply(
            marker,
            astNodeFactory.createProperty(
                "init",
                key,
                parseAssignmentExpression(),
                false,
                false,
                false
            )
        );
    }

    // check for method
    if (allowMethod && match("(")) {
        return markerApply(
            marker,
            astNodeFactory.createProperty(
                "init",
                key,
                parsePropertyMethodFunction(),
                true,
                false,
                false
            )
        );
    }

    // no other options, this is bad
    throwUnexpected(lex());
}

function getFieldName(key) {
    var toString = String;
    if (key.type === astNodeTypes.Identifier) {
        return key.name;
    }
    return toString(key.value);
}

function parseObjectInitialiser() {
    var marker = markerCreate(),
        allowDuplicates = extra.ecmaFeatures.objectLiteralDuplicateProperties,
        properties = [],
        property,
        name,
        propertyFn,
        kind,
        storedKind,
        previousInObjectLiteral = state.inObjectLiteral,
        kindMap = new StringMap();

    state.inObjectLiteral = true;

    expect("{");

    while (!match("}")) {

        property = parseObjectProperty();

        if (!property.computed) {

            name = getFieldName(property.key);
            propertyFn = (property.kind === "get") ? PropertyKind.Get : PropertyKind.Set;
            kind = (property.kind === "init") ? PropertyKind.Data : propertyFn;

            if (kindMap.has(name)) {
                storedKind = kindMap.get(name);
                if (storedKind === PropertyKind.Data) {
                    if (kind === PropertyKind.Data && name === "__proto__" && allowDuplicates) {
                        // Duplicate '__proto__' literal properties are forbidden in ES 6
                        throwErrorTolerant({}, Messages.DuplicatePrototypeProperty);
                    } else if (strict && kind === PropertyKind.Data && !allowDuplicates) {
                        // Duplicate literal properties are only forbidden in ES 5 strict mode
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (storedKind & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                kindMap.set(name, storedKind | kind);
            } else {
                kindMap.set(name, kind);
            }
        }

        properties.push(property);

        if (!match("}")) {
            expect(",");
        }
    }

    expect("}");

    state.inObjectLiteral = previousInObjectLiteral;

    return markerApply(marker, astNodeFactory.createObjectExpression(properties));
}

/**
 * Parse a template string element and return its ASTNode representation
 * @param {Object} option Parsing & scanning options
 * @param {Object} option.head True if this element is the first in the
 *                               template string, false otherwise.
 * @returns {ASTNode} The template element node with marker info applied
 * @private
 */
function parseTemplateElement(option) {
    var marker, token;

    if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
    }

    marker = markerCreate();
    token = lex();

    return markerApply(
        marker,
        astNodeFactory.createTemplateElement(
            {
                raw: token.value.raw,
                cooked: token.value.cooked
            },
            token.tail
        )
    );
}

/**
 * Parse a template string literal and return its ASTNode representation
 * @returns {ASTNode} The template literal node with marker info applied
 * @private
 */
function parseTemplateLiteral() {
    var quasi, quasis, expressions, marker = markerCreate();

    quasi = parseTemplateElement({ head: true });
    quasis = [ quasi ];
    expressions = [];

    while (!quasi.tail) {
        expressions.push(parseExpression());
        quasi = parseTemplateElement({ head: false });
        quasis.push(quasi);
    }

    return markerApply(marker, astNodeFactory.createTemplateLiteral(quasis, expressions));
}

// 11.1.6 The Grouping Operator

function parseGroupExpression() {
    var expr;

    expect("(");

    ++state.parenthesisCount;

    expr = parseExpression();

    expect(")");

    return expr;
}


// 11.1 Primary Expressions

function parsePrimaryExpression() {
    var type, token, expr,
        marker,
        allowJSX = extra.ecmaFeatures.jsx,
        allowClasses = extra.ecmaFeatures.classes,
        allowSuper = allowClasses || extra.ecmaFeatures.superInFunctions;

    if (match("(")) {
        return parseGroupExpression();
    }

    if (match("[")) {
        return parseArrayInitialiser();
    }

    if (match("{")) {
        return parseObjectInitialiser();
    }

    if (allowJSX && match("<")) {
        return parseJSXElement();
    }

    type = lookahead.type;
    marker = markerCreate();

    if (type === Token.Identifier) {
        expr = astNodeFactory.createIdentifier(lex().value);
    } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
        if (strict && lookahead.octal) {
            throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
        }
        expr = astNodeFactory.createLiteralFromSource(lex(), source);
    } else if (type === Token.Keyword) {
        if (matchKeyword("function")) {
            return parseFunctionExpression();
        }

        if (allowSuper && matchKeyword("super") && state.inFunctionBody) {
            marker = markerCreate();
            lex();
            return markerApply(marker, astNodeFactory.createIdentifier("super"));
        }

        if (matchKeyword("this")) {
            marker = markerCreate();
            lex();
            return markerApply(marker, astNodeFactory.createThisExpression());
        }

        if (allowClasses && matchKeyword("class")) {
            return parseClassExpression();
        }

        throwUnexpected(lex());
    } else if (type === Token.BooleanLiteral) {
        token = lex();
        token.value = (token.value === "true");
        expr = astNodeFactory.createLiteralFromSource(token, source);
    } else if (type === Token.NullLiteral) {
        token = lex();
        token.value = null;
        expr = astNodeFactory.createLiteralFromSource(token, source);
    } else if (match("/") || match("/=")) {
        if (typeof extra.tokens !== "undefined") {
            expr = astNodeFactory.createLiteralFromSource(collectRegex(), source);
        } else {
            expr = astNodeFactory.createLiteralFromSource(scanRegExp(), source);
        }
        peek();
    } else if (type === Token.Template) {
        return parseTemplateLiteral();
    } else {
       throwUnexpected(lex());
    }

    return markerApply(marker, expr);
}

// 11.2 Left-Hand-Side Expressions

function parseArguments() {
    var args = [], arg;

    expect("(");

    if (!match(")")) {
        while (index < length) {
            arg = parseSpreadOrAssignmentExpression();
            args.push(arg);

            if (match(")")) {
                break;
            }

            expect(",");
        }
    }

    expect(")");

    return args;
}

function parseSpreadOrAssignmentExpression() {
    if (match("...")) {
        var marker = markerCreate();
        lex();
        return markerApply(marker, astNodeFactory.createSpreadElement(parseAssignmentExpression()));
    }
    return parseAssignmentExpression();
}

function parseNonComputedProperty() {
    var token,
        marker = markerCreate();

    token = lex();

    if (!isIdentifierName(token)) {
        throwUnexpected(token);
    }

    return markerApply(marker, astNodeFactory.createIdentifier(token.value));
}

function parseNonComputedMember() {
    expect(".");

    return parseNonComputedProperty();
}

function parseComputedMember() {
    var expr;

    expect("[");

    expr = parseExpression();

    expect("]");

    return expr;
}

function parseNewExpression() {
    var callee, args,
        marker = markerCreate();

    expectKeyword("new");
    callee = parseLeftHandSideExpression();
    args = match("(") ? parseArguments() : [];

    return markerApply(marker, astNodeFactory.createNewExpression(callee, args));
}

function parseLeftHandSideExpressionAllowCall() {
    var expr, args,
        previousAllowIn = state.allowIn,
        marker = markerCreate();

    state.allowIn = true;
    expr = matchKeyword("new") ? parseNewExpression() : parsePrimaryExpression();
    state.allowIn = previousAllowIn;

    // only start parsing template literal if the lookahead is a head (beginning with `)
    while (match(".") || match("[") || match("(") || (lookahead.type === Token.Template && lookahead.head)) {
        if (match("(")) {
            args = parseArguments();
            expr = markerApply(marker, astNodeFactory.createCallExpression(expr, args));
        } else if (match("[")) {
            expr = markerApply(marker, astNodeFactory.createMemberExpression("[", expr, parseComputedMember()));
        } else if (match(".")) {
            expr = markerApply(marker, astNodeFactory.createMemberExpression(".", expr, parseNonComputedMember()));
        } else {
            expr = markerApply(marker, astNodeFactory.createTaggedTemplateExpression(expr, parseTemplateLiteral()));
        }
    }

    return expr;
}

function parseLeftHandSideExpression() {
    var expr,
        previousAllowIn = state.allowIn,
        marker = markerCreate();

    expr = matchKeyword("new") ? parseNewExpression() : parsePrimaryExpression();
    state.allowIn = previousAllowIn;

    // only start parsing template literal if the lookahead is a head (beginning with `)
    while (match(".") || match("[") || (lookahead.type === Token.Template && lookahead.head)) {
        if (match("[")) {
            expr = markerApply(marker, astNodeFactory.createMemberExpression("[", expr, parseComputedMember()));
        } else if (match(".")) {
            expr = markerApply(marker, astNodeFactory.createMemberExpression(".", expr, parseNonComputedMember()));
        } else {
            expr = markerApply(marker, astNodeFactory.createTaggedTemplateExpression(expr, parseTemplateLiteral()));
        }
    }

    return expr;
}


// 11.3 Postfix Expressions

function parsePostfixExpression() {
    var expr, token,
        marker = markerCreate();

    expr = parseLeftHandSideExpressionAllowCall();

    if (lookahead.type === Token.Punctuator) {
        if ((match("++") || match("--")) && !peekLineTerminator()) {
            // 11.3.1, 11.3.2
            if (strict && expr.type === astNodeTypes.Identifier && syntax.isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPostfix);
            }

            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            token = lex();
            expr = markerApply(marker, astNodeFactory.createPostfixExpression(token.value, expr));
        }
    }

    return expr;
}

// 11.4 Unary Operators

function parseUnaryExpression() {
    var token, expr,
        marker;

    if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
        expr = parsePostfixExpression();
    } else if (match("++") || match("--")) {
        marker = markerCreate();
        token = lex();
        expr = parseUnaryExpression();
        // 11.4.4, 11.4.5
        if (strict && expr.type === astNodeTypes.Identifier && syntax.isRestrictedWord(expr.name)) {
            throwErrorTolerant({}, Messages.StrictLHSPrefix);
        }

        if (!isLeftHandSide(expr)) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
        }

        expr = astNodeFactory.createUnaryExpression(token.value, expr);
        expr = markerApply(marker, expr);
    } else if (match("+") || match("-") || match("~") || match("!")) {
        marker = markerCreate();
        token = lex();
        expr = parseUnaryExpression();
        expr = astNodeFactory.createUnaryExpression(token.value, expr);
        expr = markerApply(marker, expr);
    } else if (matchKeyword("delete") || matchKeyword("void") || matchKeyword("typeof")) {
        marker = markerCreate();
        token = lex();
        expr = parseUnaryExpression();
        expr = astNodeFactory.createUnaryExpression(token.value, expr);
        expr = markerApply(marker, expr);
        if (strict && expr.operator === "delete" && expr.argument.type === astNodeTypes.Identifier) {
            throwErrorTolerant({}, Messages.StrictDelete);
        }
    } else {
        expr = parsePostfixExpression();
    }

    return expr;
}

function binaryPrecedence(token, allowIn) {
    var prec = 0;

    if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
        return 0;
    }

    switch (token.value) {
    case "||":
        prec = 1;
        break;

    case "&&":
        prec = 2;
        break;

    case "|":
        prec = 3;
        break;

    case "^":
        prec = 4;
        break;

    case "&":
        prec = 5;
        break;

    case "==":
    case "!=":
    case "===":
    case "!==":
        prec = 6;
        break;

    case "<":
    case ">":
    case "<=":
    case ">=":
    case "instanceof":
        prec = 7;
        break;

    case "in":
        prec = allowIn ? 7 : 0;
        break;

    case "<<":
    case ">>":
    case ">>>":
        prec = 8;
        break;

    case "+":
    case "-":
        prec = 9;
        break;

    case "*":
    case "/":
    case "%":
        prec = 11;
        break;

    default:
        break;
    }

    return prec;
}

// 11.5 Multiplicative Operators
// 11.6 Additive Operators
// 11.7 Bitwise Shift Operators
// 11.8 Relational Operators
// 11.9 Equality Operators
// 11.10 Binary Bitwise Operators
// 11.11 Binary Logical Operators
function parseBinaryExpression() {
    var expr, token, prec, previousAllowIn, stack, right, operator, left, i,
        marker, markers;

    previousAllowIn = state.allowIn;
    state.allowIn = true;

    marker = markerCreate();
    left = parseUnaryExpression();

    token = lookahead;
    prec = binaryPrecedence(token, previousAllowIn);
    if (prec === 0) {
        return left;
    }
    token.prec = prec;
    lex();

    markers = [marker, markerCreate()];
    right = parseUnaryExpression();

    stack = [left, token, right];

    while ((prec = binaryPrecedence(lookahead, previousAllowIn)) > 0) {

        // Reduce: make a binary expression from the three topmost entries.
        while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
            right = stack.pop();
            operator = stack.pop().value;
            left = stack.pop();
            expr = astNodeFactory.createBinaryExpression(operator, left, right);
            markers.pop();
            marker = markers.pop();
            markerApply(marker, expr);
            stack.push(expr);
            markers.push(marker);
        }

        // Shift.
        token = lex();
        token.prec = prec;
        stack.push(token);
        markers.push(markerCreate());
        expr = parseUnaryExpression();
        stack.push(expr);
    }

    state.allowIn = previousAllowIn;

    // Final reduce to clean-up the stack.
    i = stack.length - 1;
    expr = stack[i];
    markers.pop();
    while (i > 1) {
        expr = astNodeFactory.createBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
        i -= 2;
        marker = markers.pop();
        markerApply(marker, expr);
    }

    return expr;
}

// 11.12 Conditional Operator

function parseConditionalExpression() {
    var expr, previousAllowIn, consequent, alternate,
        marker = markerCreate();

    expr = parseBinaryExpression();

    if (match("?")) {
        lex();
        previousAllowIn = state.allowIn;
        state.allowIn = true;
        consequent = parseAssignmentExpression();
        state.allowIn = previousAllowIn;
        expect(":");
        alternate = parseAssignmentExpression();

        expr = astNodeFactory.createConditionalExpression(expr, consequent, alternate);
        markerApply(marker, expr);
    }

    return expr;
}

// [ES6] 14.2 Arrow Function

function parseConciseBody() {
    if (match("{")) {
        return parseFunctionSourceElements();
    }
    return parseAssignmentExpression();
}

function reinterpretAsCoverFormalsList(expressions) {
    var i, len, param, params, defaults, defaultCount, options, rest;

    params = [];
    defaults = [];
    defaultCount = 0;
    rest = null;
    options = {
        paramSet: new StringMap()
    };

    for (i = 0, len = expressions.length; i < len; i += 1) {
        param = expressions[i];
        if (param.type === astNodeTypes.Identifier) {
            params.push(param);
            defaults.push(null);
            validateParam(options, param, param.name);
        }  else if (param.type === astNodeTypes.ObjectExpression || param.type === astNodeTypes.ArrayExpression) {
            reinterpretAsDestructuredParameter(options, param);
            params.push(param);
            defaults.push(null);
        } else if (param.type === astNodeTypes.SpreadElement) {
            assert(i === len - 1, "It is guaranteed that SpreadElement is last element by parseExpression");
            if (param.argument.type !== astNodeTypes.Identifier) {
                throwError({}, Messages.InvalidLHSInFormalsList);
            }
            reinterpretAsDestructuredParameter(options, param.argument);
            rest = param.argument;
        } else if (param.type === astNodeTypes.AssignmentExpression) {
            params.push(param.left);
            defaults.push(param.right);
            ++defaultCount;
            validateParam(options, param.left, param.left.name);
        } else {
            return null;
        }
    }

    if (options.message === Messages.StrictParamDupe) {
        throwError(
            strict ? options.stricted : options.firstRestricted,
            options.message
        );
    }

    // must be here so it's not an array of [null, null]
    if (defaultCount === 0) {
        defaults = [];
    }

    return {
        params: params,
        defaults: defaults,
        rest: rest,
        stricted: options.stricted,
        firstRestricted: options.firstRestricted,
        message: options.message
    };
}

function parseArrowFunctionExpression(options, marker) {
    var previousStrict, body;

    expect("=>");
    previousStrict = strict;

    body = parseConciseBody();

    if (strict && options.firstRestricted) {
        throwError(options.firstRestricted, options.message);
    }
    if (strict && options.stricted) {
        throwErrorTolerant(options.stricted, options.message);
    }

    strict = previousStrict;
    return markerApply(marker, astNodeFactory.createArrowFunctionExpression(
        options.params,
        options.defaults,
        body,
        options.rest,
        body.type !== astNodeTypes.BlockStatement
    ));
}

// 11.13 Assignment Operators

// 12.14.5 AssignmentPattern

function reinterpretAsAssignmentBindingPattern(expr) {
    var i, len, property, element,
        allowDestructuring = extra.ecmaFeatures.destructuring;

    if (!allowDestructuring) {
        throwUnexpected(lex());
    }

    if (expr.type === astNodeTypes.ObjectExpression) {
        expr.type = astNodeTypes.ObjectPattern;
        for (i = 0, len = expr.properties.length; i < len; i += 1) {
            property = expr.properties[i];
            if (property.kind !== "init") {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }
            reinterpretAsAssignmentBindingPattern(property.value);
        }
    } else if (expr.type === astNodeTypes.ArrayExpression) {
        expr.type = astNodeTypes.ArrayPattern;
        for (i = 0, len = expr.elements.length; i < len; i += 1) {
            element = expr.elements[i];
            /* istanbul ignore else */
            if (element) {
                reinterpretAsAssignmentBindingPattern(element);
            }
        }
    } else if (expr.type === astNodeTypes.Identifier) {
        if (syntax.isRestrictedWord(expr.name)) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
        }
    } else if (expr.type === astNodeTypes.SpreadElement) {
        reinterpretAsAssignmentBindingPattern(expr.argument);
        if (expr.argument.type === astNodeTypes.ObjectPattern) {
            throwErrorTolerant({}, Messages.ObjectPatternAsSpread);
        }
    } else if (expr.type === "AssignmentExpression" && expr.operator === "=") {
        expr.type = astNodeTypes.AssignmentPattern;
    } else {
        /* istanbul ignore else */
        if (expr.type !== astNodeTypes.MemberExpression &&
            expr.type !== astNodeTypes.CallExpression &&
            expr.type !== astNodeTypes.NewExpression &&
            expr.type !== astNodeTypes.AssignmentPattern
        ) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
        }
    }
}

// 13.2.3 BindingPattern

function reinterpretAsDestructuredParameter(options, expr) {
    var i, len, property, element,
        allowDestructuring = extra.ecmaFeatures.destructuring;

    if (!allowDestructuring) {
        throwUnexpected(lex());
    }

    if (expr.type === astNodeTypes.ObjectExpression) {
        expr.type = astNodeTypes.ObjectPattern;
        for (i = 0, len = expr.properties.length; i < len; i += 1) {
            property = expr.properties[i];
            if (property.kind !== "init") {
                throwErrorTolerant({}, Messages.InvalidLHSInFormalsList);
            }
            reinterpretAsDestructuredParameter(options, property.value);
        }
    } else if (expr.type === astNodeTypes.ArrayExpression) {
        expr.type = astNodeTypes.ArrayPattern;
        for (i = 0, len = expr.elements.length; i < len; i += 1) {
            element = expr.elements[i];
            if (element) {
                reinterpretAsDestructuredParameter(options, element);
            }
        }
    } else if (expr.type === astNodeTypes.Identifier) {
        validateParam(options, expr, expr.name);
    } else if (expr.type === astNodeTypes.SpreadElement) {
        // BindingRestElement only allows BindingIdentifier
        if (expr.argument.type !== astNodeTypes.Identifier) {
            throwErrorTolerant({}, Messages.InvalidLHSInFormalsList);
        }
        validateParam(options, expr.argument, expr.argument.name);
    } else if (expr.type === astNodeTypes.AssignmentExpression && expr.operator === "=") {
        expr.type = astNodeTypes.AssignmentPattern;
    } else if (expr.type !== astNodeTypes.AssignmentPattern) {
        throwError({}, Messages.InvalidLHSInFormalsList);
    }
}

function parseAssignmentExpression() {
    var token, left, right, node, params,
        marker,
        startsWithParen = false,
        oldParenthesisCount = state.parenthesisCount,
        allowGenerators = extra.ecmaFeatures.generators;

    // Note that 'yield' is treated as a keyword in strict mode, but a
    // contextual keyword (identifier) in non-strict mode, so we need
    // to use matchKeyword and matchContextualKeyword appropriately.
    if (allowGenerators && ((state.yieldAllowed && matchContextualKeyword("yield")) || (strict && matchKeyword("yield")))) {
        return parseYieldExpression();
    }

    marker = markerCreate();

    if (match("(")) {
        token = lookahead2();
        if ((token.value === ")" && token.type === Token.Punctuator) || token.value === "...") {
            params = parseParams();
            if (!match("=>")) {
                throwUnexpected(lex());
            }
            return parseArrowFunctionExpression(params, marker);
        }
        startsWithParen = true;
    }

    // revert to the previous lookahead style object
    token = lookahead;
    node = left = parseConditionalExpression();

    if (match("=>") &&
            (state.parenthesisCount === oldParenthesisCount ||
            state.parenthesisCount === (oldParenthesisCount + 1))) {

        if (node.type === astNodeTypes.Identifier) {
            params = reinterpretAsCoverFormalsList([ node ]);
        } else if (node.type === astNodeTypes.AssignmentExpression ||
            node.type === astNodeTypes.ArrayExpression ||
            node.type === astNodeTypes.ObjectExpression) {
            if (!startsWithParen) {
                throwUnexpected(lex());
            }
            params = reinterpretAsCoverFormalsList([ node ]);
        } else if (node.type === astNodeTypes.SequenceExpression) {
            params = reinterpretAsCoverFormalsList(node.expressions);
        }

        if (params) {
            return parseArrowFunctionExpression(params, marker);
        }
    }

    if (matchAssign()) {

        // 11.13.1
        if (strict && left.type === astNodeTypes.Identifier && syntax.isRestrictedWord(left.name)) {
            throwErrorTolerant(token, Messages.StrictLHSAssignment);
        }

        // ES.next draf 11.13 Runtime Semantics step 1
        if (match("=") && (node.type === astNodeTypes.ObjectExpression || node.type === astNodeTypes.ArrayExpression)) {
            reinterpretAsAssignmentBindingPattern(node);
        } else if (!isLeftHandSide(node)) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
        }

        token = lex();
        right = parseAssignmentExpression();
        node = markerApply(marker, astNodeFactory.createAssignmentExpression(token.value, left, right));
    }

    return node;
}

// 11.14 Comma Operator

function parseExpression() {
    var marker = markerCreate(),
        expr = parseAssignmentExpression(),
        expressions = [ expr ],
        sequence, spreadFound;

    if (match(",")) {
        while (index < length) {
            if (!match(",")) {
                break;
            }
            lex();
            expr = parseSpreadOrAssignmentExpression();
            expressions.push(expr);

            if (expr.type === astNodeTypes.SpreadElement) {
                spreadFound = true;
                if (!match(")")) {
                    throwError({}, Messages.ElementAfterSpreadElement);
                }
                break;
            }
        }

        sequence = markerApply(marker, astNodeFactory.createSequenceExpression(expressions));
    }

    if (spreadFound && lookahead2().value !== "=>") {
        throwError({}, Messages.IllegalSpread);
    }

    return sequence || expr;
}

// 12.1 Block

function parseStatementList() {
    var list = [],
        statement;

    while (index < length) {
        if (match("}")) {
            break;
        }
        statement = parseSourceElement();
        if (typeof statement === "undefined") {
            break;
        }
        list.push(statement);
    }

    return list;
}

function parseBlock() {
    var block,
        marker = markerCreate();

    expect("{");

    block = parseStatementList();

    expect("}");

    return markerApply(marker, astNodeFactory.createBlockStatement(block));
}

// 12.2 Variable Statement

function parseVariableIdentifier() {
    var token,
        marker = markerCreate();

    token = lex();

    if (token.type !== Token.Identifier) {
        if (strict && token.type === Token.Keyword && syntax.isStrictModeReservedWord(token.value)) {
            throwErrorTolerant(token, Messages.StrictReservedWord);
        } else {
            throwUnexpected(token);
        }
    }

    return markerApply(marker, astNodeFactory.createIdentifier(token.value));
}

function parseVariableDeclaration(kind) {
    var id,
        marker = markerCreate(),
        init = null;
    if (match("{")) {
        id = parseObjectInitialiser();
        reinterpretAsAssignmentBindingPattern(id);
    } else if (match("[")) {
        id = parseArrayInitialiser();
        reinterpretAsAssignmentBindingPattern(id);
    } else {
        /* istanbul ignore next */
        id = state.allowKeyword ? parseNonComputedProperty() : parseVariableIdentifier();
        // 12.2.1
        if (strict && syntax.isRestrictedWord(id.name)) {
            throwErrorTolerant({}, Messages.StrictVarName);
        }
    }

    // TODO: Verify against feature flags
    if (kind === "const") {
        if (!match("=")) {
            throwError({}, Messages.NoUnintializedConst);
        }
        expect("=");
        init = parseAssignmentExpression();
    } else if (match("=")) {
        lex();
        init = parseAssignmentExpression();
    }

    return markerApply(marker, astNodeFactory.createVariableDeclarator(id, init));
}

function parseVariableDeclarationList(kind) {
    var list = [];

    do {
        list.push(parseVariableDeclaration(kind));
        if (!match(",")) {
            break;
        }
        lex();
    } while (index < length);

    return list;
}

function parseVariableStatement() {
    var declarations;

    expectKeyword("var");

    declarations = parseVariableDeclarationList();

    consumeSemicolon();

    return astNodeFactory.createVariableDeclaration(declarations, "var");
}

// kind may be `const` or `let`
// Both are experimental and not in the specification yet.
// see http://wiki.ecmascript.org/doku.php?id=harmony:const
// and http://wiki.ecmascript.org/doku.php?id=harmony:let
function parseConstLetDeclaration(kind) {
    var declarations,
        marker = markerCreate();

    expectKeyword(kind);

    declarations = parseVariableDeclarationList(kind);

    consumeSemicolon();

    return markerApply(marker, astNodeFactory.createVariableDeclaration(declarations, kind));
}

// 12.3 Empty Statement

function parseEmptyStatement() {
    expect(";");
    return astNodeFactory.createEmptyStatement();
}

// 12.4 Expression Statement

function parseExpressionStatement() {
    var expr = parseExpression();
    consumeSemicolon();
    return astNodeFactory.createExpressionStatement(expr);
}

// 12.5 If statement

function parseIfStatement() {
    var test, consequent, alternate;

    expectKeyword("if");

    expect("(");

    test = parseExpression();

    expect(")");

    consequent = parseStatement();

    if (matchKeyword("else")) {
        lex();
        alternate = parseStatement();
    } else {
        alternate = null;
    }

    return astNodeFactory.createIfStatement(test, consequent, alternate);
}

// 12.6 Iteration Statements

function parseDoWhileStatement() {
    var body, test, oldInIteration;

    expectKeyword("do");

    oldInIteration = state.inIteration;
    state.inIteration = true;

    body = parseStatement();

    state.inIteration = oldInIteration;

    expectKeyword("while");

    expect("(");

    test = parseExpression();

    expect(")");

    if (match(";")) {
        lex();
    }

    return astNodeFactory.createDoWhileStatement(test, body);
}

function parseWhileStatement() {
    var test, body, oldInIteration;

    expectKeyword("while");

    expect("(");

    test = parseExpression();

    expect(")");

    oldInIteration = state.inIteration;
    state.inIteration = true;

    body = parseStatement();

    state.inIteration = oldInIteration;

    return astNodeFactory.createWhileStatement(test, body);
}

function parseForVariableDeclaration() {
    var token, declarations,
        marker = markerCreate();

    token = lex();
    declarations = parseVariableDeclarationList();

    return markerApply(marker, astNodeFactory.createVariableDeclaration(declarations, token.value));
}

function parseForStatement(opts) {
    var init, test, update, left, right, body, operator, oldInIteration;
    var allowForOf = extra.ecmaFeatures.forOf,
        allowBlockBindings = extra.ecmaFeatures.blockBindings;

    init = test = update = null;

    expectKeyword("for");

    expect("(");

    if (match(";")) {
        lex();
    } else {

        if (matchKeyword("var") ||
            (allowBlockBindings && (matchKeyword("let") || matchKeyword("const")))
        ) {
            state.allowIn = false;
            init = parseForVariableDeclaration();
            state.allowIn = true;

            if (init.declarations.length === 1) {
                if (matchKeyword("in") || (allowForOf && matchContextualKeyword("of"))) {
                    operator = lookahead;

                    // TODO: is "var" check here really needed? wasn"t in 1.2.2
                    if (!((operator.value === "in" || init.kind !== "var") && init.declarations[0].init)) {
                        lex();
                        left = init;
                        right = parseExpression();
                        init = null;
                    }
                }
            }

        } else {
            state.allowIn = false;
            init = parseExpression();
            state.allowIn = true;

            if (allowForOf && matchContextualKeyword("of")) {
                operator = lex();
                left = init;
                right = parseExpression();
                init = null;
            } else if (matchKeyword("in")) {
                // LeftHandSideExpression
                if (!isLeftHandSide(init)) {
                    throwErrorTolerant({}, Messages.InvalidLHSInForIn);
                }

                operator = lex();
                left = init;
                right = parseExpression();
                init = null;
            }
        }

        if (typeof left === "undefined") {
            expect(";");
        }
    }

    if (typeof left === "undefined") {

        if (!match(";")) {
            test = parseExpression();
        }
        expect(";");

        if (!match(")")) {
            update = parseExpression();
        }
    }

    expect(")");

    oldInIteration = state.inIteration;
    state.inIteration = true;

    if (!(opts !== undefined && opts.ignoreBody)) {
        body = parseStatement();
    }

    state.inIteration = oldInIteration;

    if (typeof left === "undefined") {
        return astNodeFactory.createForStatement(init, test, update, body);
    }

    if (extra.ecmaFeatures.forOf && operator.value === "of") {
        return astNodeFactory.createForOfStatement(left, right, body);
    }

    return astNodeFactory.createForInStatement(left, right, body);
}

// 12.7 The continue statement

function parseContinueStatement() {
    var label = null;

    expectKeyword("continue");

    // Optimize the most common form: "continue;".
    if (source.charCodeAt(index) === 0x3B) {
        lex();

        if (!state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return astNodeFactory.createContinueStatement(null);
    }

    if (peekLineTerminator()) {
        if (!state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return astNodeFactory.createContinueStatement(null);
    }

    if (lookahead.type === Token.Identifier) {
        label = parseVariableIdentifier();

        if (!state.labelSet.has(label.name)) {
            throwError({}, Messages.UnknownLabel, label.name);
        }
    }

    consumeSemicolon();

    if (label === null && !state.inIteration) {
        throwError({}, Messages.IllegalContinue);
    }

    return astNodeFactory.createContinueStatement(label);
}

// 12.8 The break statement

function parseBreakStatement() {
    var label = null;

    expectKeyword("break");

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (source.charCodeAt(index) === 0x3B) {
        lex();

        if (!(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return astNodeFactory.createBreakStatement(null);
    }

    if (peekLineTerminator()) {
        if (!(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return astNodeFactory.createBreakStatement(null);
    }

    if (lookahead.type === Token.Identifier) {
        label = parseVariableIdentifier();

        if (!state.labelSet.has(label.name)) {
            throwError({}, Messages.UnknownLabel, label.name);
        }
    }

    consumeSemicolon();

    if (label === null && !(state.inIteration || state.inSwitch)) {
        throwError({}, Messages.IllegalBreak);
    }

    return astNodeFactory.createBreakStatement(label);
}

// 12.9 The return statement

function parseReturnStatement() {
    var argument = null;

    expectKeyword("return");

    if (!state.inFunctionBody && !extra.ecmaFeatures.globalReturn) {
        throwErrorTolerant({}, Messages.IllegalReturn);
    }

    // "return" followed by a space and an identifier is very common.
    if (source.charCodeAt(index) === 0x20) {
        if (syntax.isIdentifierStart(source.charCodeAt(index + 1))) {
            argument = parseExpression();
            consumeSemicolon();
            return astNodeFactory.createReturnStatement(argument);
        }
    }

    if (peekLineTerminator()) {
        return astNodeFactory.createReturnStatement(null);
    }

    if (!match(";")) {
        if (!match("}") && lookahead.type !== Token.EOF) {
            argument = parseExpression();
        }
    }

    consumeSemicolon();

    return astNodeFactory.createReturnStatement(argument);
}

// 12.10 The with statement

function parseWithStatement() {
    var object, body;

    if (strict) {
        // TODO(ikarienator): Should we update the test cases instead?
        skipComment();
        throwErrorTolerant({}, Messages.StrictModeWith);
    }

    expectKeyword("with");

    expect("(");

    object = parseExpression();

    expect(")");

    body = parseStatement();

    return astNodeFactory.createWithStatement(object, body);
}

// 12.10 The swith statement

function parseSwitchCase() {
    var test, consequent = [], statement,
        marker = markerCreate();

    if (matchKeyword("default")) {
        lex();
        test = null;
    } else {
        expectKeyword("case");
        test = parseExpression();
    }
    expect(":");

    while (index < length) {
        if (match("}") || matchKeyword("default") || matchKeyword("case")) {
            break;
        }
        statement = parseSourceElement();
        consequent.push(statement);
    }

    return markerApply(marker, astNodeFactory.createSwitchCase(test, consequent));
}

function parseSwitchStatement() {
    var discriminant, cases, clause, oldInSwitch, defaultFound;

    expectKeyword("switch");

    expect("(");

    discriminant = parseExpression();

    expect(")");

    expect("{");

    cases = [];

    if (match("}")) {
        lex();
        return astNodeFactory.createSwitchStatement(discriminant, cases);
    }

    oldInSwitch = state.inSwitch;
    state.inSwitch = true;
    defaultFound = false;

    while (index < length) {
        if (match("}")) {
            break;
        }
        clause = parseSwitchCase();
        if (clause.test === null) {
            if (defaultFound) {
                throwError({}, Messages.MultipleDefaultsInSwitch);
            }
            defaultFound = true;
        }
        cases.push(clause);
    }

    state.inSwitch = oldInSwitch;

    expect("}");

    return astNodeFactory.createSwitchStatement(discriminant, cases);
}

// 12.13 The throw statement

function parseThrowStatement() {
    var argument;

    expectKeyword("throw");

    if (peekLineTerminator()) {
        throwError({}, Messages.NewlineAfterThrow);
    }

    argument = parseExpression();

    consumeSemicolon();

    return astNodeFactory.createThrowStatement(argument);
}

// 12.14 The try statement

function parseCatchClause() {
    var param, body,
        marker = markerCreate(),
        allowDestructuring = extra.ecmaFeatures.destructuring,
        options = {
            paramSet: new StringMap()
        };

    expectKeyword("catch");

    expect("(");
    if (match(")")) {
        throwUnexpected(lookahead);
    }

    if (match("[")) {
        if (!allowDestructuring) {
            throwUnexpected(lookahead);
        }
        param = parseArrayInitialiser();
        reinterpretAsDestructuredParameter(options, param);
    } else if (match("{")) {

        if (!allowDestructuring) {
            throwUnexpected(lookahead);
        }
        param = parseObjectInitialiser();
        reinterpretAsDestructuredParameter(options, param);
    } else {
        param = parseVariableIdentifier();
    }

    // 12.14.1
    if (strict && param.name && syntax.isRestrictedWord(param.name)) {
        throwErrorTolerant({}, Messages.StrictCatchVariable);
    }

    expect(")");
    body = parseBlock();
    return markerApply(marker, astNodeFactory.createCatchClause(param, body));
}

function parseTryStatement() {
    var block, handler = null, finalizer = null;

    expectKeyword("try");

    block = parseBlock();

    if (matchKeyword("catch")) {
        handler = parseCatchClause();
    }

    if (matchKeyword("finally")) {
        lex();
        finalizer = parseBlock();
    }

    if (!handler && !finalizer) {
        throwError({}, Messages.NoCatchOrFinally);
    }

    return astNodeFactory.createTryStatement(block, handler, finalizer);
}

// 12.15 The debugger statement

function parseDebuggerStatement() {
    expectKeyword("debugger");

    consumeSemicolon();

    return astNodeFactory.createDebuggerStatement();
}

// 12 Statements

function parseStatement() {
    var type = lookahead.type,
        expr,
        labeledBody,
        marker;

    if (type === Token.EOF) {
        throwUnexpected(lookahead);
    }

    if (type === Token.Punctuator && lookahead.value === "{") {
        return parseBlock();
    }

    marker = markerCreate();

    if (type === Token.Punctuator) {
        switch (lookahead.value) {
            case ";":
                return markerApply(marker, parseEmptyStatement());
            case "{":
                return parseBlock();
            case "(":
                return markerApply(marker, parseExpressionStatement());
            default:
                break;
        }
    }

    marker = markerCreate();

    if (type === Token.Keyword) {
        switch (lookahead.value) {
            case "break":
                return markerApply(marker, parseBreakStatement());
            case "continue":
                return markerApply(marker, parseContinueStatement());
            case "debugger":
                return markerApply(marker, parseDebuggerStatement());
            case "do":
                return markerApply(marker, parseDoWhileStatement());
            case "for":
                return markerApply(marker, parseForStatement());
            case "function":
                return markerApply(marker, parseFunctionDeclaration());
            case "if":
                return markerApply(marker, parseIfStatement());
            case "return":
                return markerApply(marker, parseReturnStatement());
            case "switch":
                return markerApply(marker, parseSwitchStatement());
            case "throw":
                return markerApply(marker, parseThrowStatement());
            case "try":
                return markerApply(marker, parseTryStatement());
            case "var":
                return markerApply(marker, parseVariableStatement());
            case "while":
                return markerApply(marker, parseWhileStatement());
            case "with":
                return markerApply(marker, parseWithStatement());
            default:
                break;
        }
    }

    marker = markerCreate();
    expr = parseExpression();

    // 12.12 Labelled Statements
    if ((expr.type === astNodeTypes.Identifier) && match(":")) {
        lex();

        if (state.labelSet.has(expr.name)) {
            throwError({}, Messages.Redeclaration, "Label", expr.name);
        }

        state.labelSet.set(expr.name, true);
        labeledBody = parseStatement();
        state.labelSet.delete(expr.name);
        return markerApply(marker, astNodeFactory.createLabeledStatement(expr, labeledBody));
    }

    consumeSemicolon();

    return markerApply(marker, astNodeFactory.createExpressionStatement(expr));
}

// 13 Function Definition

// function parseConciseBody() {
//     if (match("{")) {
//         return parseFunctionSourceElements();
//     }
//     return parseAssignmentExpression();
// }

function parseFunctionSourceElements() {
    var sourceElement, sourceElements = [], token, directive, firstRestricted,
        oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesisCount,
        marker = markerCreate();

    expect("{");

    while (index < length) {
        if (lookahead.type !== Token.StringLiteral) {
            break;
        }
        token = lookahead;

        sourceElement = parseSourceElement();
        sourceElements.push(sourceElement);
        if (sourceElement.expression.type !== astNodeTypes.Literal) {
            // this is not directive
            break;
        }
        directive = source.slice(token.range[0] + 1, token.range[1] - 1);
        if (directive === "use strict") {
            strict = true;

            if (firstRestricted) {
                throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
            }
        } else {
            if (!firstRestricted && token.octal) {
                firstRestricted = token;
            }
        }
    }

    oldLabelSet = state.labelSet;
    oldInIteration = state.inIteration;
    oldInSwitch = state.inSwitch;
    oldInFunctionBody = state.inFunctionBody;
    oldParenthesisCount = state.parenthesizedCount;

    state.labelSet = new StringMap();
    state.inIteration = false;
    state.inSwitch = false;
    state.inFunctionBody = true;

    while (index < length) {

        if (match("}")) {
            break;
        }

        sourceElement = parseSourceElement();

        if (typeof sourceElement === "undefined") {
            break;
        }

        sourceElements.push(sourceElement);
    }

    expect("}");

    state.labelSet = oldLabelSet;
    state.inIteration = oldInIteration;
    state.inSwitch = oldInSwitch;
    state.inFunctionBody = oldInFunctionBody;
    state.parenthesizedCount = oldParenthesisCount;

    return markerApply(marker, astNodeFactory.createBlockStatement(sourceElements));
}

function validateParam(options, param, name) {

    if (strict) {
        if (syntax.isRestrictedWord(name)) {
            options.stricted = param;
            options.message = Messages.StrictParamName;
        }

        if (options.paramSet.has(name)) {
            options.stricted = param;
            options.message = Messages.StrictParamDupe;
        }
    } else if (!options.firstRestricted) {
        if (syntax.isRestrictedWord(name)) {
            options.firstRestricted = param;
            options.message = Messages.StrictParamName;
        } else if (syntax.isStrictModeReservedWord(name)) {
            options.firstRestricted = param;
            options.message = Messages.StrictReservedWord;
        } else if (options.paramSet.has(name)) {
            options.firstRestricted = param;
            options.message = Messages.StrictParamDupe;
        }
    }
    options.paramSet.set(name, true);
}

function parseParam(options) {
    var token, rest, param, def,
        allowRestParams = extra.ecmaFeatures.restParams,
        allowDestructuring = extra.ecmaFeatures.destructuring,
        allowDefaultParams = extra.ecmaFeatures.defaultParams;


    token = lookahead;
    if (token.value === "...") {
        if (!allowRestParams) {
            throwUnexpected(lookahead);
        }
        token = lex();
        rest = true;
    }

    if (match("[")) {
        if (!allowDestructuring) {
            throwUnexpected(lookahead);
        }
        param = parseArrayInitialiser();
        reinterpretAsDestructuredParameter(options, param);
    } else if (match("{")) {
        if (rest) {
            throwError({}, Messages.ObjectPatternAsRestParameter);
        }
        if (!allowDestructuring) {
            throwUnexpected(lookahead);
        }
        param = parseObjectInitialiser();
        reinterpretAsDestructuredParameter(options, param);
    } else {
        param = parseVariableIdentifier();
        validateParam(options, token, token.value);
    }

    if (match("=")) {
        if (rest) {
            throwErrorTolerant(lookahead, Messages.DefaultRestParameter);
        }
        if (allowDefaultParams || allowDestructuring) {
            lex();
            def = parseAssignmentExpression();
            ++options.defaultCount;
        } else {
            throwUnexpected(lookahead);
        }
    }

    if (rest) {
        if (!match(")")) {
            throwError({}, Messages.ParameterAfterRestParameter);
        }
        options.rest = param;
        return false;
    }

    options.params.push(param);
    options.defaults.push(def ? def : null); // TODO: determine if null or undefined (see: #55)

    return !match(")");
}


function parseParams(firstRestricted) {
    var options;

    options = {
        params: [],
        defaultCount: 0,
        defaults: [],
        rest: null,
        firstRestricted: firstRestricted
    };

    expect("(");

    if (!match(")")) {
        options.paramSet = new StringMap();
        while (index < length) {
            if (!parseParam(options)) {
                break;
            }
            expect(",");
        }
    }

    expect(")");

    if (options.defaultCount === 0) {
        options.defaults = [];
    }

    return {
        params: options.params,
        defaults: options.defaults,
        rest: options.rest,
        stricted: options.stricted,
        firstRestricted: options.firstRestricted,
        message: options.message
    };
}

function parseFunctionDeclaration(identifierIsOptional) {
        var id = null, body, token, tmp, firstRestricted, message, previousStrict, previousYieldAllowed, generator,
            marker = markerCreate(),
            allowGenerators = extra.ecmaFeatures.generators;

        expectKeyword("function");

        generator = false;
        if (allowGenerators && match("*")) {
            lex();
            generator = true;
        }

        if (!identifierIsOptional || !match("(")) {

            token = lookahead;

            id = parseVariableIdentifier();

            if (strict) {
                if (syntax.isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (syntax.isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (syntax.isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        previousYieldAllowed = state.yieldAllowed;
        state.yieldAllowed = generator;

        body = parseFunctionSourceElements();

        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && tmp.stricted) {
            throwErrorTolerant(tmp.stricted, message);
        }
        strict = previousStrict;
        state.yieldAllowed = previousYieldAllowed;

        return markerApply(
            marker,
            astNodeFactory.createFunctionDeclaration(
                id,
                tmp.params,
                tmp.defaults,
                body,
                tmp.rest,
                generator,
                false
            )
        );
    }

function parseFunctionExpression() {
    var token, id = null, firstRestricted, message, tmp, body, previousStrict, previousYieldAllowed, generator,
        marker = markerCreate(),
        allowGenerators = extra.ecmaFeatures.generators;

    expectKeyword("function");

    generator = false;

    if (allowGenerators && match("*")) {
        lex();
        generator = true;
    }

    if (!match("(")) {
        token = lookahead;
        id = parseVariableIdentifier();
        if (strict) {
            if (syntax.isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (syntax.isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (syntax.isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }
    }

    tmp = parseParams(firstRestricted);
    firstRestricted = tmp.firstRestricted;
    if (tmp.message) {
        message = tmp.message;
    }

    previousStrict = strict;
    previousYieldAllowed = state.yieldAllowed;
    state.yieldAllowed = generator;

    body = parseFunctionSourceElements();

    if (strict && firstRestricted) {
        throwError(firstRestricted, message);
    }
    if (strict && tmp.stricted) {
        throwErrorTolerant(tmp.stricted, message);
    }
    strict = previousStrict;
    state.yieldAllowed = previousYieldAllowed;

    return markerApply(
        marker,
        astNodeFactory.createFunctionExpression(
            id,
            tmp.params,
            tmp.defaults,
            body,
            tmp.rest,
            generator,
            false
        )
    );
}

function parseYieldExpression() {
    var yieldToken, delegateFlag, expr, marker = markerCreate();

    yieldToken = lex();
    assert(yieldToken.value === "yield", "Called parseYieldExpression with non-yield lookahead.");

    if (!state.yieldAllowed) {
        throwErrorTolerant({}, Messages.IllegalYield);
    }

    delegateFlag = false;
    if (match("*")) {
        lex();
        delegateFlag = true;
    }

    expr = parseAssignmentExpression();

    return markerApply(marker, astNodeFactory.createYieldExpression(expr, delegateFlag));
}

// Modules grammar from:
// people.mozilla.org/~jorendorff/es6-draft.html

function parseModuleSpecifier() {
    var marker = markerCreate(),
        specifier;

    if (lookahead.type !== Token.StringLiteral) {
        throwError({}, Messages.InvalidModuleSpecifier);
    }
    specifier = astNodeFactory.createLiteralFromSource(lex(), source);
    return markerApply(marker, specifier);
}

function parseExportSpecifier() {
    var exported, local, marker = markerCreate();
    if (matchKeyword("default")) {
        lex();
        local = markerApply(marker, astNodeFactory.createIdentifier("default"));
        // export {default} from "something";
    } else {
        local = parseVariableIdentifier();
    }
    if (matchContextualKeyword("as")) {
        lex();
        exported = parseNonComputedProperty();
    }
    return markerApply(marker, astNodeFactory.createExportSpecifier(local, exported));
}

function parseExportNamedDeclaration() {
    var declaration = null,
        isExportFromIdentifier,
        src = null, specifiers = [],
        marker = markerCreate();

    expectKeyword("export");

    // non-default export
    if (lookahead.type === Token.Keyword) {
        // covers:
        // export var f = 1;
        switch (lookahead.value) {
            case "let":
            case "const":
            case "var":
            case "class":
            case "function":
                declaration = parseSourceElement();
                return markerApply(marker, astNodeFactory.createExportNamedDeclaration(declaration, specifiers, null));
            default:
                break;
        }
    }

    expect("{");
    if (!match("}")) {
        do {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword("default");
            specifiers.push(parseExportSpecifier());
        } while (match(",") && lex());
    }
    expect("}");

    if (matchContextualKeyword("from")) {
        // covering:
        // export {default} from "foo";
        // export {foo} from "foo";
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();
    } else if (isExportFromIdentifier) {
        // covering:
        // export {default}; // missing fromClause
        throwError({}, lookahead.value ?
                Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
    } else {
        // cover
        // export {foo};
        consumeSemicolon();
    }
    return markerApply(marker, astNodeFactory.createExportNamedDeclaration(declaration, specifiers, src));
}

function parseExportDefaultDeclaration() {
    var declaration = null,
        expression = null,
        possibleIdentifierToken,
        allowClasses = extra.ecmaFeatures.classes,
        marker = markerCreate();

    // covers:
    // export default ...
    expectKeyword("export");
    expectKeyword("default");

    if (matchKeyword("function") || matchKeyword("class")) {
        possibleIdentifierToken = lookahead2();
        if (possibleIdentifierToken.type === Token.Identifier) {
            // covers:
            // export default function foo () {}
            // export default class foo {}
            declaration = parseSourceElement();
            return markerApply(marker, astNodeFactory.createExportDefaultDeclaration(declaration));
        }
        // covers:
        // export default function () {}
        // export default class {}
        if (lookahead.value === "function") {
            declaration = parseFunctionDeclaration(true);
            return markerApply(marker, astNodeFactory.createExportDefaultDeclaration(declaration));
        } else if (allowClasses && lookahead.value === "class") {
            declaration = parseClassDeclaration(true);
            return markerApply(marker, astNodeFactory.createExportDefaultDeclaration(declaration));
        }
    }

    if (matchContextualKeyword("from")) {
        throwError({}, Messages.UnexpectedToken, lookahead.value);
    }

    // covers:
    // export default {};
    // export default [];
    // export default (1 + 2);
    if (match("{")) {
        expression = parseObjectInitialiser();
    } else if (match("[")) {
        expression = parseArrayInitialiser();
    } else {
        expression = parseAssignmentExpression();
    }
    consumeSemicolon();
    return markerApply(marker, astNodeFactory.createExportDefaultDeclaration(expression));
}


function parseExportAllDeclaration() {
    var src,
        marker = markerCreate();

    // covers:
    // export * from "foo";
    expectKeyword("export");
    expect("*");
    if (!matchContextualKeyword("from")) {
        throwError({}, lookahead.value ?
                Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
    }
    lex();
    src = parseModuleSpecifier();
    consumeSemicolon();

    return markerApply(marker, astNodeFactory.createExportAllDeclaration(src));
}

function parseExportDeclaration() {
    if (state.inFunctionBody) {
        throwError({}, Messages.IllegalExportDeclaration);
    }
    var declarationType = lookahead2().value;
    if (declarationType === "default") {
        return parseExportDefaultDeclaration();
    } else if (declarationType === "*") {
        return parseExportAllDeclaration();
    } else {
        return parseExportNamedDeclaration();
    }
}

function parseImportSpecifier() {
    // import {<foo as bar>} ...;
    var local, imported, marker = markerCreate();

    imported = parseNonComputedProperty();
    if (matchContextualKeyword("as")) {
        lex();
        local = parseVariableIdentifier();
    }

    return markerApply(marker, astNodeFactory.createImportSpecifier(local, imported));
}

function parseNamedImports() {
    var specifiers = [];
    // {foo, bar as bas}
    expect("{");
    if (!match("}")) {
        do {
            specifiers.push(parseImportSpecifier());
        } while (match(",") && lex());
    }
    expect("}");
    return specifiers;
}

function parseImportDefaultSpecifier() {
    // import <foo> ...;
    var local, marker = markerCreate();

    local = parseNonComputedProperty();

    return markerApply(marker, astNodeFactory.createImportDefaultSpecifier(local));
}

function parseImportNamespaceSpecifier() {
    // import <* as foo> ...;
    var local, marker = markerCreate();

    expect("*");
    if (!matchContextualKeyword("as")) {
        throwError({}, Messages.NoAsAfterImportNamespace);
    }
    lex();
    local = parseNonComputedProperty();

    return markerApply(marker, astNodeFactory.createImportNamespaceSpecifier(local));
}

function parseImportDeclaration() {
    var specifiers, src, marker = markerCreate();

    if (state.inFunctionBody) {
        throwError({}, Messages.IllegalImportDeclaration);
    }

    expectKeyword("import");
    specifiers = [];

    if (lookahead.type === Token.StringLiteral) {
        // covers:
        // import "foo";
        src = parseModuleSpecifier();
        consumeSemicolon();
        return markerApply(marker, astNodeFactory.createImportDeclaration(specifiers, src));
    }

    if (!matchKeyword("default") && isIdentifierName(lookahead)) {
        // covers:
        // import foo
        // import foo, ...
        specifiers.push(parseImportDefaultSpecifier());
        if (match(",")) {
            lex();
        }
    }
    if (match("*")) {
        // covers:
        // import foo, * as foo
        // import * as foo
        specifiers.push(parseImportNamespaceSpecifier());
    } else if (match("{")) {
        // covers:
        // import foo, {bar}
        // import {bar}
        specifiers = specifiers.concat(parseNamedImports());
    }

    if (!matchContextualKeyword("from")) {
        throwError({}, lookahead.value ?
                Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
    }
    lex();
    src = parseModuleSpecifier();
    consumeSemicolon();

    return markerApply(marker, astNodeFactory.createImportDeclaration(specifiers, src));
}

// 14 Functions and classes

// 14.1 Functions is defined above (13 in ES5)
// 14.2 Arrow Functions Definitions is defined in (7.3 assignments)

// 14.3 Method Definitions
// 14.3.7

// 14.5 Class Definitions

function parseClassBody() {
    var hasConstructor = false, generator = false,
        allowGenerators = extra.ecmaFeatures.generators,
        token, isStatic, body = [], method, computed, key;

    var existingProps = {},
        topMarker = markerCreate(),
        marker;

    existingProps.static = new StringMap();
    existingProps.prototype = new StringMap();

    expect("{");

    while (!match("}")) {

        // extra semicolons are fine
        if (match(";")) {
            lex();
            continue;
        }

        token = lookahead;
        isStatic = false;
        generator = match("*");
        computed = match("[");
        marker = markerCreate();

        if (generator) {
            if (!allowGenerators) {
                throwUnexpected(lookahead);
            }
            lex();
        }

        key = parseObjectPropertyKey();

        // static generator methods
        if (key.name === "static" && match("*")) {
            if (!allowGenerators) {
                throwUnexpected(lookahead);
            }
            generator = true;
            lex();
        }

        if (key.name === "static" && lookaheadPropertyName()) {
            token = lookahead;
            isStatic = true;
            computed = match("[");
            key = parseObjectPropertyKey();
        }

        if (generator) {
            method = parseGeneratorProperty(key, marker);
        } else {
            method = tryParseMethodDefinition(token, key, computed, marker, generator);
        }

        if (method) {
            method.static = isStatic;
            if (method.kind === "init") {
                method.kind = "method";
            }

            if (!isStatic) {
                if (!method.computed && (method.key.name || method.key.value.toString()) === "constructor") {
                    if (method.kind !== "method" || !method.method || method.value.generator) {
                        throwUnexpected(token, Messages.ConstructorSpecialMethod);
                    }
                    if (hasConstructor) {
                        throwUnexpected(token, Messages.DuplicateConstructor);
                    } else {
                        hasConstructor = true;
                    }
                    method.kind = "constructor";
                }
            } else {
                if (!method.computed && (method.key.name || method.key.value.toString()) === "prototype") {
                    throwUnexpected(token, Messages.StaticPrototype);
                }
            }
            method.type = astNodeTypes.MethodDefinition;
            delete method.method;
            delete method.shorthand;
            body.push(method);
        } else {
            throwUnexpected(lookahead);
        }
    }

    lex();
    return markerApply(topMarker, astNodeFactory.createClassBody(body));
}

function parseClassExpression() {
    var id = null, superClass = null, marker = markerCreate(),
        previousStrict = strict, classBody;

    // classes run in strict mode
    strict = true;

    expectKeyword("class");

    if (lookahead.type === Token.Identifier) {
        id = parseVariableIdentifier();
    }

    if (matchKeyword("extends")) {
        lex();
        superClass = parseLeftHandSideExpressionAllowCall();
    }

    classBody = parseClassBody();
    strict = previousStrict;

    return markerApply(marker, astNodeFactory.createClassExpression(id, superClass, classBody));
}

function parseClassDeclaration(identifierIsOptional) {
    var id = null, superClass = null, marker = markerCreate(),
        previousStrict = strict, classBody;

    // classes run in strict mode
    strict = true;

    expectKeyword("class");

    if (!identifierIsOptional || lookahead.type === Token.Identifier) {
        id = parseVariableIdentifier();
    }

    if (matchKeyword("extends")) {
        lex();
        superClass = parseLeftHandSideExpressionAllowCall();
    }

    classBody = parseClassBody();
    strict = previousStrict;

    return markerApply(marker, astNodeFactory.createClassDeclaration(id, superClass, classBody));
}

// 15 Program

function parseSourceElement() {

    var allowClasses = extra.ecmaFeatures.classes,
        allowModules = extra.ecmaFeatures.modules,
        allowBlockBindings = extra.ecmaFeatures.blockBindings;

    if (lookahead.type === Token.Keyword) {
        switch (lookahead.value) {
            case "export":
                if (!allowModules) {
                    throwErrorTolerant({}, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case "import":
                if (!allowModules) {
                    throwErrorTolerant({}, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case "function":
                return parseFunctionDeclaration();
            case "class":
                if (allowClasses) {
                    return parseClassDeclaration();
                }
                break;
            case "const":
            case "let":
                if (allowBlockBindings) {
                    return parseConstLetDeclaration(lookahead.value);
                }
                /* falls through */
            default:
                return parseStatement();
        }
    }

    if (lookahead.type !== Token.EOF) {
        return parseStatement();
    }
}

function parseSourceElements() {
    var sourceElement, sourceElements = [], token, directive, firstRestricted;

    while (index < length) {
        token = lookahead;
        if (token.type !== Token.StringLiteral) {
            break;
        }

        sourceElement = parseSourceElement();
        sourceElements.push(sourceElement);
        if (sourceElement.expression.type !== astNodeTypes.Literal) {
            // this is not directive
            break;
        }
        directive = source.slice(token.range[0] + 1, token.range[1] - 1);
        if (directive === "use strict") {
            strict = true;
            if (firstRestricted) {
                throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
            }
        } else {
            if (!firstRestricted && token.octal) {
                firstRestricted = token;
            }
        }
    }

    while (index < length) {
        sourceElement = parseSourceElement();
        /* istanbul ignore if */
        if (typeof sourceElement === "undefined") {
            break;
        }
        sourceElements.push(sourceElement);
    }
    return sourceElements;
}

function parseProgram() {
    var body,
        marker,
        isModule = !!extra.ecmaFeatures.modules;

    skipComment();
    peek();
    marker = markerCreate();
    strict = isModule;

    body = parseSourceElements();
    return markerApply(marker, astNodeFactory.createProgram(body, isModule ? "module" : "script"));
}

function filterTokenLocation() {
    var i, entry, token, tokens = [];

    for (i = 0; i < extra.tokens.length; ++i) {
        entry = extra.tokens[i];
        token = {
            type: entry.type,
            value: entry.value
        };
        if (entry.regex) {
            token.regex = {
                pattern: entry.regex.pattern,
                flags: entry.regex.flags
            };
        }
        if (extra.range) {
            token.range = entry.range;
        }
        if (extra.loc) {
            token.loc = entry.loc;
        }
        tokens.push(token);
    }

    extra.tokens = tokens;
}

//------------------------------------------------------------------------------
// Tokenizer
//------------------------------------------------------------------------------

function tokenize(code, options) {
    var toString,
        tokens;

    toString = String;
    if (typeof code !== "string" && !(code instanceof String)) {
        code = toString(code);
    }

    source = code;
    index = 0;
    lineNumber = (source.length > 0) ? 1 : 0;
    lineStart = 0;
    length = source.length;
    lookahead = null;
    state = {
        allowIn: true,
        labelSet: {},
        parenthesisCount: 0,
        inFunctionBody: false,
        inIteration: false,
        inSwitch: false,
        lastCommentStart: -1,
        yieldAllowed: false,
        curlyStack: [],
        curlyLastIndex: 0,
        inJSXSpreadAttribute: false,
        inJSXChild: false,
        inJSXTag: false
    };

    extra = {
        ecmaFeatures: defaultFeatures
    };

    // Options matching.
    options = options || {};

    // Of course we collect tokens here.
    options.tokens = true;
    extra.tokens = [];
    extra.tokenize = true;

    // The following two fields are necessary to compute the Regex tokens.
    extra.openParenToken = -1;
    extra.openCurlyToken = -1;

    extra.range = (typeof options.range === "boolean") && options.range;
    extra.loc = (typeof options.loc === "boolean") && options.loc;

    if (typeof options.comment === "boolean" && options.comment) {
        extra.comments = [];
    }
    if (typeof options.tolerant === "boolean" && options.tolerant) {
        extra.errors = [];
    }

    // apply parsing flags
    if (options.ecmaFeatures && typeof options.ecmaFeatures === "object") {
        extra.ecmaFeatures = options.ecmaFeatures;
    }

    try {
        peek();
        if (lookahead.type === Token.EOF) {
            return extra.tokens;
        }

        lex();
        while (lookahead.type !== Token.EOF) {
            try {
                lex();
            } catch (lexError) {
                if (extra.errors) {
                    extra.errors.push(lexError);
                    // We have to break on the first error
                    // to avoid infinite loops.
                    break;
                } else {
                    throw lexError;
                }
            }
        }

        filterTokenLocation();
        tokens = extra.tokens;

        if (typeof extra.comments !== "undefined") {
            tokens.comments = extra.comments;
        }
        if (typeof extra.errors !== "undefined") {
            tokens.errors = extra.errors;
        }
    } catch (e) {
        throw e;
    } finally {
        extra = {};
    }
    return tokens;
}

//------------------------------------------------------------------------------
// Parser
//------------------------------------------------------------------------------

function parse(code, options) {
    var program, toString;

    toString = String;
    if (typeof code !== "string" && !(code instanceof String)) {
        code = toString(code);
    }

    source = code;
    index = 0;
    lineNumber = (source.length > 0) ? 1 : 0;
    lineStart = 0;
    length = source.length;
    lookahead = null;
    state = {
        allowIn: true,
        labelSet: new StringMap(),
        parenthesisCount: 0,
        inFunctionBody: false,
        inIteration: false,
        inSwitch: false,
        lastCommentStart: -1,
        yieldAllowed: false,
        curlyStack: [],
        curlyLastIndex: 0,
        inJSXSpreadAttribute: false,
        inJSXChild: false,
        inJSXTag: false
    };

    extra = {
        ecmaFeatures: Object.create(defaultFeatures)
    };

    // for template strings
    state.curlyStack = [];

    if (typeof options !== "undefined") {
        extra.range = (typeof options.range === "boolean") && options.range;
        extra.loc = (typeof options.loc === "boolean") && options.loc;
        extra.attachComment = (typeof options.attachComment === "boolean") && options.attachComment;

        if (extra.loc && options.source !== null && options.source !== undefined) {
            extra.source = toString(options.source);
        }

        if (typeof options.tokens === "boolean" && options.tokens) {
            extra.tokens = [];
        }
        if (typeof options.comment === "boolean" && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === "boolean" && options.tolerant) {
            extra.errors = [];
        }
        if (extra.attachComment) {
            extra.range = true;
            extra.comments = [];
            commentAttachment.reset();
        }

        if (options.sourceType === "module") {
            extra.ecmaFeatures = {
                arrowFunctions: true,
                blockBindings: true,
                regexUFlag: true,
                regexYFlag: true,
                templateStrings: true,
                binaryLiterals: true,
                octalLiterals: true,
                unicodeCodePointEscapes: true,
                superInFunctions: true,
                defaultParams: true,
                restParams: true,
                forOf: true,
                objectLiteralComputedProperties: true,
                objectLiteralShorthandMethods: true,
                objectLiteralShorthandProperties: true,
                objectLiteralDuplicateProperties: true,
                generators: true,
                destructuring: true,
                classes: true,
                modules: true
            };
        }

        // apply parsing flags after sourceType to allow overriding
        if (options.ecmaFeatures && typeof options.ecmaFeatures === "object") {

            // if it's a module, augment the ecmaFeatures
            if (options.sourceType === "module") {
                Object.keys(options.ecmaFeatures).forEach(function(key) {
                    extra.ecmaFeatures[key] = options.ecmaFeatures[key];
                });
            } else {
                extra.ecmaFeatures = options.ecmaFeatures;
            }
        }

    }

    try {
        program = parseProgram();
        if (typeof extra.comments !== "undefined") {
            program.comments = extra.comments;
        }
        if (typeof extra.tokens !== "undefined") {
            filterTokenLocation();
            program.tokens = extra.tokens;
        }
        if (typeof extra.errors !== "undefined") {
            program.errors = extra.errors;
        }
    } catch (e) {
        throw e;
    } finally {
        extra = {};
    }

    return program;
}

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

exports.version = require("./package.json").version;

exports.tokenize = tokenize;

exports.parse = parse;

// Deep copy.
/* istanbul ignore next */
exports.Syntax = (function () {
    var name, types = {};

    if (typeof Object.create === "function") {
        types = Object.create(null);
    }

    for (name in astNodeTypes) {
        if (astNodeTypes.hasOwnProperty(name)) {
            types[name] = astNodeTypes[name];
        }
    }

    if (typeof Object.freeze === "function") {
        Object.freeze(types);
    }

    return types;
}());

},{"./lib/ast-node-factory":59,"./lib/ast-node-types":60,"./lib/comment-attachment":61,"./lib/features":62,"./lib/messages":63,"./lib/string-map":64,"./lib/syntax":65,"./lib/token-info":66,"./lib/xhtml-entities":67,"./package.json":68}],59:[function(require,module,exports){
/**
 * @fileoverview A factory for creating AST nodes
 * @author Fred K. Schott
 * @copyright 2014 Fred K. Schott. All rights reserved.
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var astNodeTypes = require("./ast-node-types");

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {

    /**
     * Create an Array Expression ASTNode out of an array of elements
     * @param {ASTNode[]} elements An array of ASTNode elements
     * @returns {ASTNode} An ASTNode representing the entire array expression
     */
    createArrayExpression: function (elements) {
        return {
            type: astNodeTypes.ArrayExpression,
            elements: elements
        };
    },

    /**
     * Create an Arrow Function Expression ASTNode
     * @param {ASTNode} params The function arguments
     * @param {ASTNode} defaults Any default arguments
     * @param {ASTNode} body The function body
     * @param {ASTNode} rest The rest parameter
     * @param {boolean} expression True if the arrow function is created via an expression.
     *      Always false for declarations, but kept here to be in sync with
     *      FunctionExpression objects.
     * @returns {ASTNode} An ASTNode representing the entire arrow function expression
     */
    createArrowFunctionExpression: function (params, defaults, body, rest, expression) {
        return {
            type: astNodeTypes.ArrowFunctionExpression,
            id: null,
            params: params,
            defaults: defaults,
            body: body,
            rest: rest,
            generator: false,
            expression: expression
        };
    },

    /**
     * Create an ASTNode representation of an assignment expression
     * @param {ASTNode} operator The assignment operator
     * @param {ASTNode} left The left operand
     * @param {ASTNode} right The right operand
     * @returns {ASTNode} An ASTNode representing the entire assignment expression
     */
    createAssignmentExpression: function (operator, left, right) {
        return {
            type: astNodeTypes.AssignmentExpression,
            operator: operator,
            left: left,
            right: right
        };
    },

    /**
     * Create an ASTNode representation of a binary expression
     * @param {ASTNode} operator The assignment operator
     * @param {ASTNode} left The left operand
     * @param {ASTNode} right The right operand
     * @returns {ASTNode} An ASTNode representing the entire binary expression
     */
    createBinaryExpression: function (operator, left, right) {
        var type = (operator === "||" || operator === "&&") ? astNodeTypes.LogicalExpression :
                    astNodeTypes.BinaryExpression;
        return {
            type: type,
            operator: operator,
            left: left,
            right: right
        };
    },

    /**
     * Create an ASTNode representation of a block statement
     * @param {ASTNode} body The block statement body
     * @returns {ASTNode} An ASTNode representing the entire block statement
     */
    createBlockStatement: function (body) {
        return {
            type: astNodeTypes.BlockStatement,
            body: body
        };
    },

    /**
     * Create an ASTNode representation of a break statement
     * @param {ASTNode} label The break statement label
     * @returns {ASTNode} An ASTNode representing the break statement
     */
    createBreakStatement: function (label) {
        return {
            type: astNodeTypes.BreakStatement,
            label: label
        };
    },

    /**
     * Create an ASTNode representation of a call expression
     * @param {ASTNode} callee The function being called
     * @param {ASTNode[]} args An array of ASTNodes representing the function call arguments
     * @returns {ASTNode} An ASTNode representing the entire call expression
     */
    createCallExpression: function (callee, args) {
        return {
            type: astNodeTypes.CallExpression,
            callee: callee,
            "arguments": args
        };
    },

    /**
     * Create an ASTNode representation of a catch clause/block
     * @param {ASTNode} param Any catch clause exeption/conditional parameter information
     * @param {ASTNode} body The catch block body
     * @returns {ASTNode} An ASTNode representing the entire catch clause
     */
    createCatchClause: function (param, body) {
        return {
            type: astNodeTypes.CatchClause,
            param: param,
            body: body
        };
    },

    /**
     * Creates an ASTNode representation of a class body.
     * @param {ASTNode} body The node representing the body of the class.
     * @returns {ASTNode} An ASTNode representing the class body.
     */
    createClassBody: function (body) {
        return {
            type: astNodeTypes.ClassBody,
            body: body
        };
    },

    createClassExpression: function (id, superClass, body) {
        return {
            type: astNodeTypes.ClassExpression,
            id: id,
            superClass: superClass,
            body: body
        };
    },

    createClassDeclaration: function (id, superClass, body) {
        return {
            type: astNodeTypes.ClassDeclaration,
            id: id,
            superClass: superClass,
            body: body
        };
    },

    createMethodDefinition: function (propertyType, kind, key, value, computed) {
        return {
            type: astNodeTypes.MethodDefinition,
            key: key,
            value: value,
            kind: kind,
            "static": propertyType === "static",
            computed: computed
        };
    },

    /**
     * Create an ASTNode representation of a conditional expression
     * @param {ASTNode} test The conditional to evaluate
     * @param {ASTNode} consequent The code to be run if the test returns true
     * @param {ASTNode} alternate The code to be run if the test returns false
     * @returns {ASTNode} An ASTNode representing the entire conditional expression
     */
    createConditionalExpression: function (test, consequent, alternate) {
        return {
            type: astNodeTypes.ConditionalExpression,
            test: test,
            consequent: consequent,
            alternate: alternate
        };
    },

    /**
     * Create an ASTNode representation of a continue statement
     * @param {?ASTNode} label The optional continue label (null if not set)
     * @returns {ASTNode} An ASTNode representing the continue statement
     */
    createContinueStatement: function (label) {
        return {
            type: astNodeTypes.ContinueStatement,
            label: label
        };
    },

    /**
     * Create an ASTNode representation of a debugger statement
     * @returns {ASTNode} An ASTNode representing the debugger statement
     */
    createDebuggerStatement: function () {
        return {
            type: astNodeTypes.DebuggerStatement
        };
    },

    /**
     * Create an ASTNode representation of an empty statement
     * @returns {ASTNode} An ASTNode representing an empty statement
     */
    createEmptyStatement: function () {
        return {
            type: astNodeTypes.EmptyStatement
        };
    },

    /**
     * Create an ASTNode representation of an expression statement
     * @param {ASTNode} expression The expression
     * @returns {ASTNode} An ASTNode representing an expression statement
     */
    createExpressionStatement: function (expression) {
        return {
            type: astNodeTypes.ExpressionStatement,
            expression: expression
        };
    },

    /**
     * Create an ASTNode representation of a while statement
     * @param {ASTNode} test The while conditional
     * @param {ASTNode} body The while loop body
     * @returns {ASTNode} An ASTNode representing a while statement
     */
    createWhileStatement: function (test, body) {
        return {
            type: astNodeTypes.WhileStatement,
            test: test,
            body: body
        };
    },

    /**
     * Create an ASTNode representation of a do..while statement
     * @param {ASTNode} test The do..while conditional
     * @param {ASTNode} body The do..while loop body
     * @returns {ASTNode} An ASTNode representing a do..while statement
     */
    createDoWhileStatement: function (test, body) {
        return {
            type: astNodeTypes.DoWhileStatement,
            body: body,
            test: test
        };
    },

    /**
     * Create an ASTNode representation of a for statement
     * @param {ASTNode} init The initialization expression
     * @param {ASTNode} test The conditional test expression
     * @param {ASTNode} update The update expression
     * @param {ASTNode} body The statement body
     * @returns {ASTNode} An ASTNode representing a for statement
     */
    createForStatement: function (init, test, update, body) {
        return {
            type: astNodeTypes.ForStatement,
            init: init,
            test: test,
            update: update,
            body: body
        };
    },

    /**
     * Create an ASTNode representation of a for..in statement
     * @param {ASTNode} left The left-side variable for the property name
     * @param {ASTNode} right The right-side object
     * @param {ASTNode} body The statement body
     * @returns {ASTNode} An ASTNode representing a for..in statement
     */
    createForInStatement: function (left, right, body) {
        return {
            type: astNodeTypes.ForInStatement,
            left: left,
            right: right,
            body: body,
            each: false
        };
    },

    /**
     * Create an ASTNode representation of a for..of statement
     * @param {ASTNode} left The left-side variable for the property value
     * @param {ASTNode} right The right-side object
     * @param {ASTNode} body The statement body
     * @returns {ASTNode} An ASTNode representing a for..of statement
     */
    createForOfStatement: function (left, right, body) {
        return {
            type: astNodeTypes.ForOfStatement,
            left: left,
            right: right,
            body: body
        };
    },

    /**
     * Create an ASTNode representation of a function declaration
     * @param {ASTNode} id The function name
     * @param {ASTNode} params The function arguments
     * @param {ASTNode} defaults Any default arguments (ES6-only feature)
     * @param {ASTNode} body The function body
     * @param {ASTNode} rest The node representing a rest argument.
     * @param {boolean} generator True if the function is a generator, false if not.
     * @param {boolean} expression True if the function is created via an expression.
     *      Always false for declarations, but kept here to be in sync with
     *      FunctionExpression objects.
     * @returns {ASTNode} An ASTNode representing a function declaration
     */
    createFunctionDeclaration: function (id, params, defaults, body, rest, generator, expression) {
        return {
            type: astNodeTypes.FunctionDeclaration,
            id: id,
            params: params || [],
            defaults: defaults || [],
            body: body,
            rest: rest || null,
            generator: !!generator,
            expression: !!expression
        };
    },

    /**
     * Create an ASTNode representation of a function expression
     * @param {ASTNode} id The function name
     * @param {ASTNode} params The function arguments
     * @param {ASTNode} defaults Any default arguments (ES6-only feature)
     * @param {ASTNode} body The function body
     * @param {ASTNode} rest The node representing a rest argument.
     * @param {boolean} generator True if the function is a generator, false if not.
     * @param {boolean} expression True if the function is created via an expression.
     * @returns {ASTNode} An ASTNode representing a function declaration
     */
    createFunctionExpression: function (id, params, defaults, body, rest, generator, expression) {
        return {
            type: astNodeTypes.FunctionExpression,
            id: id,
            params: params || [],
            defaults: defaults || [],
            body: body,
            rest: rest || null,
            generator: !!generator,
            expression: !!expression
        };
    },

    /**
     * Create an ASTNode representation of an identifier
     * @param {ASTNode} name The identifier name
     * @returns {ASTNode} An ASTNode representing an identifier
     */
    createIdentifier: function (name) {
        return {
            type: astNodeTypes.Identifier,
            name: name
        };
    },

    /**
     * Create an ASTNode representation of an if statement
     * @param {ASTNode} test The if conditional expression
     * @param {ASTNode} consequent The consequent if statement to run
     * @param {ASTNode} alternate the "else" alternate statement
     * @returns {ASTNode} An ASTNode representing an if statement
     */
    createIfStatement: function (test, consequent, alternate) {
        return {
            type: astNodeTypes.IfStatement,
            test: test,
            consequent: consequent,
            alternate: alternate
        };
    },

    /**
     * Create an ASTNode representation of a labeled statement
     * @param {ASTNode} label The statement label
     * @param {ASTNode} body The labeled statement body
     * @returns {ASTNode} An ASTNode representing a labeled statement
     */
    createLabeledStatement: function (label, body) {
        return {
            type: astNodeTypes.LabeledStatement,
            label: label,
            body: body
        };
    },

    /**
     * Create an ASTNode literal from the source code
     * @param {ASTNode} token The ASTNode token
     * @param {string} source The source code to get the literal from
     * @returns {ASTNode} An ASTNode representing the new literal
     */
    createLiteralFromSource: function (token, source) {
        var node = {
            type: astNodeTypes.Literal,
            value: token.value,
            raw: source.slice(token.range[0], token.range[1])
        };

        // regular expressions have regex properties
        if (token.regex) {
            node.regex = token.regex;
        }

        return node;
    },

    /**
     * Create an ASTNode template element
     * @param {Object} value Data on the element value
     * @param {string} value.raw The raw template string
     * @param {string} value.cooked The processed template string
     * @param {boolean} tail True if this is the final element in a template string
     * @returns {ASTNode} An ASTNode representing the template string element
     */
    createTemplateElement: function (value, tail) {
        return {
            type: astNodeTypes.TemplateElement,
            value: value,
            tail: tail
        };
    },

    /**
     * Create an ASTNode template literal
     * @param {ASTNode[]} quasis An array of the template string elements
     * @param {ASTNode[]} expressions An array of the template string expressions
     * @returns {ASTNode} An ASTNode representing the template string
     */
    createTemplateLiteral: function (quasis, expressions) {
        return {
            type: astNodeTypes.TemplateLiteral,
            quasis: quasis,
            expressions: expressions
        };
    },

    /**
     * Create an ASTNode representation of a spread element
     * @param {ASTNode} argument The array being spread
     * @returns {ASTNode} An ASTNode representing a spread element
     */
    createSpreadElement: function (argument) {
        return {
            type: astNodeTypes.SpreadElement,
            argument: argument
        };
    },

    /**
     * Create an ASTNode tagged template expression
     * @param {ASTNode} tag The tag expression
     * @param {ASTNode} quasi A TemplateLiteral ASTNode representing
     * the template string itself.
     * @returns {ASTNode} An ASTNode representing the tagged template
     */
    createTaggedTemplateExpression: function (tag, quasi) {
        return {
            type: astNodeTypes.TaggedTemplateExpression,
            tag: tag,
            quasi: quasi
        };
    },

    /**
     * Create an ASTNode representation of a member expression
     * @param {string} accessor The member access method (bracket or period)
     * @param {ASTNode} object The object being referenced
     * @param {ASTNode} property The object-property being referenced
     * @returns {ASTNode} An ASTNode representing a member expression
     */
    createMemberExpression: function (accessor, object, property) {
        return {
            type: astNodeTypes.MemberExpression,
            computed: accessor === "[",
            object: object,
            property: property
        };
    },

    /**
     * Create an ASTNode representation of a new expression
     * @param {ASTNode} callee The constructor for the new object type
     * @param {ASTNode} args The arguments passed to the constructor
     * @returns {ASTNode} An ASTNode representing a new expression
     */
    createNewExpression: function (callee, args) {
        return {
            type: astNodeTypes.NewExpression,
            callee: callee,
            "arguments": args
        };
    },

    /**
     * Create an ASTNode representation of a new object expression
     * @param {ASTNode[]} properties An array of ASTNodes that represent all object
     *      properties and associated values
     * @returns {ASTNode} An ASTNode representing a new object expression
     */
    createObjectExpression: function (properties) {
        return {
            type: astNodeTypes.ObjectExpression,
            properties: properties
        };
    },

    /**
     * Create an ASTNode representation of a postfix expression
     * @param {string} operator The postfix operator ("++", "--", etc.)
     * @param {ASTNode} argument The operator argument
     * @returns {ASTNode} An ASTNode representing a postfix expression
     */
    createPostfixExpression: function (operator, argument) {
        return {
            type: astNodeTypes.UpdateExpression,
            operator: operator,
            argument: argument,
            prefix: false
        };
    },

    /**
     * Create an ASTNode representation of an entire program
     * @param {ASTNode} body The program body
     * @param {string} sourceType Either "module" or "script".
     * @returns {ASTNode} An ASTNode representing an entire program
     */
    createProgram: function (body, sourceType) {
        return {
            type: astNodeTypes.Program,
            body: body,
            sourceType: sourceType
        };
    },

    /**
     * Create an ASTNode representation of an object property
     * @param {string} kind The type of property represented ("get", "set", etc.)
     * @param {ASTNode} key The property key
     * @param {ASTNode} value The new property value
     * @param {boolean} method True if the property is also a method (value is a function)
     * @param {boolean} shorthand True if the property is shorthand
     * @param {boolean} computed True if the property value has been computed
     * @returns {ASTNode} An ASTNode representing an object property
     */
    createProperty: function (kind, key, value, method, shorthand, computed) {
        return {
            type: astNodeTypes.Property,
            key: key,
            value: value,
            kind: kind,
            method: method,
            shorthand: shorthand,
            computed: computed
        };
    },

    /**
     * Create an ASTNode representation of a return statement
     * @param {?ASTNode} argument The return argument, null if no argument is provided
     * @returns {ASTNode} An ASTNode representing a return statement
     */
    createReturnStatement: function (argument) {
        return {
            type: astNodeTypes.ReturnStatement,
            argument: argument
        };
    },

    /**
     * Create an ASTNode representation of a sequence of expressions
     * @param {ASTNode[]} expressions An array containing each expression, in order
     * @returns {ASTNode} An ASTNode representing a sequence of expressions
     */
    createSequenceExpression: function (expressions) {
        return {
            type: astNodeTypes.SequenceExpression,
            expressions: expressions
        };
    },

    /**
     * Create an ASTNode representation of a switch case statement
     * @param {ASTNode} test The case value to test against the switch value
     * @param {ASTNode} consequent The consequent case statement
     * @returns {ASTNode} An ASTNode representing a switch case
     */
    createSwitchCase: function (test, consequent) {
        return {
            type: astNodeTypes.SwitchCase,
            test: test,
            consequent: consequent
        };
    },

    /**
     * Create an ASTNode representation of a switch statement
     * @param {ASTNode} discriminant An expression to test against each case value
     * @param {ASTNode[]} cases An array of switch case statements
     * @returns {ASTNode} An ASTNode representing a switch statement
     */
    createSwitchStatement: function (discriminant, cases) {
        return {
            type: astNodeTypes.SwitchStatement,
            discriminant: discriminant,
            cases: cases
        };
    },

    /**
     * Create an ASTNode representation of a this statement
     * @returns {ASTNode} An ASTNode representing a this statement
     */
    createThisExpression: function () {
        return {
            type: astNodeTypes.ThisExpression
        };
    },

    /**
     * Create an ASTNode representation of a throw statement
     * @param {ASTNode} argument The argument to throw
     * @returns {ASTNode} An ASTNode representing a throw statement
     */
    createThrowStatement: function (argument) {
        return {
            type: astNodeTypes.ThrowStatement,
            argument: argument
        };
    },

    /**
     * Create an ASTNode representation of a try statement
     * @param {ASTNode} block The try block
     * @param {ASTNode} handler A catch handler
     * @param {?ASTNode} finalizer The final code block to run after the try/catch has run
     * @returns {ASTNode} An ASTNode representing a try statement
     */
    createTryStatement: function (block, handler, finalizer) {
        return {
            type: astNodeTypes.TryStatement,
            block: block,
            guardedHandlers: [],
            handlers: handler ? [ handler ] : [],
            handler: handler,
            finalizer: finalizer
        };
    },

    /**
     * Create an ASTNode representation of a unary expression
     * @param {string} operator The unary operator
     * @param {ASTNode} argument The unary operand
     * @returns {ASTNode} An ASTNode representing a unary expression
     */
    createUnaryExpression: function (operator, argument) {
        if (operator === "++" || operator === "--") {
            return {
                type: astNodeTypes.UpdateExpression,
                operator: operator,
                argument: argument,
                prefix: true
            };
        }
        return {
            type: astNodeTypes.UnaryExpression,
            operator: operator,
            argument: argument,
            prefix: true
        };
    },

    /**
     * Create an ASTNode representation of a variable declaration
     * @param {ASTNode[]} declarations An array of variable declarations
     * @param {string} kind The kind of variable created ("var", "let", etc.)
     * @returns {ASTNode} An ASTNode representing a variable declaration
     */
    createVariableDeclaration: function (declarations, kind) {
        return {
            type: astNodeTypes.VariableDeclaration,
            declarations: declarations,
            kind: kind
        };
    },

    /**
     * Create an ASTNode representation of a variable declarator
     * @param {ASTNode} id The variable ID
     * @param {ASTNode} init The variable's initial value
     * @returns {ASTNode} An ASTNode representing a variable declarator
     */
    createVariableDeclarator: function (id, init) {
        return {
            type: astNodeTypes.VariableDeclarator,
            id: id,
            init: init
        };
    },

    /**
     * Create an ASTNode representation of a with statement
     * @param {ASTNode} object The with statement object expression
     * @param {ASTNode} body The with statement body
     * @returns {ASTNode} An ASTNode representing a with statement
     */
    createWithStatement: function (object, body) {
        return {
            type: astNodeTypes.WithStatement,
            object: object,
            body: body
        };
    },

    createYieldExpression: function (argument, delegate) {
        return {
            type: astNodeTypes.YieldExpression,
            argument: argument,
            delegate: delegate
        };
    },

    createJSXAttribute: function (name, value) {
        return {
            type: astNodeTypes.JSXAttribute,
            name: name,
            value: value || null
        };
    },

    createJSXSpreadAttribute: function (argument) {
        return {
            type: astNodeTypes.JSXSpreadAttribute,
            argument: argument
        };
    },

    createJSXIdentifier: function (name) {
        return {
            type: astNodeTypes.JSXIdentifier,
            name: name
        };
    },

    createJSXNamespacedName: function (namespace, name) {
        return {
            type: astNodeTypes.JSXNamespacedName,
            namespace: namespace,
            name: name
        };
    },

    createJSXMemberExpression: function (object, property) {
        return {
            type: astNodeTypes.JSXMemberExpression,
            object: object,
            property: property
        };
    },

    createJSXElement: function (openingElement, closingElement, children) {
        return {
            type: astNodeTypes.JSXElement,
            openingElement: openingElement,
            closingElement: closingElement,
            children: children
        };
    },

    createJSXEmptyExpression: function () {
        return {
            type: astNodeTypes.JSXEmptyExpression
        };
    },

    createJSXExpressionContainer: function (expression) {
        return {
            type: astNodeTypes.JSXExpressionContainer,
            expression: expression
        };
    },

    createJSXOpeningElement: function (name, attributes, selfClosing) {
        return {
            type: astNodeTypes.JSXOpeningElement,
            name: name,
            selfClosing: selfClosing,
            attributes: attributes
        };
    },

    createJSXClosingElement: function (name) {
        return {
            type: astNodeTypes.JSXClosingElement,
            name: name
        };
    },

    createExportSpecifier: function (local, exported) {
        return {
            type: astNodeTypes.ExportSpecifier,
            exported: exported || local,
            local: local
        };
    },

    createImportDefaultSpecifier: function (local) {
        return {
            type: astNodeTypes.ImportDefaultSpecifier,
            local: local
        };
    },

    createImportNamespaceSpecifier: function (local) {
        return {
            type: astNodeTypes.ImportNamespaceSpecifier,
            local: local
        };
    },

    createExportNamedDeclaration: function (declaration, specifiers, source) {
        return {
            type: astNodeTypes.ExportNamedDeclaration,
            declaration: declaration,
            specifiers: specifiers,
            source: source
        };
    },

    createExportDefaultDeclaration: function (declaration) {
        return {
            type: astNodeTypes.ExportDefaultDeclaration,
            declaration: declaration
        };
    },

    createExportAllDeclaration: function (source) {
        return {
            type: astNodeTypes.ExportAllDeclaration,
            source: source
        };
    },

    createImportSpecifier: function (local, imported) {
        return {
            type: astNodeTypes.ImportSpecifier,
            local: local || imported,
            imported: imported
        };
    },

    createImportDeclaration: function (specifiers, source) {
        return {
            type: astNodeTypes.ImportDeclaration,
            specifiers: specifiers,
            source: source
        };
    }

};

},{"./ast-node-types":60}],60:[function(require,module,exports){
/**
 * @fileoverview The AST node types produced by the parser.
 * @author Nicholas C. Zakas
 * @copyright 2014 Nicholas C. Zakas. All rights reserved.
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {
    AssignmentExpression: "AssignmentExpression",
    AssignmentPattern: "AssignmentPattern",
    ArrayExpression: "ArrayExpression",
    ArrayPattern: "ArrayPattern",
    ArrowFunctionExpression: "ArrowFunctionExpression",
    BlockStatement: "BlockStatement",
    BinaryExpression: "BinaryExpression",
    BreakStatement: "BreakStatement",
    CallExpression: "CallExpression",
    CatchClause: "CatchClause",
    ClassBody: "ClassBody",
    ClassDeclaration: "ClassDeclaration",
    ClassExpression: "ClassExpression",
    ConditionalExpression: "ConditionalExpression",
    ContinueStatement: "ContinueStatement",
    DoWhileStatement: "DoWhileStatement",
    DebuggerStatement: "DebuggerStatement",
    EmptyStatement: "EmptyStatement",
    ExpressionStatement: "ExpressionStatement",
    ForStatement: "ForStatement",
    ForInStatement: "ForInStatement",
    ForOfStatement: "ForOfStatement",
    FunctionDeclaration: "FunctionDeclaration",
    FunctionExpression: "FunctionExpression",
    Identifier: "Identifier",
    IfStatement: "IfStatement",
    Literal: "Literal",
    LabeledStatement: "LabeledStatement",
    LogicalExpression: "LogicalExpression",
    MemberExpression: "MemberExpression",
    MethodDefinition: "MethodDefinition",
    NewExpression: "NewExpression",
    ObjectExpression: "ObjectExpression",
    ObjectPattern: "ObjectPattern",
    Program: "Program",
    Property: "Property",
    ReturnStatement: "ReturnStatement",
    SequenceExpression: "SequenceExpression",
    SpreadElement: "SpreadElement",
    SwitchCase: "SwitchCase",
    SwitchStatement: "SwitchStatement",
    TaggedTemplateExpression: "TaggedTemplateExpression",
    TemplateElement: "TemplateElement",
    TemplateLiteral: "TemplateLiteral",
    ThisExpression: "ThisExpression",
    ThrowStatement: "ThrowStatement",
    TryStatement: "TryStatement",
    UnaryExpression: "UnaryExpression",
    UpdateExpression: "UpdateExpression",
    VariableDeclaration: "VariableDeclaration",
    VariableDeclarator: "VariableDeclarator",
    WhileStatement: "WhileStatement",
    WithStatement: "WithStatement",
    YieldExpression: "YieldExpression",
    JSXIdentifier: "JSXIdentifier",
    JSXNamespacedName: "JSXNamespacedName",
    JSXMemberExpression: "JSXMemberExpression",
    JSXEmptyExpression: "JSXEmptyExpression",
    JSXExpressionContainer: "JSXExpressionContainer",
    JSXElement: "JSXElement",
    JSXClosingElement: "JSXClosingElement",
    JSXOpeningElement: "JSXOpeningElement",
    JSXAttribute: "JSXAttribute",
    JSXSpreadAttribute: "JSXSpreadAttribute",
    JSXText: "JSXText",
    ExportDefaultDeclaration: "ExportDefaultDeclaration",
    ExportNamedDeclaration: "ExportNamedDeclaration",
    ExportAllDeclaration: "ExportAllDeclaration",
    ExportSpecifier: "ExportSpecifier",
    ImportDeclaration: "ImportDeclaration",
    ImportSpecifier: "ImportSpecifier",
    ImportDefaultSpecifier: "ImportDefaultSpecifier",
    ImportNamespaceSpecifier: "ImportNamespaceSpecifier"
};

},{}],61:[function(require,module,exports){
/**
 * @fileoverview Attaches comments to the AST.
 * @author Nicholas C. Zakas
 * @copyright 2015 Nicholas C. Zakas. All rights reserved.
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var astNodeTypes = require("./ast-node-types");

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

var extra = {
        trailingComments: [],
        leadingComments: [],
        bottomRightStack: []
    };

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {

    reset: function() {
        extra.trailingComments = [];
        extra.leadingComments = [];
        extra.bottomRightStack = [];
    },

    addComment: function(comment) {
        extra.trailingComments.push(comment);
        extra.leadingComments.push(comment);
    },

    processComment: function(node) {
        var lastChild,
            trailingComments,
            i;

        if (node.type === astNodeTypes.Program) {
            if (node.body.length > 0) {
                return;
            }
        }

        if (extra.trailingComments.length > 0) {

            /*
             * If the first comment in trailingComments comes after the
             * current node, then we're good - all comments in the array will
             * come after the node and so it's safe to add then as official
             * trailingComments.
             */
            if (extra.trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = extra.trailingComments;
                extra.trailingComments = [];
            } else {

                /*
                 * Otherwise, if the first comment doesn't come after the
                 * current node, that means we have a mix of leading and trailing
                 * comments in the array and that leadingComments contains the
                 * same items as trailingComments. Reset trailingComments to
                 * zero items and we'll handle this by evaluating leadingComments
                 * later.
                 */
                extra.trailingComments.length = 0;
            }
        } else {
            if (extra.bottomRightStack.length > 0 &&
                    extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments &&
                    extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
                delete extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
            }
        }

        // Eating the stack.
        while (extra.bottomRightStack.length > 0 && extra.bottomRightStack[extra.bottomRightStack.length - 1].range[0] >= node.range[0]) {
            lastChild = extra.bottomRightStack.pop();
        }

        if (lastChild) {
            if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= node.range[0]) {
                node.leadingComments = lastChild.leadingComments;
                delete lastChild.leadingComments;
            }
        } else if (extra.leadingComments.length > 0) {

            if (extra.leadingComments[extra.leadingComments.length - 1].range[1] <= node.range[0]) {
                node.leadingComments = extra.leadingComments;
                extra.leadingComments = [];
            } else {

                // https://github.com/eslint/espree/issues/2

                /*
                 * In special cases, such as return (without a value) and
                 * debugger, all comments will end up as leadingComments and
                 * will otherwise be eliminated. This extra step runs when the
                 * bottomRightStack is empty and there are comments left
                 * in leadingComments.
                 *
                 * This loop figures out the stopping point between the actual
                 * leading and trailing comments by finding the location of the
                 * first comment that comes after the given node.
                 */
                for (i = 0; i < extra.leadingComments.length; i++) {
                    if (extra.leadingComments[i].range[1] > node.range[0]) {
                        break;
                    }
                }

                /*
                 * Split the array based on the location of the first comment
                 * that comes after the node. Keep in mind that this could
                 * result in an empty array, and if so, the array must be
                 * deleted.
                 */
                node.leadingComments = extra.leadingComments.slice(0, i);
                if (node.leadingComments.length === 0) {
                    delete node.leadingComments;
                }

                /*
                 * Similarly, trailing comments are attached later. The variable
                 * must be reset to null if there are no trailing comments.
                 */
                trailingComments = extra.leadingComments.slice(i);
                if (trailingComments.length === 0) {
                    trailingComments = null;
                }
            }
        }

        if (trailingComments) {
            node.trailingComments = trailingComments;
        }

        extra.bottomRightStack.push(node);
    }

};

},{"./ast-node-types":60}],62:[function(require,module,exports){
/**
 * @fileoverview The list of feature flags supported by the parser and their default
 *      settings.
 * @author Nicholas C. Zakas
 * @copyright 2015 Fred K. Schott. All rights reserved.
 * @copyright 2014 Nicholas C. Zakas. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {

    // enable parsing of arrow functions
    arrowFunctions: false,

    // enable parsing of let and const
    blockBindings: true,

    // enable parsing of destructured arrays and objects
    destructuring: false,

    // enable parsing of regex u flag
    regexUFlag: false,

    // enable parsing of regex y flag
    regexYFlag: false,

    // enable parsing of template strings
    templateStrings: false,

    // enable parsing binary literals
    binaryLiterals: false,

    // enable parsing ES6 octal literals
    octalLiterals: false,

    // enable parsing unicode code point escape sequences
    unicodeCodePointEscapes: true,

    // enable parsing of default parameters
    defaultParams: false,

    // enable parsing of rest parameters
    restParams: false,

    // enable parsing of for-of statements
    forOf: false,

    // enable parsing computed object literal properties
    objectLiteralComputedProperties: false,

    // enable parsing of shorthand object literal methods
    objectLiteralShorthandMethods: false,

    // enable parsing of shorthand object literal properties
    objectLiteralShorthandProperties: false,

    // Allow duplicate object literal properties (except '__proto__')
    objectLiteralDuplicateProperties: false,

    // enable parsing of generators/yield
    generators: false,

    // support the spread operator
    spread: false,

    // enable super in functions
    superInFunctions: false,

    // enable parsing of classes
    classes: false,

    // enable parsing of modules
    modules: false,

    // React JSX parsing
    jsx: false,

    // allow return statement in global scope
    globalReturn: false
};

},{}],63:[function(require,module,exports){
/**
 * @fileoverview Error messages returned by the parser.
 * @author Nicholas C. Zakas
 * @copyright 2014 Nicholas C. Zakas. All rights reserved.
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

// error messages should be identical to V8 where possible
module.exports = {
    UnexpectedToken: "Unexpected token %0",
    UnexpectedNumber: "Unexpected number",
    UnexpectedString: "Unexpected string",
    UnexpectedIdentifier: "Unexpected identifier",
    UnexpectedReserved: "Unexpected reserved word",
    UnexpectedTemplate: "Unexpected quasi %0",
    UnexpectedEOS: "Unexpected end of input",
    NewlineAfterThrow: "Illegal newline after throw",
    InvalidRegExp: "Invalid regular expression",
    InvalidRegExpFlag: "Invalid regular expression flag",
    UnterminatedRegExp: "Invalid regular expression: missing /",
    InvalidLHSInAssignment: "Invalid left-hand side in assignment",
    InvalidLHSInFormalsList: "Invalid left-hand side in formals list",
    InvalidLHSInForIn: "Invalid left-hand side in for-in",
    MultipleDefaultsInSwitch: "More than one default clause in switch statement",
    NoCatchOrFinally: "Missing catch or finally after try",
    NoUnintializedConst: "Const must be initialized",
    UnknownLabel: "Undefined label '%0'",
    Redeclaration: "%0 '%1' has already been declared",
    IllegalContinue: "Illegal continue statement",
    IllegalBreak: "Illegal break statement",
    IllegalReturn: "Illegal return statement",
    IllegalYield: "Illegal yield expression",
    IllegalSpread: "Illegal spread element",
    StrictModeWith: "Strict mode code may not include a with statement",
    StrictCatchVariable: "Catch variable may not be eval or arguments in strict mode",
    StrictVarName: "Variable name may not be eval or arguments in strict mode",
    StrictParamName: "Parameter name eval or arguments is not allowed in strict mode",
    StrictParamDupe: "Strict mode function may not have duplicate parameter names",
    TemplateOctalLiteral: "Octal literals are not allowed in template strings.",
    ParameterAfterRestParameter: "Rest parameter must be final parameter of an argument list",
    DefaultRestParameter: "Rest parameter can not have a default value",
    ElementAfterSpreadElement: "Spread must be the final element of an element list",
    ObjectPatternAsRestParameter: "Invalid rest parameter",
    ObjectPatternAsSpread: "Invalid spread argument",
    StrictFunctionName: "Function name may not be eval or arguments in strict mode",
    StrictOctalLiteral: "Octal literals are not allowed in strict mode.",
    StrictDelete: "Delete of an unqualified identifier in strict mode.",
    StrictDuplicateProperty: "Duplicate data property in object literal not allowed in strict mode",
    DuplicatePrototypeProperty: "Duplicate '__proto__' property in object literal are not allowed",
    ConstructorSpecialMethod: "Class constructor may not be an accessor",
    DuplicateConstructor: "A class may only have one constructor",
    StaticPrototype: "Classes may not have static property named prototype",
    AccessorDataProperty: "Object literal may not have data and accessor property with the same name",
    AccessorGetSet: "Object literal may not have multiple get/set accessors with the same name",
    StrictLHSAssignment: "Assignment to eval or arguments is not allowed in strict mode",
    StrictLHSPostfix: "Postfix increment/decrement may not have eval or arguments operand in strict mode",
    StrictLHSPrefix: "Prefix increment/decrement may not have eval or arguments operand in strict mode",
    StrictReservedWord: "Use of future reserved word in strict mode",
    InvalidJSXAttributeValue: "JSX value should be either an expression or a quoted JSX text",
    ExpectedJSXClosingTag: "Expected corresponding JSX closing tag for %0",
    AdjacentJSXElements: "Adjacent JSX elements must be wrapped in an enclosing tag",
    MissingFromClause: "Missing from clause",
    NoAsAfterImportNamespace: "Missing as after import *",
    InvalidModuleSpecifier: "Invalid module specifier",
    IllegalImportDeclaration: "Illegal import declaration",
    IllegalExportDeclaration: "Illegal export declaration"
};

},{}],64:[function(require,module,exports){
/**
 * @fileoverview A simple map that helps avoid collisions on the Object prototype.
 * @author Jamund Ferguson
 * @copyright 2015 Jamund Ferguson. All rights reserved.
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

function StringMap() {
    this.$data = {};
}

StringMap.prototype.get = function (key) {
    key = "$" + key;
    return this.$data[key];
};

StringMap.prototype.set = function (key, value) {
    key = "$" + key;
    this.$data[key] = value;
    return this;
};

StringMap.prototype.has = function (key) {
    key = "$" + key;
    return Object.prototype.hasOwnProperty.call(this.$data, key);
};

StringMap.prototype.delete = function (key) {
    key = "$" + key;
    return delete this.$data[key];
};

module.exports = StringMap;

},{}],65:[function(require,module,exports){
/**
 * @fileoverview Various syntax/pattern checks for parsing.
 * @author Nicholas C. Zakas
 * @copyright 2014 Nicholas C. Zakas. All rights reserved.
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 * @copyright 2012-2013 Mathias Bynens <mathias@qiwi.be>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

// See also tools/generate-identifier-regex.js.
var Regex = {
    NonAsciiIdentifierStart: new RegExp("[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]"),
    NonAsciiIdentifierPart: new RegExp("[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]"),
    LeadingZeros: new RegExp("^0+(?!$)")
};

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {

    Regex: Regex,

    isDecimalDigit: function(ch) {
        return (ch >= 48 && ch <= 57);   // 0..9
    },

    isHexDigit: function(ch) {
        return "0123456789abcdefABCDEF".indexOf(ch) >= 0;
    },

    isOctalDigit: function(ch) {
        return "01234567".indexOf(ch) >= 0;
    },

    // 7.2 White Space

    isWhiteSpace: function(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    },

    // 7.3 Line Terminators

    isLineTerminator: function(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    },

    // 7.6 Identifier Names and Identifiers

    isIdentifierStart: function(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    },

    isIdentifierPart: function(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    },

    // 7.6.1.2 Future Reserved Words

    isFutureReservedWord: function(id) {
        switch (id) {
            case "class":
            case "enum":
            case "export":
            case "extends":
            case "import":
            case "super":
                return true;
            default:
                return false;
        }
    },

    isStrictModeReservedWord: function(id) {
        switch (id) {
            case "implements":
            case "interface":
            case "package":
            case "private":
            case "protected":
            case "public":
            case "static":
            case "yield":
            case "let":
                return true;
            default:
                return false;
        }
    },

    isRestrictedWord: function(id) {
        return id === "eval" || id === "arguments";
    },

    // 7.6.1.1 Keywords

    isKeyword: function(id, strict, ecmaFeatures) {

        if (strict && this.isStrictModeReservedWord(id)) {
            return true;
        }

        // "const" is specialized as Keyword in V8.
        // "yield" and "let" are for compatiblity with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
            case 2:
                return (id === "if") || (id === "in") || (id === "do");
            case 3:
                return (id === "var") || (id === "for") || (id === "new") ||
                    (id === "try") || (id === "let");
            case 4:
                return (id === "this") || (id === "else") || (id === "case") ||
                    (id === "void") || (id === "with") || (id === "enum");
            case 5:
                return (id === "while") || (id === "break") || (id === "catch") ||
                    (id === "throw") || (id === "const") || (!ecmaFeatures.generators && id === "yield") ||
                    (id === "class") || (id === "super");
            case 6:
                return (id === "return") || (id === "typeof") || (id === "delete") ||
                    (id === "switch") || (id === "export") || (id === "import");
            case 7:
                return (id === "default") || (id === "finally") || (id === "extends");
            case 8:
                return (id === "function") || (id === "continue") || (id === "debugger");
            case 10:
                return (id === "instanceof");
            default:
                return false;
        }
    },

    isJSXIdentifierStart: function(ch) {
        // exclude backslash (\)
        return (ch !== 92) && this.isIdentifierStart(ch);
    },

    isJSXIdentifierPart: function(ch) {
        // exclude backslash (\) and add hyphen (-)
        return (ch !== 92) && (ch === 45 || this.isIdentifierPart(ch));
    }


};

},{}],66:[function(require,module,exports){
/**
 * @fileoverview Contains token information.
 * @author Nicholas C. Zakas
 * @copyright 2014 Nicholas C. Zakas. All rights reserved.
 * @copyright 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
 * @copyright 2011-2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

var Token = {
    BooleanLiteral: 1,
    EOF: 2,
    Identifier: 3,
    Keyword: 4,
    NullLiteral: 5,
    NumericLiteral: 6,
    Punctuator: 7,
    StringLiteral: 8,
    RegularExpression: 9,
    Template: 10,
    JSXIdentifier: 11,
    JSXText: 12
};

var TokenName = {};
TokenName[Token.BooleanLiteral] = "Boolean";
TokenName[Token.EOF] = "<end>";
TokenName[Token.Identifier] = "Identifier";
TokenName[Token.Keyword] = "Keyword";
TokenName[Token.NullLiteral] = "Null";
TokenName[Token.NumericLiteral] = "Numeric";
TokenName[Token.Punctuator] = "Punctuator";
TokenName[Token.StringLiteral] = "String";
TokenName[Token.RegularExpression] = "RegularExpression";
TokenName[Token.Template] = "Template";
TokenName[Token.JSXIdentifier] = "JSXIdentifier";
TokenName[Token.JSXText] = "JSXText";

// A function following one of those tokens is an expression.
var FnExprTokens = ["(", "{", "[", "in", "typeof", "instanceof", "new",
                "return", "case", "delete", "throw", "void",
                // assignment operators
                "=", "+=", "-=", "*=", "/=", "%=", "<<=", ">>=", ">>>=",
                "&=", "|=", "^=", ",",
                // binary/unary operators
                "+", "-", "*", "/", "%", "++", "--", "<<", ">>", ">>>", "&",
                "|", "^", "!", "~", "&&", "||", "?", ":", "===", "==", ">=",
                "<=", "<", ">", "!=", "!=="];


//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {
    Token: Token,
    TokenName: TokenName,
    FnExprTokens: FnExprTokens
};

},{}],67:[function(require,module,exports){
/**
 * @fileoverview The list of XHTML entities that are valid in JSX.
 * @author Nicholas C. Zakas
 * @copyright 2014 Nicholas C. Zakas. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {
    quot: "\u0022",
    amp: "&",
    apos: "\u0027",
    lt: "<",
    gt: ">",
    nbsp: "\u00A0",
    iexcl: "\u00A1",
    cent: "\u00A2",
    pound: "\u00A3",
    curren: "\u00A4",
    yen: "\u00A5",
    brvbar: "\u00A6",
    sect: "\u00A7",
    uml: "\u00A8",
    copy: "\u00A9",
    ordf: "\u00AA",
    laquo: "\u00AB",
    not: "\u00AC",
    shy: "\u00AD",
    reg: "\u00AE",
    macr: "\u00AF",
    deg: "\u00B0",
    plusmn: "\u00B1",
    sup2: "\u00B2",
    sup3: "\u00B3",
    acute: "\u00B4",
    micro: "\u00B5",
    para: "\u00B6",
    middot: "\u00B7",
    cedil: "\u00B8",
    sup1: "\u00B9",
    ordm: "\u00BA",
    raquo: "\u00BB",
    frac14: "\u00BC",
    frac12: "\u00BD",
    frac34: "\u00BE",
    iquest: "\u00BF",
    Agrave: "\u00C0",
    Aacute: "\u00C1",
    Acirc: "\u00C2",
    Atilde: "\u00C3",
    Auml: "\u00C4",
    Aring: "\u00C5",
    AElig: "\u00C6",
    Ccedil: "\u00C7",
    Egrave: "\u00C8",
    Eacute: "\u00C9",
    Ecirc: "\u00CA",
    Euml: "\u00CB",
    Igrave: "\u00CC",
    Iacute: "\u00CD",
    Icirc: "\u00CE",
    Iuml: "\u00CF",
    ETH: "\u00D0",
    Ntilde: "\u00D1",
    Ograve: "\u00D2",
    Oacute: "\u00D3",
    Ocirc: "\u00D4",
    Otilde: "\u00D5",
    Ouml: "\u00D6",
    times: "\u00D7",
    Oslash: "\u00D8",
    Ugrave: "\u00D9",
    Uacute: "\u00DA",
    Ucirc: "\u00DB",
    Uuml: "\u00DC",
    Yacute: "\u00DD",
    THORN: "\u00DE",
    szlig: "\u00DF",
    agrave: "\u00E0",
    aacute: "\u00E1",
    acirc: "\u00E2",
    atilde: "\u00E3",
    auml: "\u00E4",
    aring: "\u00E5",
    aelig: "\u00E6",
    ccedil: "\u00E7",
    egrave: "\u00E8",
    eacute: "\u00E9",
    ecirc: "\u00EA",
    euml: "\u00EB",
    igrave: "\u00EC",
    iacute: "\u00ED",
    icirc: "\u00EE",
    iuml: "\u00EF",
    eth: "\u00F0",
    ntilde: "\u00F1",
    ograve: "\u00F2",
    oacute: "\u00F3",
    ocirc: "\u00F4",
    otilde: "\u00F5",
    ouml: "\u00F6",
    divide: "\u00F7",
    oslash: "\u00F8",
    ugrave: "\u00F9",
    uacute: "\u00FA",
    ucirc: "\u00FB",
    uuml: "\u00FC",
    yacute: "\u00FD",
    thorn: "\u00FE",
    yuml: "\u00FF",
    OElig: "\u0152",
    oelig: "\u0153",
    Scaron: "\u0160",
    scaron: "\u0161",
    Yuml: "\u0178",
    fnof: "\u0192",
    circ: "\u02C6",
    tilde: "\u02DC",
    Alpha: "\u0391",
    Beta: "\u0392",
    Gamma: "\u0393",
    Delta: "\u0394",
    Epsilon: "\u0395",
    Zeta: "\u0396",
    Eta: "\u0397",
    Theta: "\u0398",
    Iota: "\u0399",
    Kappa: "\u039A",
    Lambda: "\u039B",
    Mu: "\u039C",
    Nu: "\u039D",
    Xi: "\u039E",
    Omicron: "\u039F",
    Pi: "\u03A0",
    Rho: "\u03A1",
    Sigma: "\u03A3",
    Tau: "\u03A4",
    Upsilon: "\u03A5",
    Phi: "\u03A6",
    Chi: "\u03A7",
    Psi: "\u03A8",
    Omega: "\u03A9",
    alpha: "\u03B1",
    beta: "\u03B2",
    gamma: "\u03B3",
    delta: "\u03B4",
    epsilon: "\u03B5",
    zeta: "\u03B6",
    eta: "\u03B7",
    theta: "\u03B8",
    iota: "\u03B9",
    kappa: "\u03BA",
    lambda: "\u03BB",
    mu: "\u03BC",
    nu: "\u03BD",
    xi: "\u03BE",
    omicron: "\u03BF",
    pi: "\u03C0",
    rho: "\u03C1",
    sigmaf: "\u03C2",
    sigma: "\u03C3",
    tau: "\u03C4",
    upsilon: "\u03C5",
    phi: "\u03C6",
    chi: "\u03C7",
    psi: "\u03C8",
    omega: "\u03C9",
    thetasym: "\u03D1",
    upsih: "\u03D2",
    piv: "\u03D6",
    ensp: "\u2002",
    emsp: "\u2003",
    thinsp: "\u2009",
    zwnj: "\u200C",
    zwj: "\u200D",
    lrm: "\u200E",
    rlm: "\u200F",
    ndash: "\u2013",
    mdash: "\u2014",
    lsquo: "\u2018",
    rsquo: "\u2019",
    sbquo: "\u201A",
    ldquo: "\u201C",
    rdquo: "\u201D",
    bdquo: "\u201E",
    dagger: "\u2020",
    Dagger: "\u2021",
    bull: "\u2022",
    hellip: "\u2026",
    permil: "\u2030",
    prime: "\u2032",
    Prime: "\u2033",
    lsaquo: "\u2039",
    rsaquo: "\u203A",
    oline: "\u203E",
    frasl: "\u2044",
    euro: "\u20AC",
    image: "\u2111",
    weierp: "\u2118",
    real: "\u211C",
    trade: "\u2122",
    alefsym: "\u2135",
    larr: "\u2190",
    uarr: "\u2191",
    rarr: "\u2192",
    darr: "\u2193",
    harr: "\u2194",
    crarr: "\u21B5",
    lArr: "\u21D0",
    uArr: "\u21D1",
    rArr: "\u21D2",
    dArr: "\u21D3",
    hArr: "\u21D4",
    forall: "\u2200",
    part: "\u2202",
    exist: "\u2203",
    empty: "\u2205",
    nabla: "\u2207",
    isin: "\u2208",
    notin: "\u2209",
    ni: "\u220B",
    prod: "\u220F",
    sum: "\u2211",
    minus: "\u2212",
    lowast: "\u2217",
    radic: "\u221A",
    prop: "\u221D",
    infin: "\u221E",
    ang: "\u2220",
    and: "\u2227",
    or: "\u2228",
    cap: "\u2229",
    cup: "\u222A",
    "int": "\u222B",
    there4: "\u2234",
    sim: "\u223C",
    cong: "\u2245",
    asymp: "\u2248",
    ne: "\u2260",
    equiv: "\u2261",
    le: "\u2264",
    ge: "\u2265",
    sub: "\u2282",
    sup: "\u2283",
    nsub: "\u2284",
    sube: "\u2286",
    supe: "\u2287",
    oplus: "\u2295",
    otimes: "\u2297",
    perp: "\u22A5",
    sdot: "\u22C5",
    lceil: "\u2308",
    rceil: "\u2309",
    lfloor: "\u230A",
    rfloor: "\u230B",
    lang: "\u2329",
    rang: "\u232A",
    loz: "\u25CA",
    spades: "\u2660",
    clubs: "\u2663",
    hearts: "\u2665",
    diams: "\u2666"
};

},{}],68:[function(require,module,exports){
module.exports={
  "name": "espree",
  "description": "An actively-maintained fork of Esprima, the ECMAScript parsing infrastructure for multipurpose analysis",
  "author": {
    "name": "Nicholas C. Zakas",
    "email": "nicholas+npm@nczconsulting.com"
  },
  "homepage": "https://github.com/eslint/espree",
  "main": "espree.js",
  "bin": {
    "esparse": "./bin/esparse.js",
    "esvalidate": "./bin/esvalidate.js"
  },
  "version": "1.12.3",
  "files": [
    "bin",
    "lib",
    "test/run.js",
    "test/runner.js",
    "test/test.js",
    "test/compat.js",
    "test/reflect.js",
    "espree.js"
  ],
  "engines": {
    "node": ">=0.10.0"
  },
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/eslint/espree.git"
  },
  "bugs": {
    "url": "http://github.com/eslint/espree.git"
  },
  "licenses": [
    {
      "type": "BSD",
      "url": "http://github.com/nzakas/espree/raw/master/LICENSE"
    }
  ],
  "devDependencies": {
    "browserify": "^7.0.0",
    "chai": "^1.10.0",
    "complexity-report": "~0.6.1",
    "dateformat": "^1.0.11",
    "eslint": "^0.9.2",
    "esprima": "git://github.com/ariya/esprima.git#harmony",
    "esprima-fb": "^8001.2001.0-dev-harmony-fb",
    "istanbul": "~0.2.6",
    "json-diff": "~0.3.1",
    "leche": "^1.0.1",
    "mocha": "^2.0.1",
    "npm-license": "^0.2.3",
    "optimist": "~0.6.0",
    "regenerate": "~0.5.4",
    "semver": "^4.1.1",
    "shelljs": "^0.3.0",
    "shelljs-nodecli": "^0.1.1",
    "unicode-6.3.0": "~0.1.0"
  },
  "keywords": [
    "ast",
    "ecmascript",
    "javascript",
    "parser",
    "syntax"
  ],
  "scripts": {
    "generate-regex": "node tools/generate-identifier-regex.js",
    "test": "npm run-script lint && node Makefile.js test && node test/run.js",
    "lint": "node Makefile.js lint",
    "patch": "node Makefile.js patch",
    "minor": "node Makefile.js minor",
    "major": "node Makefile.js major",
    "browserify": "node Makefile.js browserify",
    "coverage": "npm run-script analyze-coverage && npm run-script check-coverage",
    "analyze-coverage": "node node_modules/istanbul/lib/cli.js cover test/runner.js",
    "check-coverage": "node node_modules/istanbul/lib/cli.js check-coverage --statement 99 --branch 99 --function 99",
    "complexity": "npm run-script analyze-complexity && npm run-script check-complexity",
    "analyze-complexity": "node tools/list-complexity.js",
    "check-complexity": "node node_modules/complexity-report/src/cli.js --maxcc 14 --silent -l -w espree.js",
    "benchmark": "node test/benchmarks.js",
    "benchmark-quick": "node test/benchmarks.js quick"
  },
  "dependencies": {},
  "gitHead": "ee8f6d35943ed13af619270e320ce2d6109d6796",
  "_id": "espree@1.12.3",
  "_shasum": "04ceeada91bda077a38c040c125ba186b13bb3cc",
  "_from": "espree@>=1.12.3 <2.0.0",
  "_npmVersion": "1.4.28",
  "_npmUser": {
    "name": "nzakas",
    "email": "nicholas@nczconsulting.com"
  },
  "maintainers": [
    {
      "name": "nzakas",
      "email": "nicholas@nczconsulting.com"
    }
  ],
  "dist": {
    "shasum": "04ceeada91bda077a38c040c125ba186b13bb3cc",
    "tarball": "http://registry.npmjs.org/espree/-/espree-1.12.3.tgz"
  },
  "directories": {},
  "_resolved": "https://registry.npmjs.org/espree/-/espree-1.12.3.tgz",
  "readme": "ERROR: No README data found!"
}

},{}],69:[function(require,module,exports){
(function (process,__dirname){
"use strict"

var npmPath = require('npm-path')
var child_process = require('child_process')
var syncExec = require('sync-exec')

var exec = child_process.exec

// polyfill for child_process.execSync
var execSync = child_process.execSync || function(args, path) {
  return syncExec(args, path).stdout
}

var execFile = child_process.execFile
var spawn = child_process.spawn
var fork = child_process.fork
npmExec.spawn = npmSpawn
npmExec.sync = npmExecSync

module.exports = npmExec

function npmExec(args, options, fn) {
  var opts = setOptions(options, fn)
  options = opts[0]
  fn = opts[1]
  getPath(options, function(err, options) {
    if (err) return fn(err)
    exec(args, options, fn)
  })
}

function npmExecSync(args, options) {
  var opts = setOptions(options)
  var path = getPath.sync(opts[0])
  return execSync(args, path).toString()
}

function npmSpawn() {
  var options = {}
  var args = [].slice.apply(arguments)
  // encode args to pass to spawn.js
  args = args.map(function(arg) {
    if (Array.isArray(arg)) return JSON.stringify(arg)
    if (arg.toString() === '[object Object]') {
      options = arg
      return JSON.stringify(arg)
    }
    return arg
  })
  if (options.stdio === 'inherit') options.silent = false
  else options.silent = true
  var child = fork(__dirname + '/spawn.js', args, options)
  child.on('message', function(jsonErr) {
    var err = new Error()
    Object.keys(jsonErr).forEach(function(key) {
      err[key] = jsonErr[key]
    })
    this.emit('error', err)
  })
  return child
}


function getPath(options, fn) {
  npmPath.get(options, function(err, newPath) {
    var env = Object.create(options.env)
    env[npmPath.PATH] = newPath
    options.env = env
    fn(null, options)
  })
}

getPath.sync = function getPathSync(options) {
  var newPath = npmPath.getSync(options)
  var env = Object.create(options.env)
  env[npmPath.PATH] = newPath
  options.env = env
  return options
}

function setOptions(options, fn) {
  if (typeof options == 'function') fn = options, options = null
  options = Object.create(options || {})
  options.env = options.env || process.env
  options.cwd = options.cwd || process.cwd()
  return [options, fn]
}

}).call(this,require('_process'),"/node_modules/npm-run")
},{"_process":4,"child_process":1,"npm-path":70,"sync-exec":74}],70:[function(require,module,exports){
(function (process){
"use strict"

var fs = require('fs')
var path = require('path')
var which = require('which')

var PATH = getPATHKey()
var SEPARATOR = getPATHSeparator()

/**
 * Get new $PATH setting with additional paths supplied by the npm.
 *
 * @param Object options Config options Object.
 * @param Object options.env Environment to use. Default: process.env
 * @param String options.wd Working directory. Default: process.cwd()
 * @param Function fn callback function.
 */

function getPath(options, fn) {
  var wd = options.cwd = options.cwd || process.cwd()
  var env = options.env = options.env || process.env
  var pathArr = getPathArr(options)

  whichNpm(options, function(err, npmPath) {
    if (err) return fn(err)

    // we also unshift the bundled node-gyp-bin folder so that
    // the bundled one will be used for installing things.
    pathArr.unshift(path.join(path.dirname(npmPath), "node-gyp-bin"))
    if (env[PATH]) pathArr.push(env[PATH])
    fn(null, pathArr.join(SEPARATOR))
  })
}

/**
 * Async wrapper around `getPath`.
 */

function getPathAsync(options, fn) {
  // options is optional
  if (options instanceof Function) fn = options, options = {}
  // if no fn, execute as sync
  if (!(fn instanceof Function)) return getPathSync(options)
  options = options || {}
  options.isSync = false
  return getPath(options, fn)
}

/**
 * Sync wrapper around `getPath`.
 */

function getPathSync(options) {
  options = options || {}
  options.isSync = true
  var thePath = undefined
  // sync magic: if sync true, callback is executed sync
  // therefore we can set thePath from inside it before returning
  getPath(options, function(err, foundPath) {
    if (err) throw err
    thePath = foundPath
  })
  return thePath
}

/**
 * Change environment to include npm path adjustments.
 *
 * @param Object options Config options Object.
 * @param Object options.env Environment to use. Default: process.env
 * @param String options.wd Working directory. Default: process.cwd()
 * @param Function fn callback function.
 */

function setPathAsync(options, fn) {
  // options is optional
  if (options instanceof Function) fn = options, options = {}
  // if no fn, execute as sync
  if (!(fn instanceof Function)) return setPathSync(options)

  getPathAsync(options, function(err, newPath) {
    if (err) return fn(err)
    fn(null, options.env[PATH] = newPath)
  })
}

/**
 * Sync version of `setPathAsync`
 */

function setPathSync(options) {
  options = options || {}
  var newPath = getPathSync(options)
  return options.env[PATH] = newPath
}

/**
 * Generate simple parts of the npm path. Basically everything that doesn't
 * depend on potentially async operations.
 *
 * @return Array
 */

function getPathArr(options) {
  var wd = options.cwd
  var pathArr = []
  var p = wd.split("node_modules")
  var acc = path.resolve(p.shift())

  // first add the directory containing the `node` executable currently
  // running, so that any lifecycle script that invoke "node" will execute
  // this same one.
  pathArr.unshift(path.dirname(process.execPath))

  p.forEach(function (pp) {
    pathArr.unshift(path.join(acc, "node_modules", ".bin"))
    acc = path.join(acc, "node_modules", pp)
  })
  pathArr.unshift(path.join(acc, "node_modules", ".bin"))
  return pathArr
}

/**
 * Use callback-style signature but toggle sync execution if `isSync` is true.
 * If options.npm is supplied, this will simply provide npm/bin/npm-cli.
 */

function whichNpm(options, fn) {
  var npmCli = options.npm && path.join(options.npm, 'bin', 'npm-cli.js')

  if (options.isSync) {
    fn(null, fs.realpathSync(
      npmCli || which.sync('npm')
    ))
    return
  }

  if (options.npm) {
    process.nextTick(function() {
      fn(null, npmCli)
    })
    return
  }

  which('npm', function(err, npmPath) {
    if (err) return fn(err)
    fs.realpath(npmPath, fn)
  })
}

/**
 * Get key to use as $PATH in environment
 */

function getPATHKey() {
  var PATH = 'PATH'

  // windows calls it's path "Path" usually, but this is not guaranteed.
  if (process.platform === "win32") {
    PATH = "Path"
    Object.keys(process.env).forEach(function (e) {
      if (e.match(/^PATH$/i)) {
        PATH = e
      }
    })
  }
  return PATH
}

/**
 * Get $PATH separator based on environment
 */

function getPATHSeparator() {
  return process.platform === "win32" ? ";" : ":"
}

module.exports = setPathAsync
module.exports.get = getPathAsync
module.exports.get.sync = getPathSync
module.exports.getSync = getPathSync

module.exports.set = setPathAsync
module.exports.set.sync = setPathSync
module.exports.setSync = setPathSync

module.exports.PATH = PATH
module.exports.SEPARATOR = SEPARATOR

}).call(this,require('_process'))
},{"_process":4,"fs":undefined,"path":3,"which":73}],71:[function(require,module,exports){
/*!
 * is-absolute <https://github.com/jonschlinkert/is-absolute>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var isRelative = require('is-relative');

module.exports = function isAbsolute(filepath) {
  if ('/' === filepath[0]) {
    return true;
  }
  if (':' === filepath[1] && '\\' === filepath[2]) {
    return true;
  }
  // Microsoft Azure absolute filepath
  if ('\\\\' == filepath.substring(0, 2)) {
    return true;
  }
  if (!isRelative(filepath)) {
    return true;
  }
};


},{"is-relative":72}],72:[function(require,module,exports){
'use strict';

/**
 * ```js
 * var isRelative = require('is-relative');
 * isRelative('README.md');
 * //=> true
 * ```
 *
 * @name isRelative
 * @param {String} `filepath` Path to test.
 * @return {Boolean}
 * @api public
 */

module.exports = function isRelative(filepath) {
  if (typeof filepath !== 'string') {
    throw new Error('isRelative expects a string.');
  }
  return !/^([a-z]+:)?[\\\/]/i.test(filepath);
};
},{}],73:[function(require,module,exports){
(function (process){
module.exports = which
which.sync = whichSync

var isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys'

var path = require('path')
var COLON = isWindows ? ';' : ':'
var isExe
var fs = require('fs')
var isAbsolute = require('is-absolute')

var G =  parseInt('0010', 8)
var U =  parseInt('0100', 8)
var UG = parseInt('0110', 8)

if (isWindows) {
  // On windows, there is no good way to check that a file is executable
  isExe = function isExe () { return true }
} else {
  isExe = function isExe (mod, uid, gid) {
    var ret = (mod & 1)
        || (mod & U)  && process.getgid && gid === process.getgid()
        || (mod & G)  && process.getuid && uid === process.getuid()
        || (mod & UG) && process.getuid && 0   === process.getuid()

    if (!ret && process.getgroups && (mod & G)) {
      var groups = process.getgroups()
      for (var g = 0; g < groups.length; g++) {
        if (groups[g] === gid)
          return true
      }
    }

    return ret
  }
}

function getPathInfo(cmd, opt) {
  var colon = opt.colon || COLON
  var pathEnv = opt.path || process.env.PATH || ''
  var pathExt = ['']

  pathEnv = pathEnv.split(colon)

  if (isWindows) {
    pathEnv.unshift(process.cwd())
    pathExt = (opt.pathExt || process.env.PATHEXT || '.EXE').split(colon)
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('')
  }

  // If it's absolute, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  if (isAbsolute(cmd))
    pathEnv = ['']

  return {env: pathEnv, ext: pathExt}
}

function which (cmd, opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }

  var info = getPathInfo(cmd, opt)
  var pathEnv = info.env
  var pathExt = info.ext

  ;(function F (i, l) {
    if (i === l) return cb(new Error('not found: '+cmd))
    var p = path.resolve(pathEnv[i], cmd)
    ;(function E (ii, ll) {
      if (ii === ll) return F(i + 1, l)
      var ext = pathExt[ii]
      fs.stat(p + ext, function (er, stat) {
        if (!er &&
            stat.isFile() &&
            isExe(stat.mode, stat.uid, stat.gid)) {
          return cb(null, p + ext)
        }
        return E(ii + 1, ll)
      })
    })(0, pathExt.length)
  })(0, pathEnv.length)
}

function whichSync (cmd, opt) {
  opt = opt || {}

  var info = getPathInfo(cmd, opt)
  var pathEnv = info.env
  var pathExt = info.ext

  for (var i = 0, l = pathEnv.length; i < l; i ++) {
    var p = path.join(pathEnv[i], cmd)
    for (var j = 0, ll = pathExt.length; j < ll; j ++) {
      var cur = p + pathExt[j]
      var stat
      try {
        stat = fs.statSync(cur)
        if (stat.isFile() && isExe(stat.mode, stat.uid, stat.gid))
          return cur
      } catch (ex) {}
    }
  }

  throw new Error('not found: '+cmd)
}

}).call(this,require('_process'))
},{"_process":4,"fs":undefined,"is-absolute":71,"path":3}],74:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.9.1
(function() {
  var child_process, create_pipes, dir, fs, i, len, name, proxy, read_pipes, ref, timeout, tmp_dir;

  child_process = require('child_process');

  fs = require('fs');

  tmp_dir = '/tmp';

  ref = ['TMPDIR', 'TMP', 'TEMP'];
  for (i = 0, len = ref.length; i < len; i++) {
    name = ref[i];
    if ((dir = process.env[name]) != null) {
      tmp_dir = dir.replace(/\/$/, '');
    }
  }

  timeout = function(limit, msg) {
    if ((new Date).getTime() > limit) {
      throw new Error(msg);
    }
  };

  create_pipes = function() {
    var created, t_limit;
    t_limit = (new Date).getTime() + 1000;
    while (!created) {
      try {
        dir = tmp_dir + '/sync-exec-' + Math.floor(Math.random() * 1000000000);
        fs.mkdir(dir);
        created = true;
      } catch (_error) {}
      timeout(t_limit, 'Can not create sync-exec directory');
    }
    return dir;
  };

  read_pipes = function(dir, max_wait) {
    var deleted, j, len1, pipe, read, ref1, result, t_limit;
    t_limit = (new Date).getTime() + max_wait;
    while (!read) {
      try {
        if (fs.readFileSync(dir + '/done').length) {
          read = true;
        }
      } catch (_error) {}
      timeout(t_limit, 'Process execution timeout or exit flag read failure');
    }
    while (!deleted) {
      try {
        fs.unlinkSync(dir + '/done');
        deleted = true;
      } catch (_error) {}
      timeout(t_limit, 'Can not delete exit code file');
    }
    result = {};
    ref1 = ['stdout', 'stderr', 'status'];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      pipe = ref1[j];
      result[pipe] = fs.readFileSync(dir + '/' + pipe, {
        encoding: 'utf-8'
      });
      read = true;
      fs.unlinkSync(dir + '/' + pipe);
    }
    try {
      fs.rmdirSync(dir);
    } catch (_error) {}
    result.status = Number(result.status);
    return result;
  };

  proxy = function(cmd, max_wait, options) {
    var err, orig_write, status, stderr, stdout, t0;
    options.timeout = max_wait;
    stdout = stderr = '';
    status = 0;
    t0 = (new Date).getTime();
    orig_write = process.stderr.write;
    process.stderr.write = function() {};
    try {
      stdout = child_process.execSync(cmd, options);
      process.stderr.write = orig_write;
    } catch (_error) {
      err = _error;
      process.stderr.write = orig_write;
      if (err.signal === 'SIGTERM' && t0 <= (new Date).getTime() - max_wait) {
        throw new Error('Timeout');
      }
      stdout = err.stdout, stderr = err.stderr, status = err.status;
    }
    return {
      stdout: stdout,
      stderr: stderr,
      status: status
    };
  };

  module.exports = function(cmd, max_wait, options) {
    var ref1;
    if (max_wait && typeof max_wait === 'object') {
      ref1 = [max_wait, null], options = ref1[0], max_wait = ref1[1];
    }
    if (options == null) {
      options = {};
    }
    if (!options.hasOwnProperty('encoding')) {
      options.encoding = 'utf8';
    }
    if (!(typeof options === 'object' && options)) {
      throw new Error('options must be an object');
    }
    if (max_wait == null) {
      max_wait = options.timeout || options.max_wait || 3600000;
    }
    if (!((max_wait == null) || max_wait >= 1)) {
      throw new Error('`options.timeout` must be >=1 millisecond');
    }
    delete options.max_wait;
    if (child_process.execSync) {
      return proxy(cmd, max_wait, options);
    }
    delete options.timeout;
    dir = create_pipes();
    cmd = '((((' + cmd + ' > ' + dir + '/stdout 2> ' + dir + '/stderr ) ' + '&& echo 0 > ' + dir + '/status) || echo 1 > ' + dir + '/status) &&' + ' echo 1 > ' + dir + '/done) || echo 1 > ' + dir + '/done';
    child_process.exec(cmd, options, function() {});
    return read_pipes(dir, max_wait);
  };

}).call(this);

}).call(this,require('_process'))
},{"_process":4,"child_process":1,"fs":undefined}],75:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":76}],76:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":77}],77:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],78:[function(require,module,exports){
'use strict';

var debug = require('debug')('rocambole:indent');
var tk = require('rocambole-token');
var escapeRegExp = require('mout/string/escapeRegExp');
var repeat = require('mout/string/repeat');


// ---

var _opts = {
  value: '  ',
  CommentInsideEmptyBlock: 1
};

// ---


exports.setOptions = function(opts) {
  _opts = opts;
};


exports.inBetween = indentInBetween;
function indentInBetween(startToken, endToken, level) {
  level = level != null ? level : 1;

  if (!level || (!startToken || !endToken) || startToken === endToken) {
    debug(
      '[inBetween] not going to indent. start: %s, end: %s, level: %s',
      startToken && startToken.value,
      endToken && endToken.value,
      level
    );
    return;
  }

  var token = startToken && startToken.next;
  var endsWithBraces = isClosingBrace(endToken);
  while (token && token !== endToken) {
    if (tk.isBr(token.prev)) {
      // we ignore the last indent (if first token on the line is a ws or
      // ident) just because in most cases we don't want to change the indent
      // just before "}", ")" and "]" - this allow us to pass
      // `node.body.startToken` and `node.body.endToken` as the range
      if (token.next !== endToken || !endsWithBraces || !tk.isEmpty(token)) {
        addLevel(token, level);
      }
    }
    token = token.next;
  }
}


function isClosingBrace(token) {
  var val = token.value;
  return val === ')' || val === '}' || val === ']';
}


exports.addLevel = addLevel;
function addLevel(token, level) {
  if (!level) {
    // zero is a noop
    return;
  }

  token = findStartOfLine(token);

  if (!token) {
    // we never indent empty lines!
    debug('[indent.addLevel] can\'t find start of line');
    return;
  }

  var value = repeat(_opts.value, Math.abs(level));

  if (tk.isIndent(token)) {
    if (level > 0) {
      // if it's already an Indent we just bump the value & level
      token.value += value;
      token.level += level;
    } else {
      if (token.level + level <= 0) {
        tk.remove(token);
      } else {
        token.value = token.value.replace(value, '');
        token.level += level;
      }
    }
    if (token.next && token.next.type === 'BlockComment') {
      updateBlockComment(token.next);
    }
    return;
  }

  if (level < 1) {
    // we can't remove indent if previous token isn't an indent
    debug(
      '[addLevel] we can\'t decrement if line doesn\'t start with Indent. token: %s, level: %s',
      token && token.value,
      level
    );
    return;
  }

  if (tk.isWs(token)) {
    // convert WhiteSpace token into Indent
    token.type = 'Indent';
    token.value = value;
    token.level = level;
    return;
  }

  // if regular token we add a new Indent before it
  tk.before(token, {
    type: 'Indent',
    value: value,
    level: level
  });

  if (token.type === 'BlockComment') {
    updateBlockComment(token);
  }
}

function findStartOfLine(token) {
  if (tk.isBr(token) && tk.isBr(token.prev)) {
    // empty lines are ignored
    return null;
  }
  var prev = token.prev;
  while (true) {
    if (!prev || tk.isBr(prev)) {
      return token;
    }
    token = prev;
    prev = token.prev;
  }
}


exports.sanitize = sanitize;
function sanitize(astOrNode) {
  var token = astOrNode.startToken;
  var end = astOrNode.endToken && astOrNode.endToken.next;
  while (token && token !== end) {
    var next = token.next;
    if (isOriginalIndent(token)) {
      tk.remove(token);
    }
    token = next;
  }
}


function isOriginalIndent(token) {
  // original indent don't have a "level" value
  // we also need to remove any indent that happens after a token that
  // isn't a line break (just in case these are added by mistake)
  return (token.type === 'WhiteSpace' && (!token.prev || tk.isBr(token.prev)) && !tk.isBr(token.next)) ||
    (token.type === 'Indent' && (token.level == null || !tk.isBr(token.prev)));
}


exports.updateBlockComment = updateBlockComment;
function updateBlockComment(comment) {
  var orig = new RegExp('([\\n\\r]+)' + escapeRegExp(comment.originalIndent || ''), 'gm');
  var update = comment.prev && comment.prev.type === 'Indent' ? comment.prev.value : '';
  comment.raw = comment.raw.replace(orig, '$1' + update);
  // override the originalIndent so multiple consecutive calls still work as
  // expected
  comment.originalIndent = update;
}


// comments are aligned based on the next line unless the line/block is
// followed by an empty line, in that case it will use the previous line as
// reference.
exports.alignComments = alignComments;
function alignComments(nodeOrAst) {
  var first = nodeOrAst.startToken && nodeOrAst.startToken.prev;
  var token = nodeOrAst.endToken;
  while (token && token !== first) {
    if (tk.isComment(token) && isFirstNonEmptyTokenOfLine(token)) {
      var base = findReferenceIndent(token);
      matchBaseIndent(token, base);

      // if inside an empty block we add indent otherwise it looks weird
      var change = _opts.CommentInsideEmptyBlock != null ?
        _opts.CommentInsideEmptyBlock : 1;
      if (change && isInsideEmptyBlock(token)) {
        addLevel(token, change);
      }

      if (token.type === 'BlockComment') {
        updateBlockComment(token);
      }
    }

    token = token.prev;
  }
}

function matchBaseIndent(token, base) {
  if (!base) {
    if (isIndentOrWs(token.prev)) {
      tk.remove(token.prev);
    }
    return;
  }

  if (isIndentOrWs(token.prev)) {
    // we reuse whitespace just because user might not have converted all
    // the whitespaces into Indent tokens
    token.prev.type = 'Indent';
    token.prev.value = base.value;
    token.prev.level = inferLevel(base, _opts.value);
    return;
  }

  tk.before(token, {
    type: 'Indent',
    value: base.value,
    level: inferLevel(base, _opts.value)
  });
}

function isFirstNonEmptyTokenOfLine(token) {
  if (!token.prev || tk.isBr(token.prev)) return true;
  var prev = tk.findPrevNonEmpty(token);
  return !prev ? true : tk.findInBetween(prev, token, tk.isBr);
}

function findReferenceIndent(start) {
  var prevLine = findPrevReference(start);
  var nextLine = findNextReference(start);
  if (isAtBeginingOfBlock(start) || isDetached(start, nextLine)) {
    // this handles an edge case of comment just after "{" followed by an empty
    // line (would use the previous line as reference by mistake)
    // and also an edge case where comment is surrounded by empty lines but
    // should still use the next non-empty line as a reference
    while (nextLine && tk.isBr(nextLine)) {
      nextLine = findNextReference(nextLine.prev);
    }
  }
  // we favor nextLine unless it's empty
  if (tk.isBr(nextLine) || !nextLine) {
    return isIndentOrWs(prevLine) ? prevLine : null;
  }
  return isIndentOrWs(nextLine) ? nextLine : null;
}

function findPrevReference(start) {
  var token = start.prev;
  while (token) {
    // multiple consecutive comments should use the same reference (consider as
    // a single block)
    if (tk.isBr(token) && !tk.isBr(token.next) && nextInLineNotComment(token)) {
      return token.next;
    }
    token = token.prev;
  }
}

function findNextReference(start) {
  var token = start.next;
  while (token) {
    // multiple consecutive comments should use the same reference (consider as
    // a single block)
    if (tk.isBr(token) && nextInLineNotComment(token)) {
      return token.next;
    }
    token = token.next;
  }
}

function isDetached(start, nextLine) {
  return hasEmptyLineBefore(start) && tk.isBr(nextLine) &&
    !isAtEndOfBlock(nextLine);
}

function hasEmptyLineBefore(token) {
  token = token.prev;
  var count = 0;
  while (token && tk.isEmpty(token)) {
    if (tk.isBr(token)) {
      count += 1;
    }
    if (count > 1) {
      return true;
    }
    token = token.prev;
  }
  return false;
}

function isIndentOrWs(token) {
  return tk.isIndent(token) || tk.isWs(token);
}

function nextInLineNotComment(token) {
  token = token.next;
  while (token) {
    if (tk.isBr(token)) {
      return true;
    }
    if (!tk.isEmpty(token)) {
      return !tk.isComment(token);
    }
    token = token.next;
  }
  return true;
}

function isAtBeginingOfBlock(token) {
  var open = tk.findPrev(token, tk.isCode);
  if (!open) return false;
  var a = open.value;
  return a === '(' || a === '[' || a === '{';
}

function isAtEndOfBlock(token) {
  var close = tk.findNext(token, tk.isCode);
  if (!close) return false;
  var z = close.value;
  return (z === ')' || z === ']' || z === '}');
}

function isInsideEmptyBlock(token) {
  return isAtEndOfBlock(token) && isAtBeginingOfBlock(token);
}

exports.whiteSpaceToIndent = whiteSpaceToIndent;
function whiteSpaceToIndent(token, indentValue) {
  if (tk.isWs(token) && (tk.isBr(token.prev) || !token.prev)) {
    token.type = 'Indent';
    // we can't add level if we don't know original indentValue
    indentValue = indentValue || _opts.value;
    if (indentValue) {
      token.level = inferLevel(token, indentValue);
    }
  }
}

function inferLevel(token, indentValue) {
  return Math.max(token.value.split(indentValue).length - 1, 0);
}

},{"debug":75,"mout/string/escapeRegExp":119,"mout/string/repeat":120,"rocambole-token":85}],79:[function(require,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"./debug":80,"dup":75}],80:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76,"ms":81}],81:[function(require,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"dup":77}],82:[function(require,module,exports){
;(function(exports) {

// export the class if we are in a Node-like system.
if (typeof module === 'object' && module.exports === exports)
  exports = module.exports = SemVer;

// The debug function is excluded entirely from the minified version.

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';


// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';


// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')';

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                            '|' + src[NONNUMERICIDENTIFIER] + ')';

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[NONNUMERICIDENTIFIER] + ')';


// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';


// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN = 'v?' + src[MAINVERSION] +
                src[PRERELEASE] + '?' +
                src[BUILD] + '?';

src[FULL] = '^' + FULLPLAIN + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                 src[PRERELEASELOOSE] + '?' +
                 src[BUILD] + '?';

var LOOSE = R++;
src[LOOSE] = '^' + LOOSEPLAIN + '$';

var GTLT = R++;
src[GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[PRERELEASE] + ')?' +
                   src[BUILD] + '?' +
                   ')?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[PRERELEASELOOSE] + ')?' +
                        src[BUILD] + '?' +
                        ')?)?';

var XRANGE = R++;
src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
var XRANGELOOSE = R++;
src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = '(?:~>?)';

var TILDETRIM = R++;
src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

var TILDE = R++;
src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
var TILDELOOSE = R++;
src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = '(?:\\^)';

var CARETTRIM = R++;
src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
var caretTrimReplace = '$1^';

var CARET = R++;
src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
var CARETLOOSE = R++;
src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
var COMPARATOR = R++;
src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';


// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';


// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[XRANGEPLAIN] + ')' +
                   '\\s*$';

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  ;
  if (!re[i])
    re[i] = new RegExp(src[i]);
}

exports.parse = parse;
function parse(version, loose) {
  if (version instanceof SemVer)
    return version;

  if (typeof version !== 'string')
    return null;

  if (version.length > MAX_LENGTH)
    return null;

  var r = loose ? re[LOOSE] : re[FULL];
  if (!r.test(version))
    return null;

  try {
    return new SemVer(version, loose);
  } catch (er) {
    return null;
  }
}

exports.valid = valid;
function valid(version, loose) {
  var v = parse(version, loose);
  return v ? v.version : null;
}


exports.clean = clean;
function clean(version, loose) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, loose) {
  if (version instanceof SemVer) {
    if (version.loose === loose)
      return version;
    else
      version = version.version;
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version);
  }

  if (version.length > MAX_LENGTH)
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')

  if (!(this instanceof SemVer))
    return new SemVer(version, loose);

  ;
  this.loose = loose;
  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

  if (!m)
    throw new TypeError('Invalid Version: ' + version);

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0)
    throw new TypeError('Invalid major version')

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
    throw new TypeError('Invalid minor version')

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
    throw new TypeError('Invalid patch version')

  // numberify any prerelease numeric ids
  if (!m[4])
    this.prerelease = [];
  else
    this.prerelease = m[4].split('.').map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id
        if (num >= 0 && num < MAX_SAFE_INTEGER)
          return num
      }
      return id;
    });

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length)
    this.version += '-' + this.prerelease.join('.');
  return this.version;
};

SemVer.prototype.inspect = function() {
  return '<SemVer "' + this + '">';
};

SemVer.prototype.toString = function() {
  return this.version;
};

SemVer.prototype.compare = function(other) {
  ;
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch);
};

SemVer.prototype.comparePre = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length)
    return -1;
  else if (!this.prerelease.length && other.prerelease.length)
    return 1;
  else if (!this.prerelease.length && !other.prerelease.length)
    return 0;

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    ;
    if (a === undefined && b === undefined)
      return 0;
    else if (b === undefined)
      return 1;
    else if (a === undefined)
      return -1;
    else if (a === b)
      continue;
    else
      return compareIdentifiers(a, b);
  } while (++i);
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function(release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break;
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break;
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0)
        this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
        this.major++;
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0)
        this.minor++;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0)
        this.patch++;
      this.prerelease = [];
      break;
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0)
        this.prerelease = [0];
      else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) // didn't increment anything
          this.prerelease.push(0);
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1]))
            this.prerelease = [identifier, 0];
        } else
          this.prerelease = [identifier, 0];
      }
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  return this;
};

exports.inc = inc;
function inc(version, release, loose, identifier) {
  if (typeof(loose) === 'string') {
    identifier = loose;
    loose = undefined;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version;
  } catch (er) {
    return null;
  }
}

exports.diff = diff;
function diff(version1, version2) {
  if (eq(version1, version2)) {
    return null;
  } else {
    var v1 = parse(version1);
    var v2 = parse(version2);
    if (v1.prerelease.length || v2.prerelease.length) {
      for (var key in v1) {
        if (key === 'major' || key === 'minor' || key === 'patch') {
          if (v1[key] !== v2[key]) {
            return 'pre'+key;
          }
        }
      }
      return 'prerelease';
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return key;
        }
      }
    }
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return (anum && !bnum) ? -1 :
         (bnum && !anum) ? 1 :
         a < b ? -1 :
         a > b ? 1 :
         0;
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}

exports.major = major;
function major(a, loose) {
  return new SemVer(a, loose).major;
}

exports.minor = minor;
function minor(a, loose) {
  return new SemVer(a, loose).minor;
}

exports.patch = patch;
function patch(a, loose) {
  return new SemVer(a, loose).patch;
}

exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(b);
}

exports.compareLoose = compareLoose;
function compareLoose(a, b) {
  return compare(a, b, true);
}

exports.rcompare = rcompare;
function rcompare(a, b, loose) {
  return compare(b, a, loose);
}

exports.sort = sort;
function sort(list, loose) {
  return list.sort(function(a, b) {
    return exports.compare(a, b, loose);
  });
}

exports.rsort = rsort;
function rsort(list, loose) {
  return list.sort(function(a, b) {
    return exports.rcompare(a, b, loose);
  });
}

exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

exports.eq = eq;
function eq(a, b, loose) {
  return compare(a, b, loose) === 0;
}

exports.neq = neq;
function neq(a, b, loose) {
  return compare(a, b, loose) !== 0;
}

exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  var ret;
  switch (op) {
    case '===':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a === b;
      break;
    case '!==':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a !== b;
      break;
    case '': case '=': case '==': ret = eq(a, b, loose); break;
    case '!=': ret = neq(a, b, loose); break;
    case '>': ret = gt(a, b, loose); break;
    case '>=': ret = gte(a, b, loose); break;
    case '<': ret = lt(a, b, loose); break;
    case '<=': ret = lte(a, b, loose); break;
    default: throw new TypeError('Invalid operator: ' + op);
  }
  return ret;
}

exports.Comparator = Comparator;
function Comparator(comp, loose) {
  if (comp instanceof Comparator) {
    if (comp.loose === loose)
      return comp;
    else
      comp = comp.value;
  }

  if (!(this instanceof Comparator))
    return new Comparator(comp, loose);

  ;
  this.loose = loose;
  this.parse(comp);

  if (this.semver === ANY)
    this.value = '';
  else
    this.value = this.operator + this.semver.version;

  ;
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    throw new TypeError('Invalid comparator: ' + comp);

  this.operator = m[1];
  if (this.operator === '=')
    this.operator = '';

  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    this.semver = ANY;
  else
    this.semver = new SemVer(m[2], this.loose);
};

Comparator.prototype.inspect = function() {
  return '<SemVer Comparator "' + this + '">';
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  ;

  if (this.semver === ANY)
    return true;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  return cmp(version, this.operator, this.semver, this.loose);
};


exports.Range = Range;
function Range(range, loose) {
  if ((range instanceof Range) && range.loose === loose)
    return range;

  if (!(this instanceof Range))
    return new Range(range, loose);

  this.loose = loose;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function(range) {
    return this.parseRange(range.trim());
  }, this).filter(function(c) {
    // throw out any that are not relevant for whatever reason
    return c.length;
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range);
  }

  this.format();
}

Range.prototype.inspect = function() {
  return '<SemVer Range "' + this.range + '">';
};

Range.prototype.format = function() {
  this.range = this.set.map(function(comps) {
    return comps.join(' ').trim();
  }).join('||').trim();
  return this.range;
};

Range.prototype.toString = function() {
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.loose;
  range = range.trim();
  ;
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  ;
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
  ;

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range.split(' ').map(function(comp) {
    return parseComparator(comp, loose);
  }).join(' ').split(/\s+/);
  if (this.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function(comp) {
      return !!comp.match(compRe);
    });
  }
  set = set.map(function(comp) {
    return new Comparator(comp, loose);
  });

  return set;
};

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators(range, loose) {
  return new Range(range, loose).set.map(function(comp) {
    return comp.map(function(c) {
      return c.value;
    }).join(' ').trim().split(' ');
  });
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, loose) {
  ;
  comp = replaceCarets(comp, loose);
  ;
  comp = replaceTildes(comp, loose);
  ;
  comp = replaceXRanges(comp, loose);
  ;
  comp = replaceStars(comp, loose);
  ;
  return comp;
}

function isX(id) {
  return !id || id.toLowerCase() === 'x' || id === '*';
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceTilde(comp, loose);
  }).join(' ');
}

function replaceTilde(comp, loose) {
  var r = loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p))
      // ~1.2 == >=1.2.0- <1.3.0-
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0';

    ;
    return ret;
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceCaret(comp, loose);
  }).join(' ');
}

function replaceCaret(comp, loose) {
  ;
  var r = loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p)) {
      if (M === '0')
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
      else
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
    } else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p + pr +
              ' <' + (+M + 1) + '.0.0';
    } else {
      ;
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0';
    }

    ;
    return ret;
  });
}

function replaceXRanges(comp, loose) {
  ;
  return comp.split(/\s+/).map(function(comp) {
    return replaceXRange(comp, loose);
  }).join(' ');
}

function replaceXRange(comp, loose) {
  comp = comp.trim();
  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    ;
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX)
      gtlt = '';

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // replace X with 0
      if (xm)
        m = 0;
      if (xp)
        p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<'
        if (xm)
          M = +M + 1
        else
          m = +m + 1
      }

      ret = gtlt + M + '.' + m + '.' + p;
    } else if (xm) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    }

    ;

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, loose) {
  ;
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], '');
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace($0,
                       from, fM, fm, fp, fpr, fb,
                       to, tM, tm, tp, tpr, tb) {

  if (isX(fM))
    from = '';
  else if (isX(fm))
    from = '>=' + fM + '.0.0';
  else if (isX(fp))
    from = '>=' + fM + '.' + fm + '.0';
  else
    from = '>=' + from;

  if (isX(tM))
    to = '';
  else if (isX(tm))
    to = '<' + (+tM + 1) + '.0.0';
  else if (isX(tp))
    to = '<' + tM + '.' + (+tm + 1) + '.0';
  else if (tpr)
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  else
    to = '<=' + to;

  return (from + ' ' + to).trim();
}


// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  if (!version)
    return false;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version))
      return true;
  }
  return false;
};

function testSet(set, version) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version))
      return false;
  }

  if (version.prerelease.length) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (var i = 0; i < set.length; i++) {
      ;
      if (set[i].semver === ANY)
        continue;

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch)
          return true;
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false;
  }

  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, loose) {
  try {
    range = new Range(range, loose);
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, loose) {
  return versions.filter(function(version) {
    return satisfies(version, range, loose);
  }).sort(function(a, b) {
    return rcompare(a, b, loose);
  })[0] || null;
}

exports.validRange = validRange;
function validRange(range, loose) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, loose).range || '*';
  } catch (er) {
    return null;
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr(version, range, loose) {
  return outside(version, range, '<', loose);
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr(version, range, loose) {
  return outside(version, range, '>', loose);
}

exports.outside = outside;
function outside(version, range, hilo, loose) {
  version = new SemVer(version, loose);
  range = new Range(range, loose);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break;
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, loose)) {
    return false;
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function(comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0')
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, loose)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, loose)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
}

// Use the define() function if we're in AMD land
if (typeof define === 'function' && define.amd)
  define(exports);

})(
  typeof exports === 'object' ? exports :
  typeof define === 'function' && define.amd ? {} :
  semver = {}
);

},{}],83:[function(require,module,exports){
'use strict';

// Line break helpers

var _tk = require('rocambole-token');
var debug = require('debug');
var debugBefore = debug('rocambole:br:before');
var debugAfter = debug('rocambole:br:after');
var debugBetween = debug('rocambole:br:between');

// yeah, we use semver to parse integers. it's lame but works and will give
// more flexibility while still keeping a format that is easy to read
var semver = require('semver');

// fallback in case plugin author forgets to call setOptions
var _curOpts = {
  value: '\n'
};


// ---


exports.setOptions = setOptions;
function setOptions(opts) {
  _curOpts = opts;
}


exports.limit = limit;
function limit(token, typeOrValue) {
  limitBefore(token, typeOrValue);
  limitAfter(token, typeOrValue);
}


exports.limitBefore = limitBefore;
function limitBefore(token, typeOrValue) {
  var expected = expectedBefore(typeOrValue);
  debugBefore(
    'typeOrValue: %s, expected: %s, value: %s',
    typeOrValue, expected, token && token.value
  );
  if (expected < 0) return; // noop
  var start = getStartToken(token);
  limitInBetween('before', start, token, expected);
}


exports.limitAfter = limitAfter;
function limitAfter(token, typeOrValue) {
  var expected = expectedAfter(typeOrValue);
  debugAfter(
    'typeOrValue: %s, expected: %s, value: %s',
    typeOrValue, expected, token && token.value
  );
  if (expected < 0) return; // noop
  var end = getEndToken(token);
  limitInBetween('after', token, end, expected);
}

exports.expectedBefore = expectedBefore;
function expectedBefore(typeOrValue) {
  return getExpect('before', typeOrValue);
}

exports.expectedAfter = expectedAfter;
function expectedAfter(typeOrValue) {
  return getExpect('after', typeOrValue);
}


function getExpect(location, typeOrValue) {
  var expected;

  // we allow expected value (number) as 2nd argument or the node type (string)
  if (typeof typeOrValue === 'string') {
    expected = _curOpts[location][typeOrValue];
  } else {
    expected = typeOrValue;
  }

  // default is noop, explicit is better than implicit
  expected = expected != null ? expected : -1;

  if (typeof expected === 'boolean') {
    // if user sets booleans by mistake we simply add one if missing (true)
    // or remove all if false
    expected = expected ? '>=1' : 0;
  }

  if (expected < 0) {
    // noop
    return expected;
  } else if (typeof expected === 'number') {
    return String(expected);
  } else {
    return expected;
  }
}


function limitInBetween(location, start, end, expected) {
  var n = getDiff(start, end, expected);
  debugBetween('diff: %d', n);
  if (n) {
    _tk.removeInBetween(start, end, 'WhiteSpace');
  }
  if (n < 0) {
    _tk.removeInBetween(start, end, function(token) {
      return token.type === 'LineBreak' && n++ < 0 &&
        !siblingIsComment(location, token);
    });
  } else if (n > 0) {
    var target = location === 'after' ? start : end;
    var insertNextTo = _tk[location];
    while (n-- > 0) {
      insertNextTo(target, {
        type: 'LineBreak',
        value: _curOpts.value
      });
    }
  }
}


function siblingIsComment(location, token) {
  var prop = location === 'before' ? 'prev' : 'next';
  return _tk.isComment(token[prop]);
}


function getDiff(start, end, expected) {
  // start will only be equal to end if it's start or file
  if (start === end) return 0;
  var count = countBrInBetween(start, end);
  // yeah, it's ugly to strings to compare integers but was quickest solution
  var vCount = String(count) + '.0.0';
  if (semver.satisfies(vCount, expected)) {
    return 0;
  } else {
    return getSatisfyingMatch(count, vCount, expected) - count;
  }
}


function getSatisfyingMatch(count, vCount, expected) {
  var result;
  var diff = semver.gtr(vCount, expected) ? -1 : 1;
  count += diff;
  while (result == null && count >= 0 && count < 100) {
    if (semver.satisfies(String(count) + '.0.0', expected)) {
      result = count;
    }
    count += diff;
  }
  return parseInt(result, 10);
}


function countBrInBetween(start, end) {
  var count = 0;
  _tk.eachInBetween(start, end, function(token) {
    if (_tk.isBr(token)) count++;
  });
  return count;
}


function getEndToken(token) {
  var end = _tk.findNextNonEmpty(token);
  if (shouldSkipToken(end)) {
    end = _tk.findNextNonEmpty(end);
  }
  return end ? end : token.root.endToken;
}


function shouldSkipToken(token) {
  // if comment is at same line we skip it unless it has a specific rule that
  // would add line breaks
  var result = _tk.isComment(token) && !isOnSeparateLine(token);
  return result && getExpect('before', token.type) <= 0;
}


function isOnSeparateLine(token) {
  return _tk.isBr(token.prev) || (
    _tk.isEmpty(token.prev) && _tk.isBr(token.prev.prev)
    );
}


function getStartToken(token) {
  var end = _tk.findPrevNonEmpty(token);
  return end ? end : token.root.startToken;
}


exports.limitBeforeEndOfFile = function(ast, amount) {
  var typeOrValue = amount != null ? amount : 'EndOfFile';
  var expected = getExpect('before', typeOrValue);

  if (expected < 0) return; // noop

  var lastNonEmpty = _tk.isEmpty(ast.endToken) ?
    _tk.findPrevNonEmpty(ast.endToken) :
    ast.endToken;

  if (lastNonEmpty) {
    limitInBetween('after', lastNonEmpty, null, expected);
  } else {
    do {
      var br = {
        type: 'LineBreak',
        value: _curOpts.value
      };
      if (ast.startToken) {
        _tk.after(ast.startToken, br);
      } else {
        ast.startToken = ast.endToken = br;
      }
    } while (--expected);
  }
};

},{"debug":79,"rocambole-token":85,"semver":82}],84:[function(require,module,exports){
"use strict";

var makeCheck = require('./makeCheck');
var isNotEmpty = require('./is').isNotEmpty;


// ---


exports.findInBetween = findInBetween;
function findInBetween(startToken, endToken, check) {
  check = makeCheck(check);
  var found;
  var last = endToken && endToken.next;
  while (startToken && startToken !== last && !found) {
    if (check(startToken)) {
      found = startToken;
    }
    startToken = startToken.next;
  }
  return found;
}


exports.findInBetweenFromEnd = findInBetweenFromEnd;
function findInBetweenFromEnd(startToken, endToken, check) {
  check = makeCheck(check);
  var found;
  var last = startToken && startToken.prev;
  while (endToken && endToken !== last && !found) {
    if (check(endToken)) {
      found = endToken;
    }
    endToken = endToken.prev;
  }
  return found;
}


exports.findNext = findNext;
function findNext(startToken, check) {
  check = makeCheck(check);
  startToken = startToken && startToken.next;
  while (startToken) {
    if (check(startToken)) {
      return startToken;
    }
    startToken = startToken.next;
  }
}


exports.findPrev = findPrev;
function findPrev(endToken, check) {
  check = makeCheck(check);
  endToken = endToken && endToken.prev;
  while (endToken) {
    if (check(endToken)) {
      return endToken;
    }
    endToken = endToken.prev;
  }
}


exports.findNextNonEmpty = findNextNonEmpty;
function findNextNonEmpty(startToken) {
  return findNext(startToken, isNotEmpty);
}


exports.findPrevNonEmpty = findPrevNonEmpty;
function findPrevNonEmpty(endToken) {
  return findPrev(endToken, isNotEmpty);
}


},{"./is":87,"./makeCheck":88}],85:[function(require,module,exports){
"use strict";

// ---

function mixIn(target, source){
  Object.keys(source).forEach(function(key){
    target[key] = source[key];
  });
  return target;
}


// ---


exports.eachInBetween = eachInBetween;
function eachInBetween(startToken, endToken, iterator) {
  var last = endToken && endToken.next;
  while (startToken && startToken !== last) {
    iterator(startToken);
    startToken = startToken.next;
  }
}


// ---

// XXX: ugly but works for now, that way we avoid changing the whole
// esformatter structure.
mixIn(exports, require('./find'));
mixIn(exports, require('./insert'));
mixIn(exports, require('./is'));
mixIn(exports, require('./remove'));


},{"./find":84,"./insert":86,"./is":87,"./remove":89}],86:[function(require,module,exports){
"use strict";

exports.before = before;
function before(target, newToken) {
  newToken.prev = target.prev;
  newToken.next = target;
  if (target.prev) {
    target.prev.next = newToken;
  } else if (target.root) {
    target.root.startToken = newToken;
  }
  target.prev = newToken;
  newToken.root = target.root;
  return newToken;
}


exports.after = after;
function after(target, newToken) {
  if (target.next) {
    target.next.prev = newToken;
  } else if (target.root) {
    target.root.endToken = newToken;
  }
  newToken.prev = target;
  newToken.next = target.next;
  target.next = newToken;
  newToken.root = target.root;
  return newToken;
}


},{}],87:[function(require,module,exports){
"use strict";


// ---


exports.isWs = isWs;
function isWs(token) {
  return token && token.type === 'WhiteSpace';
}


exports.isBr = isBr;
function isBr(token) {
  return token && token.type === 'LineBreak';
}


exports.isEmpty = isEmpty;
function isEmpty(token) {
  return token &&
    (token.type === 'WhiteSpace' ||
    token.type === 'LineBreak' ||
    token.type === 'Indent');
}


exports.isNotEmpty = isNotEmpty;
function isNotEmpty(token) {
  return !isEmpty(token);
}


//XXX: isCode is a bad name, find something better to describe it
exports.isCode = isCode;
function isCode(token) {
  return !isEmpty(token) && !isComment(token);
}


exports.isSemiColon = isSemiColon;
function isSemiColon(token) {
  return token && (token.type === 'Punctuator' && token.value === ';');
}


exports.isComma = isComma;
function isComma(token) {
  return token && (token.type === 'Punctuator' && token.value === ',');
}


exports.isIndent = isIndent;
function isIndent(token) {
  return token && token.type === 'Indent';
}


exports.isComment = isComment;
function isComment(token) {
  return token && (token.type === 'LineComment' || token.type === 'BlockComment');
}


},{}],88:[function(require,module,exports){
"use strict";

module.exports = makeCheck;

function makeCheck(orig) {
  if (typeof orig === 'string') {
    return makeStringCheck(orig);
  }
  else if (Array.isArray(orig)) {
    return makeArrayCheck(orig);
  }
  // already a function or invalid value
  return orig;
}


function makeArrayCheck(arr) {
  return function checkTypeAndValueByIndex(token) {
    return token && (arr.indexOf(token.type) !== -1 || arr.indexOf(token.value) !== -1);
  };
}


function makeStringCheck(str) {
  return function checkTypeAndValueByString(token) {
    return token && (token.type === str || token.value === str);
  };
}

},{}],89:[function(require,module,exports){
"use strict";

var makeCheck = require('./makeCheck');
var isEmpty = require('./is').isEmpty;


// ---


exports.remove = remove;
function remove(target) {
  if (target.next) {
    target.next.prev = target.prev;
  } else if (target.root) {
    target.root.endToken = target.prev;
  }

  if (target.prev) {
    target.prev.next = target.next;
  } else if (target.root) {
    target.root.startToken = target.next;
  }
}


exports.removeInBetween = removeInBetween;
function removeInBetween(startToken, endToken, check) {
  check = makeCheck(check);
  var last = endToken && endToken.next;
  while (startToken && startToken !== last) {
    if (check(startToken)) {
      remove(startToken);
    }
    startToken = startToken.next;
  }
}


exports.removeAdjacent = removeAdjacent;
function removeAdjacent(token, check) {
  removeAdjacentBefore(token, check);
  removeAdjacentAfter(token, check);
}


exports.removeAdjacentBefore = removeAdjacentBefore;
function removeAdjacentBefore(token, check) {
  check = makeCheck(check);
  var prev = token.prev;
  while (prev && check(prev)) {
    remove(prev);
    prev = prev.prev;
  }
}


exports.removeAdjacentAfter = removeAdjacentAfter;
function removeAdjacentAfter(token, check) {
  check = makeCheck(check);
  var next = token.next;
  while (next && check(next)) {
    remove(next);
    next = next.next;
  }
}


exports.removeEmptyAdjacentBefore = removeEmptyAdjacentBefore;
function removeEmptyAdjacentBefore(startToken) {
  removeAdjacentBefore(startToken, isEmpty);
}


exports.removeEmptyAdjacentAfter = removeEmptyAdjacentAfter;
function removeEmptyAdjacentAfter(startToken) {
  removeAdjacentAfter(startToken, isEmpty);
}


exports.removeEmptyInBetween = removeEmptyInBetween;
function removeEmptyInBetween(startToken, endToken) {
  removeInBetween(startToken, endToken, isEmpty);
}


},{"./is":87,"./makeCheck":88}],90:[function(require,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"./debug":91,"dup":75}],91:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76,"ms":92}],92:[function(require,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"dup":77}],93:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('repeat-string expects a string.');
  }

  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  }

  while (max > res.length && num > 0) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    if (!num) break;
    str += str;
  }

  return res.substr(0, max);
}

/**
 * Results cache
 */

var res = '';
var cache;

},{}],94:[function(require,module,exports){
'use strict';

// white space helpers

var _tk = require('rocambole-token');
var repeat = require('repeat-string');
var debug = require('debug');
var debugBefore = debug('rocambole:ws:before');
var debugAfter = debug('rocambole:ws:after');

// fallback in case plugin author forgets to call setOptions
var _curOpts = {
  value: ' ',
  before: {},
  after: {}
};


// ---


exports.setOptions = setOptions;
function setOptions(opts) {
  _curOpts = opts;
}


// --


exports.limit = limit;
function limit(token, typeOrValue) {
  limitBefore(token, typeOrValue);
  limitAfter(token, typeOrValue);
}


exports.limitBefore = limitBefore;
function limitBefore(token, typeOrValue) {
  var amount = expectedBefore(typeOrValue);
  debugBefore(
    'typeOrValue: %s, amount: %s, token: %s',
    typeOrValue, amount, token.value
  );
  if (amount < 0) return; // noop
  update('before', token, amount);
}


exports.limitAfter = limitAfter;
function limitAfter(token, typeOrValue) {
  var amount = expectedAfter(typeOrValue);
  debugAfter(
    'typeOrValue: %s, amount: %s, token: %s',
    typeOrValue, amount, token.value
  );
  if (amount < 0) return; // noop
  update('after', token, amount);
}


exports.expectedAfter = expectedAfter;
function expectedAfter(typeOrValue) {
  return getAmount('after', typeOrValue);
}


exports.expectedBefore = expectedBefore;
function expectedBefore(typeOrValue) {
  return getAmount('before', typeOrValue);
}


function getAmount(position, typeOrValue) {
  if (typeof typeOrValue === 'number') {
    return typeOrValue;
  }
  var amount = _curOpts[position][typeOrValue];
  return amount == null ? -1 : amount;
}


function update(position, target, amount) {
  var adjacent = position === 'before' ? target.prev : target.next;
  var adjacentIsWs = _tk.isWs(adjacent);

  if (!adjacent || _tk.isBr(adjacent)) return;

  if (amount === 0 && adjacentIsWs) {
    _tk.remove(adjacent);
    return;
  }

  var ws;
  if (adjacentIsWs) {
    ws = adjacent;
  } else {
    ws = {
      type: 'WhiteSpace'
    };
  }
  ws.value = repeat(_curOpts.value || ' ', amount);

  if (!adjacentIsWs) {
    _tk[position](target, ws);
  }
}

},{"debug":90,"repeat-string":93,"rocambole-token":85}],95:[function(require,module,exports){
/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PlaceHolders,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        hasLineTerminator,
        lastIndex,
        lastLineNumber,
        lastLineStart,
        startIndex,
        startLineNumber,
        startLineStart,
        scanning,
        length,
        lookahead,
        state,
        extra,
        isBindingElement,
        isAssignmentTarget,
        firstCoverInitializedNameError;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PlaceHolders = {
        ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedTemplate: 'Unexpected quasi %0',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode',
        TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype',
        MissingFromClause: 'Unexpected token',
        NoAsAfterImportNamespace: 'Unexpected token',
        InvalidModuleSpecifier: 'Unexpected token',
        IllegalImportDeclaration: 'Unexpected token',
        IllegalExportDeclaration: 'Unexpected token',
        DuplicateBinding: 'Duplicate binding %0'
    };

    // See also tools/generate-unicode-regex.js.
    Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,

        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }

    function octalToDecimal(ch) {
        // \0 is not octal escape sequence
        var octal = (ch !== '0'), code = '01234567'.indexOf(ch);

        if (index < length && isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + '01234567'.indexOf(source[index++]);

            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if ('0123'.indexOf(ch) >= 0 &&
                    index < length &&
                    isOctalDigit(source[index])) {
                code = code * 8 + '01234567'.indexOf(source[index++]);
            }
        }

        return {
            code: code,
            octal: octal
        };
    }

    // ECMA-262 11.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // ECMA-262 11.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // ECMA-262 11.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        return (cp < 0x10000) ? String.fromCharCode(cp) :
            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
            String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
    }

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }

    // ECMA-262 11.6.2.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // ECMA-262 11.6.2.1 Keywords

    function isKeyword(id) {

        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatibility with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // ECMA-262 11.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                hasLineTerminator = true;
                ++lineNumber;
                ++index;
                lineStart = index;
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        if (extra.comments) {
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            comment = source.slice(start + 2, index);
            addComment('Block', comment, start, index, loc);
        }
        tolerateUnexpectedToken();
    }

    function skipComment() {
        var ch, start;
        hasLineTerminator = false;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }

        return fromCodePoint(code);
    }

    function codePointAt(i) {
        var cp, first, second;

        cp = source.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) {
            second = source.charCodeAt(i + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                first = cp;
                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }

        return cp;
    }

    function getComplexIdentifier() {
        var cp, ch, id;

        cp = codePointAt(index);
        id = fromCodePoint(cp);
        index += id.length;

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (cp === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index] === '{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            } else {
                ch = scanHexEscape('u');
                cp = ch.charCodeAt(0);
                if (!ch || ch === '\\' || !isIdentifierStart(cp)) {
                    throwUnexpectedToken();
                }
            }
            id = ch;
        }

        while (index < length) {
            cp = codePointAt(index);
            if (!isIdentifierPart(cp)) {
                break;
            }
            ch = fromCodePoint(cp);
            id += ch;
            index += ch.length;

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (cp === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                if (source[index] === '{') {
                    ++index;
                    ch = scanUnicodeCodePointEscape();
                } else {
                    ch = scanHexEscape('u');
                    cp = ch.charCodeAt(0);
                    if (!ch || ch === '\\' || !isIdentifierPart(cp)) {
                        throwUnexpectedToken();
                    }
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getComplexIdentifier();
            } else if (ch >= 0xD800 && ch < 0xDFFF) {
                // Need to handle surrogate pairs.
                index = start;
                return getComplexIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getComplexIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // ECMA-262 11.7 Punctuators

    function scanPunctuator() {
        var token, str;

        token = {
            type: Token.Punctuator,
            value: '',
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: index,
            end: index
        };

        // Check for most common single-character punctuators.
        str = source[index];
        switch (str) {

        case '(':
            if (extra.tokenize) {
                extra.openParenToken = extra.tokens.length;
            }
            ++index;
            break;

        case '{':
            if (extra.tokenize) {
                extra.openCurlyToken = extra.tokens.length;
            }
            state.curlyStack.push('{');
            ++index;
            break;

        case '.':
            ++index;
            if (source[index] === '.' && source[index + 1] === '.') {
                // Spread operator: ...
                index += 2;
                str = '...';
            }
            break;

        case '}':
            ++index;
            state.curlyStack.pop();
            break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
            ++index;
            break;

        default:
            // 4-character punctuator.
            str = source.substr(index, 4);
            if (str === '>>>=') {
                index += 4;
            } else {

                // 3-character punctuators.
                str = str.substr(0, 3);
                if (str === '===' || str === '!==' || str === '>>>' ||
                    str === '<<=' || str === '>>=') {
                    index += 3;
                } else {

                    // 2-character punctuators.
                    str = str.substr(0, 2);
                    if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
                        str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
                        str === '++' || str === '--' || str === '<<' || str === '>>' ||
                        str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
                        str === '<=' || str === '>=' || str === '=>') {
                        index += 2;
                    } else {

                        // 1-character punctuators.
                        str = source[index];
                        if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
                            ++index;
                        }
                    }
                }
            }
        }

        if (index === token.start) {
            throwUnexpectedToken();
        }

        token.end = index;
        token.value = str;
        return token;
    }

    // ECMA-262 11.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanBinaryLiteral(start) {
        var ch, number;

        number = '';

        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }

        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function isImplicitOctalLiteral() {
        var i, ch;

        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }

        return true;
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }

                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwUnexpectedToken();
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, unescaped, octToDec, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            unescaped = scanHexEscape(ch);
                            if (!unescaped) {
                                throw throwUnexpectedToken();
                            }
                            str += unescaped;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;
                    case '8':
                    case '9':
                        str += ch;
                        tolerateUnexpectedToken();
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            octToDec = octalToDecimal(ch);

                            octal = octToDec.octal || octal;
                            str += String.fromCharCode(octToDec.code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwUnexpectedToken();
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: startLineNumber,
            lineStart: startLineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.6 Template Literal Lexical Components

    function scanTemplate() {
        var cooked = '', ch, start, rawOffset, terminated, head, tail, restore, unescaped;

        terminated = false;
        tail = false;
        start = index;
        head = (source[index] === '`');
        rawOffset = 2;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                rawOffset = 1;
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    state.curlyStack.push('${');
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (ch === '0') {
                            if (isDecimalDigit(source.charCodeAt(index))) {
                                // Illegal: \01 \02 and so on
                                throwError(Messages.TemplateOctalLiteral);
                            }
                            cooked += '\0';
                        } else if (isOctalDigit(ch)) {
                            // Illegal: \1 \2
                            throwError(Messages.TemplateOctalLiteral);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwUnexpectedToken();
        }

        if (!head) {
            state.curlyStack.pop();
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - rawOffset)
            },
            head: head,
            tail: tail,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.5 Regular Expression Literals

    function testRegExp(pattern, flags) {
        // The BMP character to use as a replacement for astral symbols when
        // translating an ES6 "u"-flagged pattern to an ES5-compatible
        // approximation.
        // Note: replacing with '\uFFFF' enables false positives in unlikely
        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
        // pattern that would not be detected by this substitution.
        var astralSubstitute = '\uFFFF',
            tmp = pattern;

        if (flags.indexOf('u') >= 0) {
            tmp = tmp
                // Replace every Unicode escape sequence with the equivalent
                // BMP character or a constant ASCII code point in the case of
                // astral symbols. (See the above note on `astralSubstitute`
                // for more information.)
                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
                    var codePoint = parseInt($1 || $2, 16);
                    if (codePoint > 0x10FFFF) {
                        throwUnexpectedToken(null, Messages.InvalidRegExp);
                    }
                    if (codePoint <= 0xFFFF) {
                        return String.fromCharCode(codePoint);
                    }
                    return astralSubstitute;
                })
                // Replace each paired surrogate with a single ASCII symbol to
                // avoid throwing on regular expressions that are only valid in
                // combination with the "u" flag.
                .replace(
                    /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                    astralSubstitute
                );
        }

        // First, detect invalid regular expressions.
        try {
            RegExp(tmp);
        } catch (e) {
            throwUnexpectedToken(null, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        } catch (exception) {
            return null;
        }
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwUnexpectedToken(null, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                } else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, value;
        scanning = true;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        scanning = false;
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();

        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ']') {
                return scanPunctuator();
            }
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
            return collectRegex();
        }
        return scanPunctuator();
    }

    function advance() {
        var cp, token;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        cp = source.charCodeAt(index);

        if (isIdentifierStart(cp)) {
            token = scanIdentifier();
            if (strict && isStrictModeReservedWord(token.value)) {
                token.type = Token.Keyword;
            }
            return token;
        }

        // Very common: ( and ) and ;
        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (cp === 0x27 || cp === 0x22) {
            return scanStringLiteral();
        }

        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (cp === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(cp)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && cp === 0x2F) {
            return advanceSlash();
        }

        // Template literals start with ` (U+0060) for template head
        // or } (U+007D) for template middle or template tail.
        if (cp === 0x60 || (cp === 0x7D && state.curlyStack[state.curlyStack.length - 1] === '${')) {
            return scanTemplate();
        }

        // Possible identifier start in a surrogate pair.
        if (cp >= 0xD800 && cp < 0xDFFF) {
            cp = codePointAt(index);
            if (isIdentifierStart(cp)) {
                return scanIdentifier();
            }
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, value, entry;

        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function lex() {
        var token;
        scanning = true;

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        skipComment();

        token = lookahead;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
        return token;
    }

    function peek() {
        scanning = true;

        skipComment();

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
    }

    function Position() {
        this.line = startLineNumber;
        this.column = startIndex - startLineStart;
    }

    function SourceLocation() {
        this.start = new Position();
        this.end = null;
    }

    function WrappingSourceLocation(startToken) {
        this.start = {
            line: startToken.lineNumber,
            column: startToken.start - startToken.lineStart
        };
        this.end = null;
    }

    function Node() {
        if (extra.range) {
            this.range = [startIndex, 0];
        }
        if (extra.loc) {
            this.loc = new SourceLocation();
        }
    }

    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }

    WrappingNode.prototype = Node.prototype = {

        processComment: function () {
            var lastChild,
                leadingComments,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                i,
                comment,
                last = bottomRight[bottomRight.length - 1];

            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            } else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }

            // Eating the stack.
            while (last && last.range[0] >= this.range[0]) {
                lastChild = bottomRight.pop();
                last = bottomRight[bottomRight.length - 1];
            }

            if (lastChild) {
                if (lastChild.leadingComments) {
                    leadingComments = [];
                    for (i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                        comment = lastChild.leadingComments[i];
                        if (comment.range[1] <= this.range[0]) {
                            leadingComments.unshift(comment);
                            lastChild.leadingComments.splice(i, 1);
                        }
                    }

                    if (!lastChild.leadingComments.length) {
                        lastChild.leadingComments = undefined;
                    }
                }
            } else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }


            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }

            bottomRight.push(this);
        },

        finish: function () {
            if (extra.range) {
                this.range[1] = lastIndex;
            }
            if (extra.loc) {
                this.loc.end = {
                    line: lastLineNumber,
                    column: lastIndex - lastLineStart
                };
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }

            if (extra.attachComment) {
                this.processComment();
            }
        },

        finishArrayExpression: function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrayPattern: function (elements) {
            this.type = Syntax.ArrayPattern;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrowFunctionExpression: function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishAssignmentExpression: function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishAssignmentPattern: function (left, right) {
            this.type = Syntax.AssignmentPattern;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBinaryExpression: function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBlockStatement: function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        },

        finishBreakStatement: function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishCallExpression: function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishCatchClause: function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassBody: function (body) {
            this.type = Syntax.ClassBody;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassDeclaration: function (id, superClass, body) {
            this.type = Syntax.ClassDeclaration;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassExpression: function (id, superClass, body) {
            this.type = Syntax.ClassExpression;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishConditionalExpression: function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishContinueStatement: function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishDebuggerStatement: function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        },

        finishDoWhileStatement: function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        },

        finishEmptyStatement: function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        },

        finishExpressionStatement: function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishForStatement: function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        },

        finishForOfStatement: function (left, right, body) {
            this.type = Syntax.ForOfStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.finish();
            return this;
        },

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishIdentifier: function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        },

        finishIfStatement: function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishLabeledStatement: function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        },

        finishLiteral: function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        },

        finishMemberExpression: function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        },

        finishMetaProperty: function (meta, property) {
            this.type = Syntax.MetaProperty;
            this.meta = meta;
            this.property = property;
            this.finish();
            return this;
        },

        finishNewExpression: function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishObjectExpression: function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishObjectPattern: function (properties) {
            this.type = Syntax.ObjectPattern;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body, sourceType) {
            this.type = Syntax.Program;
            this.body = body;
            this.sourceType = sourceType;
            this.finish();
            return this;
        },

        finishProperty: function (kind, key, computed, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.computed = computed;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        },

        finishRestElement: function (argument) {
            this.type = Syntax.RestElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishReturnStatement: function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSequenceExpression: function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishSpreadElement: function (argument) {
            this.type = Syntax.SpreadElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        },

        finishSuper: function () {
            this.type = Syntax.Super;
            this.finish();
            return this;
        },

        finishSwitchStatement: function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        },

        finishTaggedTemplateExpression: function (tag, quasi) {
            this.type = Syntax.TaggedTemplateExpression;
            this.tag = tag;
            this.quasi = quasi;
            this.finish();
            return this;
        },

        finishTemplateElement: function (value, tail) {
            this.type = Syntax.TemplateElement;
            this.value = value;
            this.tail = tail;
            this.finish();
            return this;
        },

        finishTemplateLiteral: function (quasis, expressions) {
            this.type = Syntax.TemplateLiteral;
            this.quasis = quasis;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishThisExpression: function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        },

        finishThrowStatement: function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishTryStatement: function (block, handler, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = [];
            this.handlers = handler ? [handler] : [];
            this.handler = handler;
            this.finalizer = finalizer;
            this.finish();
            return this;
        },

        finishUnaryExpression: function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        },

        finishVariableDeclaration: function (declarations) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = 'var';
            this.finish();
            return this;
        },

        finishLexicalDeclaration: function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        },

        finishVariableDeclarator: function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        },

        finishWhileStatement: function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        },

        finishWithStatement: function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        },

        finishExportSpecifier: function (local, exported) {
            this.type = Syntax.ExportSpecifier;
            this.exported = exported || local;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportDefaultSpecifier: function (local) {
            this.type = Syntax.ImportDefaultSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportNamespaceSpecifier: function (local) {
            this.type = Syntax.ImportNamespaceSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishExportNamedDeclaration: function (declaration, specifiers, src) {
            this.type = Syntax.ExportNamedDeclaration;
            this.declaration = declaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishExportDefaultDeclaration: function (declaration) {
            this.type = Syntax.ExportDefaultDeclaration;
            this.declaration = declaration;
            this.finish();
            return this;
        },

        finishExportAllDeclaration: function (src) {
            this.type = Syntax.ExportAllDeclaration;
            this.source = src;
            this.finish();
            return this;
        },

        finishImportSpecifier: function (local, imported) {
            this.type = Syntax.ImportSpecifier;
            this.local = local || imported;
            this.imported = imported;
            this.finish();
            return this;
        },

        finishImportDeclaration: function (specifiers, src) {
            this.type = Syntax.ImportDeclaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishYieldExpression: function (argument, delegate) {
            this.type = Syntax.YieldExpression;
            this.argument = argument;
            this.delegate = delegate;
            this.finish();
            return this;
        }
    };


    function recordError(error) {
        var e, existing;

        for (e = 0; e < extra.errors.length; e++) {
            existing = extra.errors[e];
            // Prevent duplicated error.
            /* istanbul ignore next */
            if (existing.index === error.index && existing.message === error.message) {
                return;
            }
        }

        extra.errors.push(error);
    }

    function constructError(msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        } finally {
            return error;
        }
    }

    function createError(line, pos, description) {
        var msg, column, error;

        msg = 'Line ' + line + ': ' + description;
        column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error = constructError(msg, column);
        error.lineNumber = line;
        error.description = description;
        error.index = pos;
        return error;
    }

    // Throw an exception

    function throwError(messageFormat) {
        var args, msg;

        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        throw createError(lastLineNumber, lastIndex, msg);
    }

    function tolerateError(messageFormat) {
        var args, msg, error;

        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        error = createError(lineNumber, lastIndex, msg);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Throw an exception because of the token.

    function unexpectedTokenError(token, message) {
        var value, msg = message || Messages.UnexpectedToken;

        if (token) {
            if (!message) {
                msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                    (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                    (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                    Messages.UnexpectedToken;

                if (token.type === Token.Keyword) {
                    if (isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (strict && isStrictModeReservedWord(token.value)) {
                        msg = Messages.StrictReservedWord;
                    }
                }
            }

            value = (token.type === Token.Template) ? token.value.raw : token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }

    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }

    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }

    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;

        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            } else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    function matchContextualKeyword(keyword) {
        return lookahead.type === Token.Identifier && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(startIndex) === 0x3B || match(';')) {
            lex();
            return;
        }

        if (hasLineTerminator) {
            return;
        }

        // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
        lastIndex = startIndex;
        lastLineNumber = startLineNumber;
        lastLineStart = startLineStart;

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }

    // Cover grammar support.
    //
    // When an assignment expression position starts with an left parenthesis, the determination of the type
    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
    //
    // There are three productions that can be parsed in a parentheses pair that needs to be determined
    // after the outermost pair is closed. They are:
    //
    //   1. AssignmentExpression
    //   2. BindingElements
    //   3. AssignmentTargets
    //
    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
    // binding element or assignment target.
    //
    // The three productions have the relationship:
    //
    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
    //
    // with a single exception that CoverInitializedName when used directly in an Expression, generates
    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
    //
    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
    // the CoverInitializedName check is conducted.
    //
    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
    // pattern. The CoverInitializedName check is deferred.
    function isolateCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        if (firstCoverInitializedNameError !== null) {
            throwUnexpectedToken(firstCoverInitializedNameError);
        }
        isBindingElement = oldIsBindingElement;
        isAssignmentTarget = oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
        return result;
    }

    function inheritCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        isBindingElement = isBindingElement && oldIsBindingElement;
        isAssignmentTarget = isAssignmentTarget && oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError || firstCoverInitializedNameError;
        return result;
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    function parseArrayPattern(params, kind) {
        var node = new Node(), elements = [], rest, restNode;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                if (match('...')) {
                    restNode = new Node();
                    lex();
                    params.push(lookahead);
                    rest = parseVariableIdentifier(params, kind);
                    elements.push(restNode.finishRestElement(rest));
                    break;
                } else {
                    elements.push(parsePatternWithDefault(params, kind));
                }
                if (!match(']')) {
                    expect(',');
                }
            }

        }

        expect(']');

        return node.finishArrayPattern(elements);
    }

    function parsePropertyPattern(params, kind) {
        var node = new Node(), key, keyToken, computed = match('['), init;
        if (lookahead.type === Token.Identifier) {
            keyToken = lookahead;
            key = parseVariableIdentifier();
            if (match('=')) {
                params.push(keyToken);
                lex();
                init = parseAssignmentExpression();

                return node.finishProperty(
                    'init', key, false,
                    new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, false);
            } else if (!match(':')) {
                params.push(keyToken);
                return node.finishProperty('init', key, false, key, false, true);
            }
        } else {
            key = parseObjectPropertyKey(params, kind);
        }
        expect(':');
        init = parsePatternWithDefault(params, kind);
        return node.finishProperty('init', key, computed, init, false, false);
    }

    function parseObjectPattern(params, kind) {
        var node = new Node(), properties = [];

        expect('{');

        while (!match('}')) {
            properties.push(parsePropertyPattern(params, kind));
            if (!match('}')) {
                expect(',');
            }
        }

        lex();

        return node.finishObjectPattern(properties);
    }

    function parsePattern(params, kind) {
        if (match('[')) {
            return parseArrayPattern(params, kind);
        } else if (match('{')) {
            return parseObjectPattern(params, kind);
        }
        params.push(lookahead);
        return parseVariableIdentifier(kind);
    }

    function parsePatternWithDefault(params, kind) {
        var startToken = lookahead, pattern, previousAllowYield, right;
        pattern = parsePattern(params, kind);
        if (match('=')) {
            lex();
            previousAllowYield = state.allowYield;
            state.allowYield = true;
            right = isolateCoverGrammar(parseAssignmentExpression);
            state.allowYield = previousAllowYield;
            pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
        }
        return pattern;
    }

    // ECMA-262 12.2.5 Array Initializer

    function parseArrayInitializer() {
        var elements = [], node = new Node(), restSpread;

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else if (match('...')) {
                restSpread = new Node();
                lex();
                restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    isAssignmentTarget = isBindingElement = false;
                    expect(',');
                }
                elements.push(restSpread);
            } else {
                elements.push(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // ECMA-262 12.2.6 Object Initializer

    function parsePropertyFunction(node, paramInfo, isGenerator) {
        var previousStrict, body;

        isAssignmentTarget = isBindingElement = false;

        previousStrict = strict;
        body = isolateCoverGrammar(parseFunctionSourceElements);

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node(),
            previousAllowYield = state.allowYield;

        state.allowYield = false;
        params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        method = parsePropertyFunction(node, params, false);
        state.allowYield = previousAllowYield;

        return method;
    }

    function parseObjectPropertyKey() {
        var token, node = new Node(), expr;

        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
        }
        throwUnexpectedToken(token);
    }

    function lookaheadPropertyName() {
        switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === '[';
        }
        return false;
    }

    // This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
    // it might be called at a position where there is in fact a short hand identifier pattern or a data property.
    // This can only be determined after we consumed up to the left parentheses.
    //
    // In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
    // is responsible to visit other options.
    function tryParseMethodDefinition(token, key, computed, node) {
        var value, options, methodNode, params,
            previousAllowYield = state.allowYield;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                }, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('get', key, computed, value, false, false);
            } else if (token.value === 'set' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');

                options = {
                    params: [],
                    defaultCount: 0,
                    defaults: [],
                    firstRestricted: null,
                    paramSet: {}
                };
                if (match(')')) {
                    tolerateUnexpectedToken(lookahead);
                } else {
                    state.allowYield = false;
                    parseParam(options);
                    state.allowYield = previousAllowYield;
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, options, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('set', key, computed, value, false, false);
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            methodNode = new Node();

            state.allowYield = true;
            params = parseParams();
            state.allowYield = previousAllowYield;

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, params, true);
            state.allowYield = previousAllowYield;

            return node.finishProperty('init', key, computed, value, true, false);
        }

        if (key && match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, proto, value;

        computed = match('[');
        if (match('*')) {
            lex();
        } else {
            key = parseObjectPropertyKey();
        }
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);
        if (maybeMethod) {
            return maybeMethod;
        }

        if (!key) {
            throwUnexpectedToken(lookahead);
        }

        // Check for duplicated __proto__
        if (!computed) {
            proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
                (key.type === Syntax.Literal && key.value === '__proto__');
            if (hasProto.value && proto) {
                tolerateError(Messages.DuplicateProtoProperty);
            }
            hasProto.value |= proto;
        }

        if (match(':')) {
            lex();
            value = inheritCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            if (match('=')) {
                firstCoverInitializedNameError = lookahead;
                lex();
                value = isolateCoverGrammar(parseAssignmentExpression);
                return node.finishProperty('init', key, computed,
                    new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
            }
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitializer() {
        var properties = [], hasProto = {value: false}, node = new Node();

        expect('{');

        while (!match('}')) {
            properties.push(parseObjectProperty(hasProto));

            if (!match('}')) {
                expectCommaSeparator();
            }
        }

        expect('}');

        return node.finishObjectExpression(properties);
    }

    function reinterpretExpressionAsPattern(expr) {
        var i;
        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
        }
    }

    // ECMA-262 12.2.9 Template Literals

    function parseTemplateElement(option) {
        var node, token;

        if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
            throwUnexpectedToken();
        }

        node = new Node();
        token = lex();

        return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, node = new Node();

        quasi = parseTemplateElement({ head: true });
        quasis = [quasi];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return node.finishTemplateLiteral(quasis, expressions);
    }

    // ECMA-262 12.2.10 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, i, params = [];

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [],
                rawParams: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement(params);
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        isBindingElement = true;
        expr = inheritCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            isAssignmentTarget = false;
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isBindingElement) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement(params));
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    isBindingElement = false;
                    for (i = 0; i < expressions.length; i++) {
                        reinterpretExpressionAsPattern(expressions[i]);
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                }

                expressions.push(inheritCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>')) {
            if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: [expr]
                };
            }

            if (!isBindingElement) {
                throwUnexpectedToken(lookahead);
            }

            if (expr.type === Syntax.SequenceExpression) {
                for (i = 0; i < expr.expressions.length; i++) {
                    reinterpretExpressionAsPattern(expr.expressions[i]);
                }
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            expr = {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
            };
        }
        isBindingElement = false;
        return expr;
    }


    // ECMA-262 12.2 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            isBindingElement = false;
            return inheritCoverGrammar(parseGroupExpression);
        }

        if (match('[')) {
            return inheritCoverGrammar(parseArrayInitializer);
        }

        if (match('{')) {
            return inheritCoverGrammar(parseObjectInitializer);
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            if (state.sourceType === 'module' && lookahead.value === 'await') {
                tolerateUnexpectedToken(lookahead);
            }
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            isAssignmentTarget = isBindingElement = false;
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
            if (!strict && state.allowYield && matchKeyword('yield')) {
                return parseNonComputedProperty();
            }
            isAssignmentTarget = isBindingElement = false;
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                return node.finishThisExpression();
            }
            if (matchKeyword('class')) {
                return parseClassExpression();
            }
            throwUnexpectedToken(lex());
        } else if (type === Token.BooleanLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            isAssignmentTarget = isBindingElement = false;
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else if (type === Token.Template) {
            expr = parseTemplateLiteral();
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], expr;

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                if (match('...')) {
                    expr = new Node();
                    lex();
                    expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
                } else {
                    expr = isolateCoverGrammar(parseAssignmentExpression);
                }
                args.push(expr);
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, node = new Node();

        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = isolateCoverGrammar(parseExpression);

        expect(']');

        return expr;
    }

    // ECMA-262 12.3.3 The new Operator

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');

        if (match('.')) {
            lex();
            if (lookahead.type === Token.Identifier && lookahead.value === 'target') {
                if (state.inFunctionBody) {
                    lex();
                    return node.finishMetaProperty('new', 'target');
                }
            }
            throwUnexpectedToken(lookahead);
        }

        callee = isolateCoverGrammar(parseLeftHandSideExpression);
        args = match('(') ? parseArguments() : [];

        isAssignmentTarget = isBindingElement = false;

        return node.finishNewExpression(callee, args);
    }

    // ECMA-262 12.3.4 Function Calls

    function parseLeftHandSideExpressionAllowCall() {
        var quasi, expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('(') && !match('.') && !match('[')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                isBindingElement = false;
                isAssignmentTarget = false;
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseLeftHandSideExpression() {
        var quasi, expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('[') && !match('.')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // ECMA-262 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                isAssignmentTarget = isBindingElement = false;

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            // ECMA-262 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
            isAssignmentTarget = isBindingElement = false;
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = inheritCoverGrammar(parseUnaryExpression);

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        isAssignmentTarget = isBindingElement = false;
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = isolateCoverGrammar(parseUnaryExpression);

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = isolateCoverGrammar(parseUnaryExpression);
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }

        return expr;
    }


    // ECMA-262 12.13 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = inheritCoverGrammar(parseBinaryExpression);
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = isolateCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = isolateCoverGrammar(parseAssignmentExpression);

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
            isAssignmentTarget = isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 14.2 Arrow Function Definitions

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return isolateCoverGrammar(parseAssignmentExpression);
    }

    function checkPatternParam(options, param) {
        var i;
        switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
        }
    }
    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
        }

        options = {
            paramSet: {}
        };

        for (i = 0, len = params.length; i < len; i += 1) {
            param = params[i];
            switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
            }
        }

        if (strict || !state.allowYield) {
            for (i = 0, len = params.length; i < len; i += 1) {
                param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    throwUnexpectedToken(lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, node) {
        var previousStrict, previousAllowYield, body;

        if (hasLineTerminator) {
            tolerateUnexpectedToken(lookahead);
        }
        expect('=>');

        previousStrict = strict;
        previousAllowYield = state.allowYield;
        state.allowYield = true;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // ECMA-262 14.4 Yield expression

    function parseYieldExpression() {
        var argument, expr, delegate, previousAllowYield;

        argument = null;
        expr = new Node();

        expectKeyword('yield');

        if (!hasLineTerminator) {
            previousAllowYield = state.allowYield;
            state.allowYield = false;
            delegate = match('*');
            if (delegate) {
                lex();
                argument = parseAssignmentExpression();
            } else {
                if (!match(';') && !match('}') && !match(')') && lookahead.type !== Token.EOF) {
                    argument = parseAssignmentExpression();
                }
            }
            state.allowYield = previousAllowYield;
        }

        return expr.finishYieldExpression(argument, delegate);
    }

    // ECMA-262 12.14 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        if (!state.allowYield && matchKeyword('yield')) {
            return parseYieldExpression();
        }

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            isAssignmentTarget = isBindingElement = false;
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                firstCoverInitializedNameError = null;
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }

            return expr;
        }

        if (matchAssign()) {
            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // ECMA-262 12.1.1
            if (strict && expr.type === Syntax.Identifier) {
                if (isRestrictedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                }
                if (isStrictModeReservedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                }
            }

            if (!match('=')) {
                isAssignmentTarget = isBindingElement = false;
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            token = lex();
            right = isolateCoverGrammar(parseAssignmentExpression);
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
            firstCoverInitializedNameError = null;
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = isolateCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(isolateCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
            case 'let':
                return parseLexicalDeclaration({inFor: false});
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
            }
        }

        return parseStatement();
    }

    function parseStatementList() {
        var list = [];
        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            list.push(parseStatementListItem());
        }

        return list;
    }

    function parseBlock() {
        var block, node = new Node();

        expect('{');

        block = parseStatementList();

        expect('}');

        return node.finishBlockStatement(block);
    }

    // ECMA-262 13.3.2 Variable Statement

    function parseVariableIdentifier(kind) {
        var token, node = new Node();

        token = lex();

        if (token.type === Token.Keyword && token.value === 'yield') {
            if (strict) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!state.allowYield) {
                throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (strict || token.value !== 'let' || kind !== 'var') {
                    throwUnexpectedToken(token);
                }
            }
        } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            tolerateUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration(options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = isolateCoverGrammar(parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            expect('=');
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList(options) {
        var list = [];

        do {
            list.push(parseVariableDeclaration({ inFor: options.inFor }));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseVariableStatement(node) {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList({ inFor: false });

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    function parseLexicalBinding(kind, options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (strict && id.type === Syntax.Identifier && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in') && !matchContextualKeyword('of')) {
                expect('=');
                init = isolateCoverGrammar(parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind, options) {
        var list = [];

        do {
            list.push(parseLexicalBinding(kind, options));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseLexicalDeclaration(options) {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind, options);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement(params) {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        params.push(lookahead);

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // ECMA-262 13.4 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // ECMA-262 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 13.6 If statement

    function parseIfStatement(node) {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return node.finishIfStatement(test, consequent, alternate);
    }

    // ECMA-262 13.7 Iteration Statements

    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return node.finishDoWhileStatement(body, test);
    }

    function parseWhileStatement(node) {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return node.finishWhileStatement(test, body);
    }

    function parseForStatement(node) {
        var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;
        forIn = true;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                declarations = parseVariableDeclarationList({ inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && matchKeyword('in')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = init.finishVariableDeclaration(declarations);
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                state.allowIn = false;
                declarations = parseBindingList(kind, {inFor: true});
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    consumeSemicolon();
                    init = init.finishLexicalDeclaration(declarations, kind);
                }
            } else {
                initStartToken = lookahead;
                state.allowIn = false;
                init = inheritCoverGrammar(parseAssignmentExpression);
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchContextualKeyword('of')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (match(',')) {
                        initSeq = [init];
                        while (match(',')) {
                            lex();
                            initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                        }
                        init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
                    }
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = isolateCoverGrammar(parseStatement);

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                forIn ? node.finishForInStatement(left, right, body) :
                    node.finishForOfStatement(left, right, body);
    }

    // ECMA-262 13.8 The continue statement

    function parseContinueStatement(node) {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(startIndex) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (hasLineTerminator) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(label);
    }

    // ECMA-262 13.9 The break statement

    function parseBreakStatement(node) {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(lastIndex) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (hasLineTerminator) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(label);
    }

    // ECMA-262 13.10 The return statement

    function parseReturnStatement(node) {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(lastIndex) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(lastIndex + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }

        if (hasLineTerminator) {
            // HACK
            return node.finishReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return node.finishReturnStatement(argument);
    }

    // ECMA-262 13.11 The with statement

    function parseWithStatement(node) {
        var object, body;

        if (strict) {
            tolerateError(Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return node.finishWithStatement(object, body);
    }

    // ECMA-262 13.12 The switch statement

    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (startIndex < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatementListItem();
            consequent.push(statement);
        }

        return node.finishSwitchCase(test, consequent);
    }

    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return node.finishSwitchStatement(discriminant, cases);
    }

    // ECMA-262 13.14 The throw statement

    function parseThrowStatement(node) {
        var argument;

        expectKeyword('throw');

        if (hasLineTerminator) {
            throwError(Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return node.finishThrowStatement(argument);
    }

    // ECMA-262 13.15 The try statement

    function parseCatchClause() {
        var param, params = [], paramMap = {}, key, i, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parsePattern(params);
        for (i = 0; i < params.length; i++) {
            key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        // ECMA-262 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }

    function parseTryStatement(node) {
        var block, handler = null, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handler = parseCatchClause();
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (!handler && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }

        return node.finishTryStatement(block, handler, finalizer);
    }

    // ECMA-262 13.16 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 13 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            node;

        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        isAssignmentTarget = isBindingElement = true;
        node = new Node();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
            }
        } else if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
            }
        }

        expr = parseExpression();

        // ECMA-262 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }

        consumeSemicolon();

        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 14.1 Function Definition

    function parseFunctionSourceElements() {
        var statement, body = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesisCount,
            node = new Node();

        expect('{');

        while (startIndex < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesisCount = state.parenthesizedCount;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            body.push(parseStatementListItem());
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesisCount;

        return node.finishBlockStatement(body);
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, params = [], i, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement(params);
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parsePatternWithDefault(params);
        for (i = 0; i < params.length; i++) {
            validateParam(options, params[i], params[i].value);
        }

        if (param.type === Syntax.AssignmentPattern) {
            def = param.right;
            param = param.left;
            ++options.defaultCount;
        }

        options.params.push(param);
        options.defaults.push(def);

        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (startIndex < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseFunctionDeclaration(node, identifierIsOptional) {
        var id = null, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict,
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        if (!identifierIsOptional || !match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        state.allowYield = !isGenerator;
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }


        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node(),
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        state.allowYield = !isGenerator;
        if (!match('(')) {
            token = lookahead;
            id = (!strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }

    // ECMA-262 14.5 Class Definitions

    function parseClassBody() {
        var classBody, token, isStatic, hasConstructor = false, body, method, computed, key;

        classBody = new Node();

        expect('{');
        body = [];
        while (!match('}')) {
            if (match(';')) {
                lex();
            } else {
                method = new Node();
                token = lookahead;
                isStatic = false;
                computed = match('[');
                if (match('*')) {
                    lex();
                } else {
                    key = parseObjectPropertyKey();
                    if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                        token = lookahead;
                        isStatic = true;
                        computed = match('[');
                        if (match('*')) {
                            lex();
                        } else {
                            key = parseObjectPropertyKey();
                        }
                    }
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method['static'] = isStatic; // jscs:ignore requireDotNotation
                    if (method.kind === 'init') {
                        method.kind = 'method';
                    }
                    if (!isStatic) {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                            if (method.kind !== 'method' || !method.method || method.value.generator) {
                                throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                            }
                            if (hasConstructor) {
                                throwUnexpectedToken(token, Messages.DuplicateConstructor);
                            } else {
                                hasConstructor = true;
                            }
                            method.kind = 'constructor';
                        }
                    } else {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                            throwUnexpectedToken(token, Messages.StaticPrototype);
                        }
                    }
                    method.type = Syntax.MethodDefinition;
                    delete method.method;
                    delete method.shorthand;
                    body.push(method);
                } else {
                    throwUnexpectedToken(lookahead);
                }
            }
        }
        lex();
        return classBody.finishClassBody(body);
    }

    function parseClassDeclaration(identifierIsOptional) {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (!identifierIsOptional || lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassDeclaration(id, superClass, classBody);
    }

    function parseClassExpression() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // ECMA-262 15.2 Modules

    function parseModuleSpecifier() {
        var node = new Node();

        if (lookahead.type !== Token.StringLiteral) {
            throwError(Messages.InvalidModuleSpecifier);
        }
        return node.finishLiteral(lex());
    }

    // ECMA-262 15.2.3 Exports

    function parseExportSpecifier() {
        var exported, local, node = new Node(), def;
        if (matchKeyword('default')) {
            // export {default} from 'something';
            def = new Node();
            lex();
            local = def.finishIdentifier('default');
        } else {
            local = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            exported = parseNonComputedProperty();
        }
        return node.finishExportSpecifier(local, exported);
    }

    function parseExportNamedDeclaration(node) {
        var declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [];

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
                case 'let':
                case 'const':
                case 'var':
                case 'class':
                case 'function':
                    declaration = parseStatementListItem();
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
            }
        }

        expect('{');
        while (!match('}')) {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from 'foo';
            // export {foo} from 'foo';
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }

    function parseExportDefaultDeclaration(node) {
        var declaration = null,
            expression = null;

        // covers:
        // export default ...
        expectKeyword('default');

        if (matchKeyword('function')) {
            // covers:
            // export default function foo () {}
            // export default function () {}
            declaration = parseFunctionDeclaration(new Node(), true);
            return node.finishExportDefaultDeclaration(declaration);
        }
        if (matchKeyword('class')) {
            declaration = parseClassDeclaration(true);
            return node.finishExportDefaultDeclaration(declaration);
        }

        if (matchContextualKeyword('from')) {
            throwError(Messages.UnexpectedToken, lookahead.value);
        }

        // covers:
        // export default {};
        // export default [];
        // export default (1 + 2);
        if (match('{')) {
            expression = parseObjectInitializer();
        } else if (match('[')) {
            expression = parseArrayInitializer();
        } else {
            expression = parseAssignmentExpression();
        }
        consumeSemicolon();
        return node.finishExportDefaultDeclaration(expression);
    }

    function parseExportAllDeclaration(node) {
        var src;

        // covers:
        // export * from 'foo';
        expect('*');
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return node.finishExportAllDeclaration(src);
    }

    function parseExportDeclaration() {
        var node = new Node();
        if (state.inFunctionBody) {
            throwError(Messages.IllegalExportDeclaration);
        }

        expectKeyword('export');

        if (matchKeyword('default')) {
            return parseExportDefaultDeclaration(node);
        }
        if (match('*')) {
            return parseExportAllDeclaration(node);
        }
        return parseExportNamedDeclaration(node);
    }

    // ECMA-262 15.2.2 Imports

    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var local, imported, node = new Node();

        imported = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            local = parseVariableIdentifier();
        }

        return node.finishImportSpecifier(local, imported);
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        while (!match('}')) {
            specifiers.push(parseImportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var local, node = new Node();

        local = parseNonComputedProperty();

        return node.finishImportDefaultSpecifier(local);
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var local, node = new Node();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError(Messages.NoAsAfterImportNamespace);
        }
        lex();
        local = parseNonComputedProperty();

        return node.finishImportNamespaceSpecifier(local);
    }

    function parseImportDeclaration() {
        var specifiers = [], src, node = new Node();

        if (state.inFunctionBody) {
            throwError(Messages.IllegalImportDeclaration);
        }

        expectKeyword('import');

        if (lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = parseModuleSpecifier();
        } else {

            if (match('{')) {
                // import {bar}
                specifiers = specifiers.concat(parseNamedImports());
            } else if (match('*')) {
                // import * as foo
                specifiers.push(parseImportNamespaceSpecifier());
            } else if (isIdentifierName(lookahead) && !matchKeyword('default')) {
                // import foo
                specifiers.push(parseImportDefaultSpecifier());
                if (match(',')) {
                    lex();
                    if (match('*')) {
                        // import foo, * as foo
                        specifiers.push(parseImportNamespaceSpecifier());
                    } else if (match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(parseNamedImports());
                    } else {
                        throwUnexpectedToken(lookahead);
                    }
                }
            } else {
                throwUnexpectedToken(lex());
            }

            if (!matchContextualKeyword('from')) {
                throwError(lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
        }

        consumeSemicolon();
        return node.finishImportDeclaration(specifiers, src);
    }

    // ECMA-262 15.1 Scripts

    function parseScriptBody() {
        var statement, body = [], token, directive, firstRestricted;

        while (startIndex < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (startIndex < length) {
            statement = parseStatementListItem();
            /* istanbul ignore if */
            if (typeof statement === 'undefined') {
                break;
            }
            body.push(statement);
        }
        return body;
    }

    function parseProgram() {
        var body, node;

        peek();
        node = new Node();

        body = parseScriptBody();
        return node.finishProgram(body, state.sourceType);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options) {
        var toString,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: []
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                } catch (lexError) {
                    if (extra.errors) {
                        recordError(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: [],
            sourceType: 'script'
        };
        strict = false;

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
            if (options.sourceType === 'module') {
                // very restrictive condition for now
                state.sourceType = options.sourceType;
                strict = true;
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '2.6.0';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],96:[function(require,module,exports){
/*jshint node:true */
"use strict";


var esprima = require('esprima');



// ---

// we expose the flags so other tools can tweak the values (#8)
exports.BYPASS_RECURSION = {
    root : true,
    comments : true,
    tokens : true,

    loc : true,
    range : true,

    parent : true,
    next : true,
    prev : true,

    // esprima@2.1 introduces a "handler" property on TryStatement in addition to
    // "handlers", which contains the same node, so we would
    // loop the same node twice (see jquery/esprima/issues/1031 and #264)`
    //
    // Instead, ignore the handlers list in favor of the standardized "handler"
    // property: https://github.com/eslint/eslint/issues/1930
    handlers : true,

    // IMPORTANT! "value" can't be bypassed since it is used by object
    // expression
    type : true,
    raw : true,

    startToken : true,
    endToken : true
};


// ---

var _addLocInfo;

// ---

exports.parseFn = esprima.parse;
exports.parseContext = esprima;
// we need range/tokens/comment info to build the tokens linked list!
exports.parseOptions = {
    range: true,
    tokens: true,
    comment: true
};

// parse string and return an augmented AST
exports.parse = function parse(source, opts){
    opts = opts || {};
    _addLocInfo = Boolean(opts.loc);
    source = source.toString();

    Object.keys(exports.parseOptions).forEach(function(key) {
        if (!(key in opts)) {
            opts[key] = exports.parseOptions[key];
        }
    });

    var ast = exports.parseFn.call(exports.parseContext, source, opts);

    // we augment just root node since program is "empty"
    // can't check `ast.body.length` because it might contain just comments
    if (!ast.tokens.length && !ast.comments.length) {
        ast.depth = 0;
        ast.startToken = ast.endToken = null;
        ast.toString = _nodeProto.toString;
        return ast;
    }

    instrumentTokens(ast, source);

    // update program range since it doesn't include white spaces and comments
    // before/after the program body by default
    var lastToken = ast.tokens[ast.tokens.length - 1];
    ast.range[0] = ast.tokens[0].range[0];
    ast.range[1] = lastToken.range[1];
    if (_addLocInfo) {
        ast.loc.start.line = 0;
        ast.loc.start.column = 0;
        ast.loc.end.line = lastToken.loc.end.line;
        ast.loc.end.column = lastToken.loc.end.column;
    }

    var toString = _nodeProto.toString;
    var instrumentNodes = function(node, parent, prev, next){

        node.parent = parent;
        node.prev = prev;
        node.next = next;
        node.depth = parent? parent.depth + 1 : 0; // used later for moonwalk

        node.toString = toString;

        // we do not add nextToken and prevToken to avoid updating even more
        // references during each remove/before/after you can grab the
        // prev/next token by simply accesing the startToken.prev and
        // endToken.next
        var prevToken = prev? prev.endToken : (parent? parent.startToken : null);
        var nextToken = parent? parent.endToken : null;
        node.startToken = prevToken? getNodeStartToken(prevToken, node.range) : ast.tokens[0];
        node.endToken = nextToken? getNodeEndToken(nextToken, node.range) : ast.tokens[ast.tokens.length - 1];
    };
    recursiveWalk(ast, instrumentNodes);

    return ast;
};


var _nodeProto = {};

// get the node string
_nodeProto.toString = function(){
    var str = '';
    var token = this.startToken;
    if (!token) return str;
    do {
        str += ('raw' in token)? token.raw : token.value;
        token = token.next;
    } while (token && token !== this.endToken.next);
    return str;
};


function getNodeStartToken(token, range){
    var startRange = range[0];
    while (token){
        if (token.range[0] >= startRange) {
            return token;
        }
        token = token.next;
    }
}

function getNodeEndToken(token, range){
    var endRange = range[1];
    while (token){
        if (token.range[1] <= endRange) {
            return token;
        }
        token = token.prev;
    }
}



function getPrevToken(tokens, range){
    var result, token,
        startRange = range[0],
        n = tokens.length;
    while (n--) {
        token = tokens[n];
        if (token.range[1] <= startRange) {
            result = token;
            break;
        }
    }
    return result;
}






function instrumentTokens(ast, source){

    var tokens = ast.tokens;


    // --- inject comments into tokens list
    var comments = ast.comments;
    var comment,
        q = -1,
        nComments = comments.length;

    while (++q < nComments) {
        comment = comments[q];
        // we edit it in place since it is faster, will also affect
        comment.raw = comment.type === 'Block'? '/*'+ comment.value +'*/' : '//'+ comment.value;
        comment.type += 'Comment';

        var prevToken = getPrevToken(tokens, comment.range);
        var prevIndex = prevToken? tokens.indexOf(prevToken) : -1;
        tokens.splice(prevIndex + 1, 0, comment);
    }


    // --- inject white spaces and line breaks

    // we create a new array since it's simpler than using splice, it will
    // also avoid mistakes
    var result = [];

    // insert white spaces before start of program
    var wsTokens;
    var firstToken = ast.tokens[0];
    var raw;
    if ( firstToken.range[0] ) {
        raw = source.substring(0, firstToken.range[0]);
        result = result.concat( getWhiteSpaceTokens(raw, null) );
    }

    // insert white spaces between regular tokens
    // faster than forEach and reduce lookups
    var i = -1,
        nTokens = tokens.length,
        token, prev;
    var k, nWs;
    while (++i < nTokens) {
        token = tokens[i];
        if (i) {
            if (prev.range[1] < token.range[0]) {
                wsTokens = getWhiteSpaceTokens(source.substring(prev.range[1], token.range[0]), prev);
                // faster than concat or push.apply
                k = -1;
                nWs = wsTokens.length;
                while (++k < nWs) {
                    result.push(wsTokens[k]);
                }
            }
        }
        result.push(token);
        prev = token;
    }

    // insert white spaces after end of program
    var lastToken = ast.tokens[ast.tokens.length - 1];
    if (lastToken.range[1] < source.length) {
        wsTokens = getWhiteSpaceTokens(source.substring(lastToken.range[1], source.length), lastToken);
        k = -1;
        nWs = wsTokens.length;
        while (++k < nWs) {
            result.push(wsTokens[k]);
        }
    }

    // --- instrument tokens

    // need to come afterwards since we add line breaks and comments
    var n;
    for (i = 0, n = result.length, token; i < n; i++) {
        token = result[i];
        token.prev = i? result[i - 1] : undefined;
        token.next = result[i + 1];
        token.root = ast; // used internally
        // original indent is very important for block comments since some
        // transformations require manipulation of raw comment value
        if (
          token.type === 'BlockComment' &&
          token.prev && token.prev.type === 'WhiteSpace' &&
          (!token.prev.prev || (token.prev.prev.type === 'LineBreak'))
        ) {
          token.originalIndent = token.prev.value;
        }
    }

    ast.tokens = result;
}


function getWhiteSpaceTokens(raw, prev){
    var whiteSpaces = getWhiteSpaces(raw);

    var startRange = prev? prev.range[1] : 0;
    // line starts at 1 !!!
    var startLine, startColumn;
    if (_addLocInfo) {
        startLine = prev? prev.loc.end.line : 1;
        startColumn = prev? prev.loc.end.column : 0;
    }

    var tokens = [];
    for (var i = 0, n = whiteSpaces.length, value; i < n; i++){
        value = whiteSpaces[i];

        var wsToken = { value : value };
        var isBr = '\r\n'.indexOf(value) >= 0;
        wsToken.type = isBr? 'LineBreak' : 'WhiteSpace';
        wsToken.range = [startRange, startRange + value.length];

        if (_addLocInfo) {
            wsToken.loc = {
                start : {
                    line : startLine,
                    column : startColumn
                },
                end : {
                    line : startLine, // yes, br starts and end on same line
                    column : startColumn + value.length
                }
            };

            if (isBr) {
                // next token after a <br> always starts at zero and on next line
                startLine = wsToken.loc.end.line + 1;
                startColumn = 0;
            } else {
                startLine = wsToken.loc.end.line;
                startColumn = wsToken.loc.end.column;
            }
        }

        startRange += value.length;
        tokens.push(wsToken);
    }

    return tokens;
}


function getWhiteSpaces(source) {
    var result = [];
    var whiteSpaces = source.split('');
    var buf = '';
    for (var value, i = 0, nSpaces = whiteSpaces.length; i < nSpaces; i++) {
        value = whiteSpaces[i];
        switch(value){
            case '\n':
                if (buf === '\r') {
                    // DOS line break
                    result.push(buf + value);
                } else {
                    if (buf) {
                        result.push(buf);
                    }
                    // unix break
                    result.push(value);
                }
                buf = '';
                break;
            case '\r':
                // might be multiple consecutive Mac breaks
                if (buf) {
                    result.push(buf);
                }
                buf = value;
                break;
            default:
                if (buf === '\r') {
                    result.push(buf);
                    buf = value;
                } else {
                    // group multiple white spaces into same token
                    buf += value;
                }
        }
    }
    if (buf) {
        result.push(buf);
    }
    return result;
}



exports.walk = exports.recursive = recursiveWalk;

// heavily inspired by node-falafel
// walk nodes recursively starting from root
function recursiveWalk(node, fn, parent, prev, next){
    // sparse arrays might have `null` elements, so we skip those for now
    // see issue #15
    if ( !node || fn(node, parent, prev, next) === false ) {
        return; // stop recursion
    }

    // faster than for in
    var keys = Object.keys(node),
        child, key;

    for (var i = 0, nKeys = keys.length; i < nKeys; i++) {

        key = keys[i];
        child = node[key];

        // only need to recurse real nodes and arrays
        // ps: typeof null == 'object'
        if (!child || typeof child !== 'object' || exports.BYPASS_RECURSION[key]) {
            continue;
        }

        // inception
        if (typeof child.type === 'string') { // faster than boolean coercion
            recursiveWalk(child, fn, node);
        } else if ( typeof child.length === 'number' ) { // faster than Array.isArray and boolean coercion
            // faster than forEach
            for (var k = 0, nChilds = child.length; k < nChilds; k++) {
                recursiveWalk(child[k], fn, node, (k? child[k - 1] : undefined), child[k + 1] );
            }
        }

    }

}



// walk AST starting from leaf nodes
exports.moonwalk = function moonwalk(ast, fn){
    if (typeof ast === 'string') {
        ast = exports.parse(ast);
    }

    // we create a separate array for each depth and than we flatten it to
    // boost performance, way faster than doing an insertion sort
    var swap = [];
    recursiveWalk(ast, function(node){
        if (! swap[node.depth]) {
            swap[node.depth] = [];
        }
        swap[node.depth].push(node);
    });

    var nodes = [];
    var nDepths = swap.length, cur;
    while (cur = swap[--nDepths]) {
        for (var i = 0, n = cur.length; i < n; i++) {
            nodes.push(cur[i]);
        }
    }

    nodes.forEach(fn);
    return ast;
};


},{"esprima":95}],97:[function(require,module,exports){
/*!
	strip-json-comments
	Strip comments from JSON. Lets you use comments in your JSON files!
	https://github.com/sindresorhus/strip-json-comments
	by Sindre Sorhus
	MIT License
*/
(function () {
	'use strict';

	function stripJsonComments(str) {
		var currentChar;
		var nextChar;
		var insideString = false;
		var insideComment = false;
		var ret = '';

		for (var i = 0; i < str.length; i++) {
			currentChar = str[i];
			nextChar = str[i + 1];

			if (!insideComment && str[i - 1] !== '\\' && currentChar === '"') {
				insideString = !insideString;
			}

			if (insideString) {
				ret += currentChar;
				continue;
			}

			if (!insideComment && currentChar + nextChar === '//') {
				insideComment = 'single';
				i++;
			} else if (insideComment === 'single' && currentChar + nextChar === '\r\n') {
				insideComment = false;
				i++;
			} else if (insideComment === 'single' && currentChar === '\n') {
				insideComment = false;
			} else if (!insideComment && currentChar + nextChar === '/*') {
				insideComment = 'multi';
				i++;
				continue;
			} else if (insideComment === 'multi' && currentChar + nextChar === '*/') {
				insideComment = false;
				i++;
				continue;
			}

			if (insideComment) {
				continue;
			}

			ret += currentChar;
		}

		return ret;
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = stripJsonComments;
	} else {
		window.stripJsonComments = stripJsonComments;
	}
})();

},{}],98:[function(require,module,exports){
'use strict';
module.exports = require('os-homedir')();

},{"os-homedir":99}],99:[function(require,module,exports){
(function (process){
'use strict';
var os = require('os');

function homedir() {
	var env = process.env;
	var home = env.HOME;
	var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

	if (process.platform === 'win32') {
		return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
	}

	if (process.platform === 'darwin') {
		return home || (user ? '/Users/' + user : null);
	}

	if (process.platform === 'linux') {
		return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
	}

	return home || null;
}

module.exports = typeof os.homedir === 'function' ? os.homedir : homedir;

}).call(this,require('_process'))
},{"_process":4,"os":2}],100:[function(require,module,exports){


    /**
     * Array.indexOf
     */
    function indexOf(arr, item, fromIndex) {
        fromIndex = fromIndex || 0;
        if (arr == null) {
            return -1;
        }

        var len = arr.length,
            i = fromIndex < 0 ? len + fromIndex : fromIndex;
        while (i < len) {
            // we iterate over sparse items since there is no way to make it
            // work properly on IE 7-8. see #64
            if (arr[i] === item) {
                return i;
            }

            i++;
        }

        return -1;
    }

    module.exports = indexOf;


},{}],101:[function(require,module,exports){
var indexOf = require('./indexOf');

    /**
     * Remove a single item from the array.
     * (it won't remove duplicates, just a single item)
     */
    function remove(arr, item){
        var idx = indexOf(arr, item);
        if (idx !== -1) arr.splice(idx, 1);
    }

    module.exports = remove;


},{"./indexOf":100}],102:[function(require,module,exports){


    /**
     * Create slice of source array or array-like object
     */
    function slice(arr, start, end){
        var len = arr.length;

        if (start == null) {
            start = 0;
        } else if (start < 0) {
            start = Math.max(len + start, 0);
        } else {
            start = Math.min(start, len);
        }

        if (end == null) {
            end = len;
        } else if (end < 0) {
            end = Math.max(len + end, 0);
        } else {
            end = Math.min(end, len);
        }

        var result = [];
        while (start < end) {
            result.push(arr[start++]);
        }

        return result;
    }

    module.exports = slice;



},{}],103:[function(require,module,exports){
var slice = require('../array/slice');

    /**
     * Creates a partially applied function.
     */
    function partial(f) {
        var as = slice(arguments, 1);
        return function() {
            var args = as.concat(slice(arguments));
            for (var i = args.length; i--;) {
                if (args[i] === partial._) {
                    args[i] = args.splice(-1)[0];
                }
            }
            return f.apply(this, args);
        };
    }

    partial._ = {};

    module.exports = partial;



},{"../array/slice":102}],104:[function(require,module,exports){
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');
var mixIn = require('../object/mixIn');

    /**
     * Clone native types.
     */
    function clone(val){
        switch (kindOf(val)) {
            case 'Object':
                return cloneObject(val);
            case 'Array':
                return cloneArray(val);
            case 'RegExp':
                return cloneRegExp(val);
            case 'Date':
                return cloneDate(val);
            default:
                return val;
        }
    }

    function cloneObject(source) {
        if (isPlainObject(source)) {
            return mixIn({}, source);
        } else {
            return source;
        }
    }

    function cloneRegExp(r) {
        var flags = '';
        flags += r.multiline ? 'm' : '';
        flags += r.global ? 'g' : '';
        flags += r.ignoreCase ? 'i' : '';
        return new RegExp(r.source, flags);
    }

    function cloneDate(date) {
        return new Date(+date);
    }

    function cloneArray(arr) {
        return arr.slice();
    }

    module.exports = clone;



},{"../object/mixIn":118,"./isPlainObject":108,"./kindOf":110}],105:[function(require,module,exports){
var clone = require('./clone');
var forOwn = require('../object/forOwn');
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');

    /**
     * Recursively clone native types.
     */
    function deepClone(val, instanceClone) {
        switch ( kindOf(val) ) {
            case 'Object':
                return cloneObject(val, instanceClone);
            case 'Array':
                return cloneArray(val, instanceClone);
            default:
                return clone(val);
        }
    }

    function cloneObject(source, instanceClone) {
        if (isPlainObject(source)) {
            var out = {};
            forOwn(source, function(val, key) {
                this[key] = deepClone(val, instanceClone);
            }, out);
            return out;
        } else if (instanceClone) {
            return instanceClone(source);
        } else {
            return source;
        }
    }

    function cloneArray(arr, instanceClone) {
        var out = [],
            i = -1,
            n = arr.length,
            val;
        while (++i < n) {
            out[i] = deepClone(arr[i], instanceClone);
        }
        return out;
    }

    module.exports = deepClone;




},{"../object/forOwn":115,"./clone":104,"./isPlainObject":108,"./kindOf":110}],106:[function(require,module,exports){
var kindOf = require('./kindOf');
    /**
     * Check if value is from a specific "kind".
     */
    function isKind(val, kind){
        return kindOf(val) === kind;
    }
    module.exports = isKind;


},{"./kindOf":110}],107:[function(require,module,exports){
var isKind = require('./isKind');
    /**
     */
    function isObject(val) {
        return isKind(val, 'Object');
    }
    module.exports = isObject;


},{"./isKind":106}],108:[function(require,module,exports){


    /**
     * Checks if the value is created by the `Object` constructor.
     */
    function isPlainObject(value) {
        return (!!value && typeof value === 'object' &&
            value.constructor === Object);
    }

    module.exports = isPlainObject;



},{}],109:[function(require,module,exports){


    /**
     * Checks if the object is a primitive
     */
    function isPrimitive(value) {
        // Using switch fallthrough because it's simple to read and is
        // generally fast: http://jsperf.com/testing-value-is-primitive/5
        switch (typeof value) {
            case "string":
            case "number":
            case "boolean":
                return true;
        }

        return value == null;
    }

    module.exports = isPrimitive;



},{}],110:[function(require,module,exports){


    var _rKind = /^\[object (.*)\]$/,
        _toString = Object.prototype.toString,
        UNDEF;

    /**
     * Gets the "kind" of value. (e.g. "String", "Number", etc)
     */
    function kindOf(val) {
        if (val === null) {
            return 'Null';
        } else if (val === UNDEF) {
            return 'Undefined';
        } else {
            return _rKind.exec( _toString.call(val) )[1];
        }
    }
    module.exports = kindOf;


},{}],111:[function(require,module,exports){


    /**
     * Typecast a value to a String, using an empty string value for null or
     * undefined.
     */
    function toString(val){
        return val == null ? '' : val.toString();
    }

    module.exports = toString;



},{}],112:[function(require,module,exports){


    /**
     * "Convert" value into an 32-bit integer.
     * Works like `Math.floor` if val > 0 and `Math.ceil` if val < 0.
     * IMPORTANT: val will wrap at 2^31 and -2^31.
     * Perf tests: http://jsperf.com/vs-vs-parseint-bitwise-operators/7
     */
    function toInt(val){
        // we do not use lang/toNumber because of perf and also because it
        // doesn't break the functionality
        return ~~val;
    }

    module.exports = toInt;



},{}],113:[function(require,module,exports){
var forOwn = require('./forOwn');
var isPlainObject = require('../lang/isPlainObject');

    /**
     * Mixes objects into the target object, recursively mixing existing child
     * objects.
     */
    function deepMixIn(target, objects) {
        var i = 0,
            n = arguments.length,
            obj;

        while(++i < n){
            obj = arguments[i];
            if (obj) {
                forOwn(obj, copyProp, target);
            }
        }

        return target;
    }

    function copyProp(val, key) {
        var existing = this[key];
        if (isPlainObject(val) && isPlainObject(existing)) {
            deepMixIn(existing, val);
        } else {
            this[key] = val;
        }
    }

    module.exports = deepMixIn;



},{"../lang/isPlainObject":108,"./forOwn":115}],114:[function(require,module,exports){
var hasOwn = require('./hasOwn');

    var _hasDontEnumBug,
        _dontEnums;

    function checkDontEnum(){
        _dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ];

        _hasDontEnumBug = true;

        for (var key in {'toString': null}) {
            _hasDontEnumBug = false;
        }
    }

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forIn(obj, fn, thisObj){
        var key, i = 0;
        // no need to check if argument is a real object that way we can use
        // it for arrays, functions, date, etc.

        //post-pone check till needed
        if (_hasDontEnumBug == null) checkDontEnum();

        for (key in obj) {
            if (exec(fn, obj, key, thisObj) === false) {
                break;
            }
        }


        if (_hasDontEnumBug) {
            var ctor = obj.constructor,
                isProto = !!ctor && obj === ctor.prototype;

            while (key = _dontEnums[i++]) {
                // For constructor, if it is a prototype object the constructor
                // is always non-enumerable unless defined otherwise (and
                // enumerated above).  For non-prototype objects, it will have
                // to be defined on this object, since it cannot be defined on
                // any prototype objects.
                //
                // For other [[DontEnum]] properties, check if the value is
                // different than Object prototype value.
                if (
                    (key !== 'constructor' ||
                        (!isProto && hasOwn(obj, key))) &&
                    obj[key] !== Object.prototype[key]
                ) {
                    if (exec(fn, obj, key, thisObj) === false) {
                        break;
                    }
                }
            }
        }
    }

    function exec(fn, obj, key, thisObj){
        return fn.call(thisObj, obj[key], key, obj);
    }

    module.exports = forIn;



},{"./hasOwn":117}],115:[function(require,module,exports){
var hasOwn = require('./hasOwn');
var forIn = require('./forIn');

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forOwn(obj, fn, thisObj){
        forIn(obj, function(val, key){
            if (hasOwn(obj, key)) {
                return fn.call(thisObj, obj[key], key, obj);
            }
        });
    }

    module.exports = forOwn;



},{"./forIn":114,"./hasOwn":117}],116:[function(require,module,exports){
var isPrimitive = require('../lang/isPrimitive');

    /**
     * get "nested" object property
     */
    function get(obj, prop){
        var parts = prop.split('.'),
            last = parts.pop();

        while (prop = parts.shift()) {
            obj = obj[prop];
            if (obj == null) return;
        }

        return obj[last];
    }

    module.exports = get;



},{"../lang/isPrimitive":109}],117:[function(require,module,exports){


    /**
     * Safer Object.hasOwnProperty
     */
     function hasOwn(obj, prop){
         return Object.prototype.hasOwnProperty.call(obj, prop);
     }

     module.exports = hasOwn;



},{}],118:[function(require,module,exports){
var forOwn = require('./forOwn');

    /**
    * Combine properties from all the objects into first one.
    * - This method affects target object in place, if you want to create a new Object pass an empty object as first param.
    * @param {object} target    Target Object
    * @param {...object} objects    Objects to be combined (0...n objects).
    * @return {object} Target Object.
    */
    function mixIn(target, objects){
        var i = 0,
            n = arguments.length,
            obj;
        while(++i < n){
            obj = arguments[i];
            if (obj != null) {
                forOwn(obj, copyProp, target);
            }
        }
        return target;
    }

    function copyProp(val, key){
        this[key] = val;
    }

    module.exports = mixIn;


},{"./forOwn":115}],119:[function(require,module,exports){
var toString = require('../lang/toString');

    /**
     * Escape RegExp string chars.
     */
    function escapeRegExp(str) {
        return toString(str).replace(/\W/g,'\\$&');
    }

    module.exports = escapeRegExp;



},{"../lang/toString":111}],120:[function(require,module,exports){
var toString = require('../lang/toString');
var toInt = require('../number/toInt');

    /**
     * Repeat string n times
     */
     function repeat(str, n){
         var result = '';
         str = toString(str);
         n = toInt(n);
        if (n < 1) {
            return '';
        }
        while (n > 0) {
            if (n % 2) {
                result += str;
            }
            n = Math.floor(n / 2);
            str += str;
        }
        return result;
     }

     module.exports = repeat;



},{"../lang/toString":111,"../number/toInt":112}],"formatter":[function(require,module,exports){
'use strict';

// non-destructive changes to EcmaScript code using an "enhanced" AST for the
// process, it updates the tokens in place and add/remove spaces & line breaks
// based on user settings.
// not using any kind of code rewrite based on string concatenation to avoid
// breaking the program correctness and/or undesired side-effects.

var plugins = require('./plugins');

exports.diff = require('./diff');
exports.hooks = require('./hooks');
exports.format = require('./format');
exports.transform = require('./transform');
exports.rc = require('./options').getRc;
exports.register = plugins.register;
exports.unregister = plugins.unregister;
exports.unregisterAll = plugins.unregisterAll;

},{"./diff":5,"./format":6,"./hooks":7,"./options":49,"./plugins":50,"./transform":53}],"mout/object/merge":[function(require,module,exports){
var hasOwn = require('./hasOwn');
var deepClone = require('../lang/deepClone');
var isObject = require('../lang/isObject');

    /**
     * Deep merge objects.
     */
    function merge() {
        var i = 1,
            key, val, obj, target;

        // make sure we don't modify source element and it's properties
        // objects are passed by reference
        target = deepClone( arguments[0] );

        while (obj = arguments[i++]) {
            for (key in obj) {
                if ( ! hasOwn(obj, key) ) {
                    continue;
                }

                val = obj[key];

                if ( isObject(val) && isObject(target[key]) ){
                    // inception, deep merge objects
                    target[key] = merge(target[key], val);
                } else {
                    // make sure arrays, regexp, date, objects are cloned
                    target[key] = deepClone(val);
                }

            }
        }

        return target;
    }

    module.exports = merge;



},{"../lang/deepClone":105,"../lang/isObject":107,"./hasOwn":117}]},{},[]);
;(function() {
  var buf = '';
  var esformatter;
  var merge = require('mout/object/merge');
  try {
    // Try to require the global esformatter
    esformatter = require('esformatter');
  } catch (ex) {
    // Use the bundle version
    esformatter = require('formatter');
  }
  var basepath = process.argv[2],
    options = JSON.parse(process.argv[3] || "{}");
  if (esformatter.rc && basepath) {
    basepath = basepath.replace(/\\/g, "/");
    options = merge(options, esformatter.rc(basepath));
  }

  process.stdin.on('data', function(chunk) {
    buf += chunk;
  });

  process.stdin.on('end', function() {
    try {
      var result = esformatter.format(buf, options);
      process.stdout.write(JSON.stringify({
        text: result
      }));
      setTimeout(function() {
        // When opening many threads, the buffer might be slow and send back
        // an empty string. Wait a little bit for the drain
        process.exit(0);
      }, 15);
    } catch (ex) {
      process.stdout.write(JSON.stringify({
        err: 'Unable to format'
      }));
    }
  });

  process.stdin.resume();
})();
//based on esformatter 0.7.1