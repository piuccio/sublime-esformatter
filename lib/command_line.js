;(function () {
var buf = '';
var esformatter = require('formatter');
var options = JSON.parse(process.argv[2] || "{}");


process.stdin.on('data', function(chunk) {
    buf += chunk;
});

process.stdin.on('end', function() {
    var result = esformatter.format(buf, options);
    process.stdout.write(result);
    process.exit(0);
});

process.stdin.resume();
})();