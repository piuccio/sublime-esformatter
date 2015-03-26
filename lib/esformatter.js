#!/usr/bin/env node
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
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

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
"use strict";


// Hooks for each node.type that should be processed individually
// ---
// using an object to store each transform method to avoid a long switch
// statement, will be more organized in the long run and also allow
// monkey-patching/spies/mock/stub.


// we are not using something like https://npmjs.org/package/require-all
// because we want esformatter to be able to run in the browser in the future

exports.ArrayExpression = require('./hooks/ArrayExpression');
exports.AssignmentExpression = require('./hooks/AssignmentExpression');
exports.BinaryExpression = require('./hooks/BinaryExpression');
exports.CallExpression = exports.NewExpression = require('./hooks/CallExpression');
exports.CatchClause = require('./hooks/CatchClause');
exports.ConditionalExpression = require('./hooks/ConditionalExpression');
exports.DoWhileStatement = require('./hooks/DoWhileStatement');
exports.ForInStatement = require('./hooks/ForInStatement');
exports.ForStatement = require('./hooks/ForStatement');
exports.FunctionDeclaration = require('./hooks/FunctionDeclaration');
exports.FunctionExpression = require('./hooks/FunctionExpression');
exports.IfStatement = require('./hooks/IfStatement');
exports.LogicalExpression = require('./hooks/LogicalExpression');
exports.MemberExpression = require('./hooks/MemberExpression');
exports.ObjectExpression = require('./hooks/ObjectExpression');
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




},{"./hooks/ArrayExpression":4,"./hooks/AssignmentExpression":5,"./hooks/BinaryExpression":6,"./hooks/CallExpression":7,"./hooks/CatchClause":8,"./hooks/ConditionalExpression":9,"./hooks/DoWhileStatement":10,"./hooks/ForInStatement":11,"./hooks/ForStatement":12,"./hooks/FunctionDeclaration":13,"./hooks/FunctionExpression":14,"./hooks/IfStatement":15,"./hooks/LogicalExpression":16,"./hooks/MemberExpression":17,"./hooks/ObjectExpression":18,"./hooks/ReturnStatement":20,"./hooks/SequenceExpression":21,"./hooks/SwitchCase":22,"./hooks/SwitchStatement":23,"./hooks/ThrowStatement":24,"./hooks/TryStatement":25,"./hooks/UnaryExpression":26,"./hooks/UpdateExpression":27,"./hooks/VariableDeclaration":28,"./hooks/WhileStatement":29}],4:[function(require,module,exports){
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

  var end = isChainedMemberExpressionArgument(node) ?
    node.endToken.prev :
    node.endToken;

  return start ? {
    startToken: start,
    endToken: end
  } : false;
};


function isChainedMemberExpressionArgument(node) {
  return (
    node.parent &&
    node.parent.type === 'CallExpression' &&
    node.parent.callee.type === 'MemberExpression'
  );
}

},{"../limit":32,"rocambole-token":62}],5:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');
var _br = require('../lineBreak');


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
      endToken: node.endToken.next || node.endToken
    };
  }
};

},{"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],6:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


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

},{"../whiteSpace":39,"rocambole-token":62}],7:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _limit = require('../limit');
var _parens = require('./expressionParentheses');


exports.format = function CallExpression(node) {
  var openingParentheses = _tk.findNext(node.callee.endToken, '(');
  var closingParentheses = node.endToken;

  _limit.around(openingParentheses, 'CallExpressionOpeningParentheses');
  _limit.around(closingParentheses, 'CallExpressionClosingParentheses');

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

  } else {
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

  var openingParentheses = _tk.findNext(node.callee.endToken, '(');

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

},{"../limit":32,"./expressionParentheses":30,"rocambole-token":62}],8:[function(require,module,exports){
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

},{"../limit":32,"rocambole-token":62}],9:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


exports.format = function ConditionalExpression(node) {
  // we need to grab the actual punctuators since parenthesis aren't counted
  // as part of test/consequent/alternate
  var questionMark = _tk.findNext(node.test.endToken, '?');
  var colon = _tk.findNext(node.consequent.endToken, ':');

  _ws.limitBefore(questionMark, _ws.getAmountAfterType('ConditionalExpressionTest'));
  _ws.limitAfter(questionMark, _ws.getAmountBeforeType('ConditionalExpressionConsequent'));
  _ws.limitBefore(colon, _ws.getAmountAfterType('ConditionalExpressionConsequent'));
  _ws.limitAfter(colon, _ws.getAmountBeforeType('ConditionalExpressionAlternate'));
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

},{"../whiteSpace":39,"rocambole-token":62}],10:[function(require,module,exports){
'use strict';

var _tk = require('rocambole-token');
var _limit = require('../limit');
var _ws = require('../whiteSpace');


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

},{"../limit":32,"../whiteSpace":39,"rocambole-token":62}],11:[function(require,module,exports){
"use strict";

var _br = require('../lineBreak');
var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


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

},{"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],12:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');
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
      startToken: args.endToken.next,
      endToken: node.endToken
    });
  }

  return edges;
};

},{"../limit":32,"../whiteSpace":39,"rocambole-token":62}],13:[function(require,module,exports){
"use strict";

var _limit = require('../limit');
var _params = require('./Params');


exports.format = function FunctionDeclaration(node) {
  _limit.after(node.id.startToken, 'FunctionName');
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

},{"../limit":32,"./Params":19}],14:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');
var _params = require('./Params');
var _limit = require('../limit');


exports.format = function FunctionExpression(node) {
  _limit.around(node.body.startToken, 'FunctionExpressionOpeningBrace');
  _limit.around(node.endToken, 'FunctionExpressionClosingBrace');

  if (node.id) {
    _ws.limitAfter(node.id.startToken, 'FunctionName');
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

},{"../limit":32,"../whiteSpace":39,"./Params":19,"rocambole-token":62}],15:[function(require,module,exports){
"use strict";

var _br = require('../lineBreak');
var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');
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
    endToken: test.endToken,
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

},{"../limit":32,"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],16:[function(require,module,exports){
"use strict";

var _br = require('../lineBreak');
var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


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

},{"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],17:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


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


},{"../whiteSpace":39,"rocambole-token":62}],18:[function(require,module,exports){
"use strict";

var _br = require('../lineBreak');
var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');
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
    // we need to grab first/last "executable" token to avoid issues (see #191)
    var valueStart;
    if (prop.kind === 'get' || prop.kind === 'set') {
      valueStart = prop.value.startToken;
    } else {
      valueStart = _tk.findNextNonEmpty(_tk.findPrev(prop.value.startToken, ':'));
    }

    var eol = _tk.findNext(prop.value.endToken, ['LineBreak', ',', '}']);
    var valueEnd = _tk.findPrev(eol, function(token) {
      return !_tk.isEmpty(token) && !_tk.isComment(token);
    });

    // convert comma-first to comma-last
    var comma = _tk.findNext(prop.value.endToken, [',', '}']);
    if (_tk.isComma(comma)) {
      var br = _tk.findInBetween(prop.value.endToken, comma, _tk.isBr);
      if (br) {
        _tk.remove(br);
      }
      _tk.remove(comma);
      _tk.after(valueEnd, comma);
    }

    if (!shouldBeSingleLine) {
      _br.limitBefore(prop.key.startToken, 'PropertyName');
      _br.limitAfter(prop.key.endToken, 'PropertyName');
      _br.limitBefore(prop.value.startToken, 'PropertyValue');
      _br.limitAfter(prop.value.endToken, 'PropertyValue');
    } else if (prop.key.startToken.prev.value !== '{') {
      _ws.limitBefore(prop.key.startToken, 'Property');
    }

    if (prop.kind === 'get' || prop.kind === 'set') {
      _ws.limitBefore(prop.key.startToken, 1);
      _ws.limitAfter(prop.key.endToken, 0);
      return;
    }

    _ws.limitBefore(prop.key.startToken, 'PropertyName');
    _ws.limitAfter(prop.key.endToken, 'PropertyName');
    _ws.limitBefore(valueStart, 'PropertyValue');
    _ws.limitAfter(valueEnd, 'PropertyValue');
  });

  if (!shouldBeSingleLine) {
    _limit.around(node.endToken, 'ObjectExpressionClosingBrace');
  }
};


