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