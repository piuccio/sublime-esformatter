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