exports.getIndentEdges = function(node, opts) {
  function hasBr(start, end) {
    return _tk.findInBetween(start, end, _tk.isBr);
  }
  var edges = [{
    startToken: node.startToken,
    endToken: _tk.findInBetweenFromEnd(node.startToken, node.endToken, _tk.isBr)
  }];
  node.properties.forEach(function(property) {
    if (opts['ObjectExpression.' + property.value.type] &&
        hasBr(property.value.startToken, property.value.endToken)) {
        edges.push({
          startToken: property.value.startToken,
          endToken: property.value.endToken
        });
      }
  });
  return edges;
};

},{"../limit":32,"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],19:[function(require,module,exports){
"use strict";

// Important: Params is a "virtual" node type, not part of the AST spec.
// this hook is actually called by FunctionDeclaration and FunctionExpression
// hooks. It's mainly a way to share the common logic between both hooks.

var _ws = require('../whiteSpace');
var _tk = require('rocambole-token');
var _limit = require('../limit');


exports.format = function Params(node) {
  var params = node.params;
  if (params.length) {
    _ws.limitBefore(params[0].startToken, 'ParameterList');
    params.forEach(function(param, i) {
      // if only one param or last one there are no commas to look for
      if (i === params.length - 1) return;

      _ws.limit(_tk.findNext(param.startToken, ','), 'ParameterComma');
    });
    _ws.limitAfter(params[params.length - 1].endToken, 'ParameterList');
  } else {
    var openingParentheses = _tk.findNext(node.startToken, '(');
    _limit.after(openingParentheses, 0);
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
      startToken: _tk.findNext(start, '('),
      endToken: _tk.findPrev(node.body.startToken, ')'),
      level: opts.ParameterList
    };
  }
  return null;
};

},{"../limit":32,"../whiteSpace":39,"rocambole-token":62}],20:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');

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

},{"../whiteSpace":39,"./expressionParentheses":30,"rocambole-token":62}],21:[function(require,module,exports){
"use strict";

var _ws = require('../whiteSpace');


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

},{"../whiteSpace":39}],22:[function(require,module,exports){
"use strict";

var _ws = require('../whiteSpace');
var _br = require('../lineBreak');


exports.format = function SwitchCase(node) {
  if (node.test) {
    // we want case to always be on the same line!
    _br.limitBefore(node.test.startToken, 0);
    _ws.limitBefore(node.test.startToken, 1);
  }
};


exports.getIndentEdges = function(node) {
  return {
    startToken: node.startToken.next,
    endToken: node.endToken.next || node.endToken
  };
};

},{"../lineBreak":33,"../whiteSpace":39}],23:[function(require,module,exports){
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

},{"../limit":32,"rocambole-token":62}],24:[function(require,module,exports){
"use strict";

var _ws = require('../whiteSpace');


exports.format = function ThrowStatement(node) {
  _ws.limit(node.startToken, 'ThrowKeyword');
};

},{"../whiteSpace":39}],25:[function(require,module,exports){
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

},{"../limit":32,"rocambole-token":62}],26:[function(require,module,exports){
"use strict";

var _br = require('../lineBreak');
var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


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

},{"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],27:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');

exports.format = function UpdateExpression(node) {
  // XXX: should never have spaces or line breaks before/after "++" and "--"!
  _tk.removeEmptyInBetween(node.startToken, node.endToken);
};

},{"rocambole-token":62}],28:[function(require,module,exports){
"use strict";

var _br = require('../lineBreak');
var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');


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

  _ws.limitAfter(node.startToken, 1);
};


exports.getIndentEdges = function(node, opts) {
  var edges = [];

  if (opts.MultipleVariableDeclaration && node.declarations.length > 1) {
    edges.push({
      startToken: node.startToken.next,
      endToken: node.endToken
    });
  }

  node.declarations.forEach(function(declaration) {
    var init = declaration.init;
    if (init && opts['VariableDeclaration.' + init.type]) {
      edges.push({
        startToken: init.startToken,
        endToken: init.endToken.next || node.endToken.next || node.endToken
      });
    }
  });

  return edges;
};

},{"../lineBreak":33,"../whiteSpace":39,"rocambole-token":62}],29:[function(require,module,exports){
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
  return [
    {
      startToken: node.test.startToken,
      endToken: _tk.findPrev(node.body.startToken, ')')
    },
    node.body
  ];
};

},{"../limit":32,"rocambole-token":62}],30:[function(require,module,exports){
"use strict";

var _tk = require('rocambole-token');
var _ws = require('../whiteSpace');
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


},{"../whiteSpace":39,"debug":40,"rocambole-token":62}],31:[function(require,module,exports){
"use strict";

var rocambole = require('rocambole');
var escapeRegExp = require('mout/string/escapeRegExp');
var repeat = require('mout/string/repeat');
var tk = require('rocambole-token');
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
}


// transform AST in place
exports.transform = transform;
function transform(ast) {
  rocambole.moonwalk(ast, transformNode);
  sanitize(ast);
  return ast;
}


function transformNode(node) {
  var indentLevel = getIndentLevel(node);
  if (indentLevel > 0) {
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
      '[transformNode] type: %s, edges: %s, %s',
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
        indentInBetween(edge.startToken, edge.endToken, edge.level || indentLevel);
      });
    } else {
      indentInBetween(edges.startToken, edges.endToken, edges.level || indentLevel);
    }
  }
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


exports.indentInBetween = indentInBetween;
function indentInBetween(startToken, endToken, level) {
  level = level == null ? 1 : level;
  var token = getIndentStart(startToken);
  debug(
    '[indentInBetween] originalStart: %s, start: %s, end: %s, level: %s',
    startToken && startToken.value,
    token && token.value,
    endToken && endToken.value,
    level
  );

  if (level < 0 || !startToken || !token || !endToken) return;

  var next;
  while (token && token !== endToken) {
    next = token.next;
    if (tk.isBr(token.prev)) {
      if (tk.isWs(token)) {
        tk.remove(token);
      } else if (!tk.isBr(token)) {
        indentBefore(token, level);
      }
    }
    token = next;
  }
}


function getIndentStart(token) {
  var val = token.value;
  return (
    val === '{' ||
    val === '(' ||
    val === '['
  ) ? token.next : token;
}


exports.indentBefore = indentBefore;
function indentBefore(token, level) {
  var value = repeat(_opts.value, level);

  if (tk.isIndent(token)) {
    token.value += value;
    token.level += level;
  } else if (tk.isWs(token)) {
    token.type = 'Indent';
    token.value = value;
    token.level = level;
  } else {
    tk.before(token, {
      type: 'Indent',
      value: value,
      level: level
    });
  }
}


exports.sanitize = sanitize;
function sanitize(ast) {
  var token = ast.startToken;
  while (token) {
    var next = token.next;
    if (isOriginalIndent(token)) {
      tk.remove(token);
    } else if (token.type === 'BlockComment') {
      updateBlockComment(token);
    }
    token = next;
  }
}


function isOriginalIndent(token) {
  // original indent don't have a "indentLevel" value
  // we also need to remove any indent that happens after a token that
  // isn't a line break (just in case
  return (token.type === 'WhiteSpace' && (!token.prev || tk.isBr(token.prev)) && !tk.isBr(token.next)) ||
    (token.type === 'Indent' && (token.level == null || !tk.isBr(token.prev)));
}


function updateBlockComment(comment) {
  var orig = new RegExp('([\\n\\r]+)' + escapeRegExp(comment.originalIndent || ''), 'gm');
  var update = comment.prev && comment.prev.type === 'Indent'? comment.prev.value : '';
  comment.raw = comment.raw.replace(orig, '$1' + update);
}


},{"./hooks":3,"debug":40,"mout/string/escapeRegExp":59,"mout/string/repeat":60,"rocambole":68,"rocambole-token":62}],32:[function(require,module,exports){
'use strict';

// limit amount of consecutive white spaces and line breaks adjacent to a given
// token.

var _br = require('./lineBreak');
var _ws = require('./whiteSpace');


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

},{"./lineBreak":33,"./whiteSpace":39}],33:[function(require,module,exports){
"use strict";


// Line break helpers

var _tk = require('rocambole-token');
var debug = require('debug');
var debugBefore = debug('esformatter:br:before');
var debugAfter = debug('esformatter:br:after');
var debugBetween = debug('esformatter:br:between');

// yeah, we use semver to parse integers. it's lame but works and will give
// more flexibility while still keeping a format that is easy to read
var semver = require('semver');

var _curOpts = {
  // fallback in case plugin author forgets to call setOptions
  value: '\n'
};


// ---


exports.setOptions = setOptions;
function setOptions(opts) {
  _curOpts = opts;
}


exports.limit = limit;
function limit(token, type) {
  limitBefore(token, type);
  limitAfter(token, type);
}


exports.limitBefore = limitBefore;
function limitBefore(token, type) {
  var expected = getExpect('before', type);
  debugBefore(
    '[limitBefore] type: %s, expected: %s, value: %s',
    type, expected, token && token.value
  );
  if (expected < 0) return; // noop
  var start = getStartToken(token);
  limitInBetween('before', start, token, expected);
}


exports.limitAfter = limitAfter;
function limitAfter(token, type) {
  var expected = getExpect('after', type);
  debugAfter(
    '[limitAfter] type: %s, expected: %s, value: %s',
    type, expected, token && token.value
  );
  if (expected < 0) return; // noop
  var end = getEndToken(token);
  limitInBetween('after', token, end, expected);
}


function getExpect(location, type) {
  var expected;

  // we allow expected value (number) as 2nd argument or the node type (string)
  if (typeof type === 'string') {
    expected = _curOpts[location][type];
  } else {
    expected = type;
  }

  // default is noop, explicit is better than implicit
  expected = expected != null? expected : -1;

  if (typeof expected === 'boolean') {
    // if user sets booleans by mistake we simply add one if missing (true)
    // or remove all if false
    expected = expected? '>=1' : 0;
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
  debugBetween('[limitInBetween] diff: %d', n);
  if (n) {
    _tk.removeInBetween(start, end, 'WhiteSpace');
  }
  if (n < 0) {
    _tk.removeInBetween(start, end, function(token){
      return token.type === 'LineBreak' && n++ < 0 &&
        !siblingIsComment(location, token);
    });
  } else if(n > 0) {
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
  var vCount = String(count) +'.0.0';
  if (semver.satisfies(vCount, expected)) {
    return 0;
  } else {
    return getSatisfyingMatch(count, vCount, expected) - count;
  }
}


function getSatisfyingMatch(count, vCount, expected) {
  var result;
  var diff = semver.gtr(vCount, expected)? -1 : 1;
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
  _tk.eachInBetween(start, end, function(token){
    if (_tk.isBr(token)) count++;
  });
  return count;
}


function getEndToken(token) {
  var end = _tk.findNextNonEmpty(token);
  if (shouldSkipToken(end)) {
    end = _tk.findNextNonEmpty(end);
  }
  return end? end : token.root.endToken;
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
  return end? end : token.root.startToken;
}


exports.limitBeforeEndOfFile = function(ast) {
  var expected = getExpect('before', 'EndOfFile');

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

},{"debug":40,"rocambole-token":62,"semver":69}],34:[function(require,module,exports){
'use strict';

// this module is used for automatic line break around nodes.


var _tk = require('rocambole-token');
var _br = require('./lineBreak');
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


},{"./lineBreak":33,"debug":40,"rocambole-token":62}],35:[function(require,module,exports){
(function (process){
"use strict";

var stripJsonComments = require('strip-json-comments');
var fs = require('fs');
var path = require('path');

var _ws = require('./whiteSpace');
var _br = require('./lineBreak');
var indent = require('./indent');
var plugins = require('./plugins');

var merge = require('mout/object/merge');
var get = require('mout/object/get');
var isObject = require('mout/lang/isObject');


// ---

var _curOpts;

// ---

exports.presets = {
  'default': require('./preset/default.json'),
  'jquery' : require('./preset/jquery.json')
};


exports.set = function(opts) {
  var preset = opts && opts.preset ? opts.preset : 'default';
  _curOpts = mergeOptions(preset, opts);

  _ws.setOptions(_curOpts.whiteSpace);
  _br.setOptions(_curOpts.lineBreak);
  indent.setOptions(_curOpts.indent);
  plugins.setOptions(_curOpts);
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
  var home = process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME;
  var file = path.join(home, '.esformatter');
  return fs.existsSync(file) ? loadAndParseConfig(file) : {};
}


exports.loadAndParseConfig = loadAndParseConfig;
function loadAndParseConfig(file) {
  try {
    return JSON.parse(stripJsonComments(fs.readFileSync(file).toString()));
  } catch (ex) {
    console.error('Can\'t parse configuration file: "' + file + '"\nException: ' + ex.message);
    process.exit(1);
  }
}



}).call(this,require('_process'))
},{"./indent":31,"./lineBreak":33,"./plugins":36,"./preset/default.json":37,"./preset/jquery.json":38,"./whiteSpace":39,"_process":2,"fs":undefined,"mout/lang/isObject":48,"mout/object/get":56,"mout/object/merge":"mout/object/merge","path":1,"strip-json-comments":70}],36:[function(require,module,exports){
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
    register(require(id));
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
  _plugins.forEach(function(plugin){
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

},{"mout/array/remove":42,"mout/function/partial":44}],37:[function(require,module,exports){
module.exports={
  "indent" : {
    "value": "  ",
    "ArrayExpression": 1,
    "AssignmentExpression": 1,
    "AssignmentExpression.BinaryExpression": 1,
    "AssignmentExpression.LogicalExpression": 1,
    "BinaryExpression": -1,
    "CallExpression": 1,
    "CallExpression.BinaryExpression": 1,
    "CallExpression.LogicalExpression": 1,
    "CatchClause": 1,
    "ConditionalExpression": 1,
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
    "ParameterList": 1,
    "ReturnStatement": 1,
    "SwitchCase": 1,
    "SwitchStatement": 1,
    "TopLevelFunctionBlock": 1,
    "TryStatement": 1,
    "VariableDeclaration.BinaryExpression": 1,
    "VariableDeclaration.LogicalExpression": 1,
    "WhileStatement": 1
  },


  "lineBreak" : {
    "value" : "\n",

    "before" : {
      "AssignmentExpression" : ">=1",
      "AssignmentOperator": 0,
      "BlockStatement" : 0,
      "CallExpression" : -1,
      "CallExpressionOpeningParentheses" : 0,
      "CallExpressionClosingParentheses" : -1,
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
      "ObjectExpressionClosingBrace" : ">=1",
      "Property" : ">=1",
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
      "BlockStatement" : 0,
      "CallExpression" : -1,
      "CallExpressionOpeningParentheses" : -1,
      "CallExpressionClosingParentheses" : -1,
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
      "ObjectExpressionOpeningBrace" : ">=1",
      "Property" : 0,
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
      "IIFEClosingParentheses" : 0,
      "IfStatementConditionalOpening" : 1,
      "IfStatementConditionalClosing" : 0,
      "IfStatementOpeningBrace" : 1,
      "IfStatementClosingBrace" : 1,
      "ElseStatementOpeningBrace" : 1,
      "ElseStatementClosingBrace" : 1,
      "ElseIfStatementOpeningBrace" : 1,
      "ElseIfStatementClosingBrace" : 1,
      "MemberExpressionClosing" : 0,
      "LineComment" : 1,
      "LogicalExpressionOperator" : 1,
      "Property" : 1,
      "PropertyValue" : 1,
      "ParameterComma" : 0,
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
      "ObjectExpressionClosingBrace": 0,
      "PropertyName" : 0,
      "PropertyValue" : 0,
      "ParameterComma" : 1,
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

},{}],38:[function(require,module,exports){
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
      "ParameterList" : 1,
      "PropertyValue": -1,
      "SwitchDiscriminantOpening" : 1,
      "WhileStatementConditionalOpening" : 1
    }
  }
}

},{}],39:[function(require,module,exports){
"use strict";

// white space helpers

var _tk = require('rocambole-token');
var repeat = require('mout/string/repeat');
var debug = require('debug');
var debugBefore = debug('esformatter:ws:before');
var debugAfter = debug('esformatter:ws:after');

var _curOpts = {
  // fallback in case plugin author forgets to call setOptions
  value: ' '
};


// ---


exports.setOptions = setOptions;
function setOptions(opts) {
  _curOpts = opts;
}


// --


exports.limit = limit;
function limit(token, type) {
  // limit on whiteSpaces does not support ranges since ranges are kinda dumb
  // in this context..
  limitBefore(token, type);
  limitAfter(token, type);
}


exports.limitBefore = limitBefore;
function limitBefore(token, type) {
  var amount = getAmountBeforeType(type);
  debugBefore(
    '[limitBefore] type: %s, amount: %s, token: %s',
    type, amount, token.value
  );
  if (amount < 0) return; // noop
  update('before', token, amount);
}


exports.limitAfter = limitAfter;
function limitAfter(token, type) {
  var amount = getAmountAfterType(type);
  debugAfter(
    '[limitAfter] type: %s, amount: %s, token: %s',
    type, amount, token.value
  );
  if (amount < 0) return; // noop
  update('after', token, amount);
}


exports.getAmountAfterType = getAmountAfterType;
function getAmountAfterType(type) {
  return getAmount('after', type);
}


exports.getAmountBeforeType = getAmountBeforeType;
function getAmountBeforeType(type) {
  return getAmount('before', type);
}


function getAmount(position, type) {
  if (typeof type === 'number') {
    return type;
  }
  var amount = _curOpts[position][type];
  return amount == null? -1 : amount;
}


function update(position, target, amount) {
  var adjacent = position === 'before'? target.prev : target.next;
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

  if (! adjacentIsWs) {
    _tk[position](target, ws);
  }
}

},{"debug":40,"mout/string/repeat":60,"rocambole-token":62}],40:[function(require,module,exports){

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

},{}],41:[function(require,module,exports){


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


},{}],42:[function(require,module,exports){
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


},{"./indexOf":41}],43:[function(require,module,exports){


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



},{}],44:[function(require,module,exports){
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



},{"../array/slice":43}],45:[function(require,module,exports){
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



},{"../object/mixIn":58,"./isPlainObject":49,"./kindOf":51}],46:[function(require,module,exports){
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




},{"../object/forOwn":55,"./clone":45,"./isPlainObject":49,"./kindOf":51}],47:[function(require,module,exports){
var kindOf = require('./kindOf');
    /**
     * Check if value is from a specific "kind".
     */
    function isKind(val, kind){
        return kindOf(val) === kind;
    }
    module.exports = isKind;


},{"./kindOf":51}],48:[function(require,module,exports){
var isKind = require('./isKind');
    /**
     */
    function isObject(val) {
        return isKind(val, 'Object');
    }
    module.exports = isObject;


},{"./isKind":47}],49:[function(require,module,exports){


    /**
     * Checks if the value is created by the `Object` constructor.
     */
    function isPlainObject(value) {
        return (!!value && typeof value === 'object' &&
            value.constructor === Object);
    }

    module.exports = isPlainObject;



},{}],50:[function(require,module,exports){


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



},{}],51:[function(require,module,exports){


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


},{}],52:[function(require,module,exports){


    /**
     * Typecast a value to a String, using an empty string value for null or
     * undefined.
     */
    function toString(val){
        return val == null ? '' : val.toString();
    }

    module.exports = toString;



},{}],53:[function(require,module,exports){


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



},{}],54:[function(require,module,exports){
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



},{"./hasOwn":57}],55:[function(require,module,exports){
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



},{"./forIn":54,"./hasOwn":57}],56:[function(require,module,exports){
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



},{"../lang/isPrimitive":50}],57:[function(require,module,exports){


    /**
     * Safer Object.hasOwnProperty
     */
     function hasOwn(obj, prop){
         return Object.prototype.hasOwnProperty.call(obj, prop);
     }

     module.exports = hasOwn;



},{}],58:[function(require,module,exports){
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


},{"./forOwn":55}],59:[function(require,module,exports){
var toString = require('../lang/toString');

    /**
     * Escape RegExp string chars.
     */
    function escapeRegExp(str) {
        return toString(str).replace(/\W/g,'\\$&');
    }

    module.exports = escapeRegExp;



},{"../lang/toString":52}],60:[function(require,module,exports){
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



},{"../lang/toString":52,"../number/toInt":53}],61:[function(require,module,exports){
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


},{"./is":64,"./makeCheck":65}],62:[function(require,module,exports){
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


},{"./find":61,"./insert":63,"./is":64,"./remove":66}],63:[function(require,module,exports){
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


},{}],64:[function(require,module,exports){
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


},{}],65:[function(require,module,exports){
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

},{}],66:[function(require,module,exports){
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


},{"./is":64,"./makeCheck":65}],67:[function(require,module,exports){
/*
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
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9
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
        ArrayExpression: 'ArrayExpression',
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
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
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
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
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
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
        NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
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


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }

    // 7.6.1.2 Future Reserved Words

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

    // 11.6.2.2 Future Reserved Words

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

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

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

    // 7.4 Comments

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

        if (extra.errors && index >= length) {
            //ran off the end of the file - the whole thing is a comment
            if (extra.comments) {
                loc.end = {
                    line: lineNumber,
                    column: index - lineStart
                };
                comment = source.slice(start + 2, index);
                addComment('Block', comment, start, index, loc);
            }
            tolerateUnexpectedToken();
        } else {
            throwUnexpectedToken();
        }
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
        var ch, code, cu1, cu2;

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

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (ch === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            ch = scanHexEscape('u');
            if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwUnexpectedToken();
            }
            id = ch;
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isIdentifierPart(ch)) {
                break;
            }
            ++index;
            id += String.fromCharCode(ch);

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (ch === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                    throwUnexpectedToken();
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
        id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

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


    // 7.7 Punctuators

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

        case ')':
        case ';':
        case ',':
        case '}':
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

    // 7.8.3 Numeric Literals

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

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false;

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
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                str += unescaped;
                            } else {
                                index = restore;
                                str += ch;
                            }
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

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

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
                            str += String.fromCharCode(code);
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

    function testRegExp(pattern, flags) {
        var tmp = pattern;

        if (flags.indexOf('u') >= 0) {
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
                        return 'x';
                    }
                    throwUnexpectedToken(null, Messages.InvalidRegExp);
                })
                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
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
        scanning = true;
        var start, body, flags, value;

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
        var ch;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        ch = source.charCodeAt(index);

        if (isIdentifierStart(ch)) {
            return scanIdentifier();
        }

        // Very common: ( and ) and ;
        if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (ch === 0x27 || ch === 0x22) {
            return scanStringLiteral();
        }


        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (ch === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && ch === 0x2F) {
            return advanceSlash();
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
            if (last) {
                while (last && last.range[0] >= this.range[0]) {
                    lastChild = last;
                    last = bottomRight.pop();
                }
            }

            if (lastChild) {
                if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= this.range[0]) {
                    this.leadingComments = lastChild.leadingComments;
                    lastChild.leadingComments = undefined;
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

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
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

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body) {
            this.type = Syntax.Program;
            this.body = body;
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

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
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
            this.handlers = handler ? [ handler ] : [];
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

    function createError(line, pos, description) {
        var error = new Error('Line ' + line + ': ' + description);
        error.index = pos;
        error.lineNumber = line;
        error.column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error.description = description;
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
        var msg = message || Messages.UnexpectedToken;

        if (token && !message) {
            msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                Messages.UnexpectedToken;

            if (token.type === Token.Keyword) {
                if (isFutureReservedWord(token.value)) {
                    msg = Messages.UnexpectedReserved;
                } else if (strict && isStrictModeReservedWord(token.value)) {
                    msg = Messages.StrictReservedWord;
                }
            }
        }

        msg = msg.replace('%0', token ? token.value : 'ILLEGAL');

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

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [], node = new Node();

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                elements.push(parseAssignmentExpression());

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(node, paramInfo) {
        var previousStrict, body;

        previousStrict = strict;
        body = parseFunctionSourceElements();

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node();

        params = parseParams();
        method = parsePropertyFunction(node, params);

        return method;
    }

    // This function returns a tuple `[PropertyName, boolean]` where the PropertyName is the key being consumed and the second
    // element indicate whether its a computed PropertyName or a static PropertyName.
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
                expr = parseAssignmentExpression();
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
        var value, options, methodNode;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                });
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
                    parseParam(options);
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                value = parsePropertyFunction(methodNode, options);
                return node.finishProperty('set', key, computed, value, false, false);
            }
        }

        if (match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function checkProto(key, computed, hasProto) {
        if (computed === false && (key.type === Syntax.Identifier && key.name === '__proto__' ||
            key.type === Syntax.Literal && key.value === '__proto__')) {
            if (hasProto.value) {
                tolerateError(Messages.DuplicateProtoProperty);
            } else {
                hasProto.value = true;
            }
        }
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, value;

        computed = match('[');
        key = parseObjectPropertyKey();
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);

        if (maybeMethod) {
            checkProto(maybeMethod.key, maybeMethod.computed, hasProto);
            // finished
            return maybeMethod;
        }

        // init property or short hand property.
        checkProto(key, computed, hasProto);

        if (match(':')) {
            lex();
            value = parseAssignmentExpression();
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitialiser() {
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

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, isValidArrowParameter = true;

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement();
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        if (match('(')) {
            isValidArrowParameter = false;
        }

        expr = parseAssignmentExpression();

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isValidArrowParameter) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement());
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                } else if (match('(')) {
                    isValidArrowParameter = false;
                }

                expressions.push(parseAssignmentExpression());
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>') && !isValidArrowParameter) {
            throwUnexpectedToken(lookahead);
        }

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
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
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                args.push(parseAssignmentExpression());
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

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');
        callee = parseLeftHandSideExpression();
        args = match('(') ? parseArguments() : [];

        return node.finishNewExpression(callee, args);
    }

    function parseLeftHandSideExpressionAllowCall() {
        var expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        for (;;) {
            if (match('.')) {
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    function parseLeftHandSideExpression() {
        var expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        for (;;) {
            if (match('[')) {
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else {
                break;
            }
        }
        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = parseLeftHandSideExpressionAllowCall();

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isLeftHandSide(expr)) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
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

    // 11.5 Multiplicative Operators
    // 11.6 Additive Operators
    // 11.7 Bitwise Shift Operators
    // 11.8 Relational Operators
    // 11.9 Equality Operators
    // 11.10 Binary Bitwise Operators
    // 11.11 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = parseUnaryExpression();

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = parseUnaryExpression();

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
            expr = parseUnaryExpression();
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


    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = parseBinaryExpression();
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = parseAssignmentExpression();

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
        }

        return expr;
    }

    // [ES6] 14.2 Arrow Function

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return parseAssignmentExpression();
    }

    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.AssignmentExpression:
            break;
        case Syntax.SequenceExpression:
            params = expr.expressions;
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
            if (param.type === Syntax.Identifier) {
                params[i] = param;
                defaults.push(null);
                validateParam(options, param, param.name);
            } else if (param.type === Syntax.RestElement) {
                params[i] = param;
                defaults.push(null);
                validateParam(options, param.argument, param.argument.name);
            } else if (param.type === Syntax.AssignmentExpression) {
                params[i] = param.left;
                defaults.push(param.right);
                ++defaultCount;
                validateParam(options, param.left, param.left.name);
            } else {
                return null;
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
        var previousStrict, body;

        expect('=>');
        previousStrict = strict;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }
        }

        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(expr)) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // 11.13.1
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
            }

            token = lex();
            right = parseAssignmentExpression();
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
        }

        return expr;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = parseAssignmentExpression();

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(parseAssignmentExpression());
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // 12.1 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'const':
            case 'let':
                return parseLexicalDeclaration();
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

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token, node = new Node();

        token = lex();

        if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                throwUnexpectedToken(token);
            }
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration() {
        var init = null, id, node = new Node();

        id = parseVariableIdentifier();

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList() {
        var list = [];

        do {
            list.push(parseVariableDeclaration());
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

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    function parseLexicalBinding(kind) {
        var init = null, id, node = new Node();

        id = parseVariableIdentifier();

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in')) {
                expect('=');
                init = parseAssignmentExpression();
            }
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind) {
        var list = [];

        do {
            list.push(parseLexicalBinding(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseLexicalDeclaration() {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement() {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // 12.3 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // 12.5 If statement

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

    // 12.6 Iteration Statements

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
        var init, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                init = init.finishVariableDeclaration(parseVariableDeclarationList());
                state.allowIn = previousAllowIn;

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else {
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                state.allowIn = false;
                declarations = parseBindingList(kind);
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else {
                    consumeSemicolon();
                    init = init.finishLexicalDeclaration(declarations, kind);
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else {
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

        body = parseStatement();

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                node.finishForInStatement(left, right, body);
    }

    // 12.7 The continue statement

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

    // 12.8 The break statement

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

    // 12.9 The return statement

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

    // 12.10 The with statement

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

    // 12.10 The swith statement

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

    // 12.13 The throw statement

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

    // 12.14 The try statement

    function parseCatchClause() {
        var param, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parseVariableIdentifier();
        // 12.14.1
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

    // 12.15 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 12 Statements

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

        // 12.12 Labelled Statements
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

    // 13 Function Definition

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
                options.firstRestricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement();
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parseVariableIdentifier();
        validateParam(options, token, token.value);

        if (match('=')) {
            lex();
            def = parseAssignmentExpression();
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

    function parseFunctionDeclaration(node) {
        var id, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict;

        expectKeyword('function');
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

        return node.finishFunctionDeclaration(id, params, defaults, body);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node();

        expectKeyword('function');

        if (!match('(')) {
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

        return node.finishFunctionExpression(id, params, defaults, body);
    }


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
                key = parseObjectPropertyKey();
                if (key.name === 'static' && lookaheadPropertyName()) {
                    token = lookahead;
                    isStatic = true;
                    computed = match('[');
                    key = parseObjectPropertyKey();
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method.static = isStatic;
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

    function parseClassDeclaration() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        id = parseVariableIdentifier();

        if (matchKeyword('extends')) {
            lex();
            superClass = parseLeftHandSideExpressionAllowCall();
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
            superClass = parseLeftHandSideExpressionAllowCall();
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // 14 Program

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
        strict = false;

        body = parseScriptBody();
        return node.finishProgram(body);
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
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
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
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };

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
    exports.version = '2.1.0';

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

},{}],68:[function(require,module,exports){
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

    // esprima@2.1 introduces a "handler" property on TryStatement, so we would
    // loop the same node twice (see jquery/esprima/issues/1031 and #264)`
    handler : true,

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


// parse string and return an augmented AST
exports.parse = function parse(source, opts){
    _addLocInfo = opts && opts.loc;
    source = source.toString();

    var ast = esprima.parse(source, {
        loc : _addLocInfo,
        range : true,
        tokens : true,
        comment : true
    });

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


},{"esprima":67}],69:[function(require,module,exports){
;(function(exports) {

// export the class if we are in a Node-like system.
if (typeof module === 'object' && module.exports === exports)
  exports = module.exports = SemVer;

// The debug function is excluded entirely from the minified version.

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

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
                   '(?:(' + src[PRERELEASE] + ')' +
                   ')?)?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:(' + src[PRERELEASELOOSE] + ')' +
                        ')?)?)?';

// >=2.x, for example, means >=2.0.0-0
// <1.x would be the same as "<1.0.0-0", though.
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
  var r = loose ? re[LOOSE] : re[FULL];
  return (r.test(version)) ? new SemVer(version, loose) : null;
}

exports.valid = valid;
function valid(version, loose) {
  var v = parse(version, loose);
  return v ? v.version : null;
}


exports.clean = clean;
function clean(version, loose) {
  var s = parse(version, loose);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, loose) {
  if (version instanceof SemVer) {
    if (version.loose === loose)
      return version;
    else
      version = version.version;
  }

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

  // numberify any prerelease numeric ids
  if (!m[4])
    this.prerelease = [];
  else
    this.prerelease = m[4].split('.').map(function(id) {
      return (/^[0-9]+$/.test(id)) ? +id : id;
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
  else if (!this.prerelease.lenth && !other.prerelease.length)
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

SemVer.prototype.inc = function(release) {
  switch (release) {
    case 'major':
      this.major++;
      this.minor = -1;
    case 'minor':
      this.minor++;
      this.patch = -1;
    case 'patch':
      this.patch++;
      this.prerelease = [];
      break;
    case 'prerelease':
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
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  return this;
};

exports.inc = inc;
function inc(version, release, loose) {
  try {
    return new SemVer(version, loose).inc(release).version;
  } catch (er) {
    return null;
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
    case '===': ret = a === b; break;
    case '!==': ret = a !== b; break;
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
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    throw new TypeError('Invalid comparator: ' + comp);

  this.operator = m[1];
  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    this.semver = ANY;
  else {
    this.semver = new SemVer(m[2], this.loose);

    // <1.2.3-rc DOES allow 1.2.3-beta (has prerelease)
    // >=1.2.3 DOES NOT allow 1.2.3-beta
    // <=1.2.3 DOES allow 1.2.3-beta
    // However, <1.2.3 does NOT allow 1.2.3-beta,
    // even though `1.2.3-beta < 1.2.3`
    // The assumption is that the 1.2.3 version has something you
    // *don't* want, so we push the prerelease down to the minimum.
    if (this.operator === '<' && !this.semver.prerelease.length) {
      this.semver.prerelease = ['0'];
      this.semver.format();
    }
  }
};

Comparator.prototype.inspect = function() {
  return '<SemVer Comparator "' + this + '">';
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  ;
  return (this.semver === ANY) ? true :
         cmp(version, this.operator, this.semver, this.loose);
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
      ret = '>=' + M + '.0.0-0 <' + (+M + 1) + '.0.0-0';
    else if (isX(p))
      // ~1.2 == >=1.2.0- <1.3.0-
      ret = '>=' + M + '.' + m + '.0-0 <' + M + '.' + (+m + 1) + '.0-0';
    else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0-0';
    } else
      // ~1.2.3 == >=1.2.3-0 <1.3.0-0
      ret = '>=' + M + '.' + m + '.' + p + '-0' +
            ' <' + M + '.' + (+m + 1) + '.0-0';

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
  var r = loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0-0 <' + (+M + 1) + '.0.0-0';
    else if (isX(p)) {
      if (M === '0')
        ret = '>=' + M + '.' + m + '.0-0 <' + M + '.' + (+m + 1) + '.0-0';
      else
        ret = '>=' + M + '.' + m + '.0-0 <' + (+M + 1) + '.0.0-0';
    } else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      if (M === '0') {
        if (m === '0')
          ret = '=' + M + '.' + m + '.' + p + pr;
        else
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0-0';
      } else
        ret = '>=' + M + '.' + m + '.' + p + pr +
              ' <' + (+M + 1) + '.0.0-0';
    } else {
      if (M === '0') {
        if (m === '0')
          ret = '=' + M + '.' + m + '.' + p;
        else
          ret = '>=' + M + '.' + m + '.' + p + '-0' +
                ' <' + M + '.' + (+m + 1) + '.0-0';
      } else
        ret = '>=' + M + '.' + m + '.' + p + '-0' +
              ' <' + (+M + 1) + '.0.0-0';
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

    if (gtlt && anyX) {
      // replace X with 0, and then append the -0 min-prerelease
      if (xM)
        M = 0;
      if (xm)
        m = 0;
      if (xp)
        p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0-0
        // >1.2 => >=1.3.0-0
        // >1.2.3 => >= 1.2.4-0
        gtlt = '>=';
        if (xM) {
          // no change
        } else if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      }


      ret = gtlt + M + '.' + m + '.' + p + '-0';
    } else if (xM) {
      // allow any
      ret = '*';
    } else if (xm) {
      // append '-0' onto the version, otherwise
      // '1.x.x' matches '2.0.0-beta', since the tag
      // *lowers* the version value
      ret = '>=' + M + '.0.0-0 <' + (+M + 1) + '.0.0-0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0-0 <' + M + '.' + (+m + 1) + '.0-0';
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
// 1.2 - 3.4.5 => >=1.2.0-0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0-0 <3.5.0-0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0-0 <3.5.0-0
function hyphenReplace($0,
                       from, fM, fm, fp, fpr, fb,
                       to, tM, tm, tp, tpr, tb) {

  if (isX(fM))
    from = '';
  else if (isX(fm))
    from = '>=' + fM + '.0.0-0';
  else if (isX(fp))
    from = '>=' + fM + '.' + fm + '.0-0';
  else
    from = '>=' + from;

  if (isX(tM))
    to = '';
  else if (isX(tm))
    to = '<' + (+tM + 1) + '.0.0-0';
  else if (isX(tp))
    to = '<' + tM + '.' + (+tm + 1) + '.0-0';
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

},{}],70:[function(require,module,exports){
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

},{}],"formatter":[function(require,module,exports){
'use strict';


// non-destructive changes to EcmaScript code using an "enhanced" AST for the
// process, it updates the tokens in place and add/remove spaces & line breaks
// based on user settings.
// not using any kind of code rewrite based on string concatenation to avoid
// breaking the program correctness and/or undesired side-effects.


var _br = require('./lineBreak');
var _options = require('./options');
var _tk = require('rocambole-token');
var _ws = require('./whiteSpace');
var addBrAroundNode = require('./lineBreakAroundNode');
var expressionParentheses = require('./hooks/expressionParentheses');
var hooks = require('./hooks');
var indent = require('./indent');
var plugins = require('./plugins');
var rocambole = require('rocambole');

// esprima@2.1 introduces a "handler" property on TryStatement, so we would
// loop the same node twice (see jquery/esprima/issues/1031 and #264)
rocambole.BYPASS_RECURSION.handler = true;

// ---


var _shouldRemoveTrailingWs;


// ---


exports.hooks = hooks;
exports.format = format;
exports.transform = transform;
exports.rc = _options.getRc;
exports.register = plugins.register;
exports.unregister = plugins.unregister;
exports.unregisterAll = plugins.unregisterAll;


// ---


function format(str, opts) {
  // we need to load and register the plugins as soon as possible otherwise
  // `stringBefore` won't be called.
  plugins.loadAndRegister(opts && opts.plugins);
  str = plugins.stringBefore(str);
  var ast = rocambole.parse(str);
  transform(ast, opts);
  str = ast.toString();
  return plugins.stringAfter(str);
}


function transform(ast, opts) {
  _options.set(opts);
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
  }
}


function removeTrailingWs(token) {
  if (_tk.isBr(token.next) || !token.next) {
    _tk.remove(token);
  }
}

},{"./hooks":3,"./hooks/expressionParentheses":30,"./indent":31,"./lineBreak":33,"./lineBreakAroundNode":34,"./options":35,"./plugins":36,"./whiteSpace":39,"rocambole":68,"rocambole-token":62}],"mout/object/merge":[function(require,module,exports){
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



},{"../lang/deepClone":46,"../lang/isObject":48,"./hasOwn":57}]},{},[]);
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
  var options = JSON.parse(process.argv[2] || "{}");
  if (esformatter.rc) {
    options = merge(options, esformatter.rc());
  }

  process.stdin.on('data', function(chunk) {
    buf += chunk;
  });

  process.stdin.on('end', function() {
    try {
      var result = esformatter.format(buf, options);
      process.stdout.write(result);
      setTimeout(function() {
        // When opening many threads, the buffer might be slow and send back
        // an empty string. Wait a little bit for the drain
        process.exit(0);
      }, 15);
    } catch (ex) {
      throw "__EX-MESSAGE>_Unable to format_<EX-MESSAGE__";
    }
  });

  process.stdin.resume();
})();
//based on esformatter 0.5.1