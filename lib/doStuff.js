#!/usr/bin/env node
var fs = require("fs");
var browserify = require("browserify");

var cli = fs.readFileSync("./command_line.js");

var b = browserify({
	basedir: "./node_modules/esformatter"
});
b.require("./lib/esformatter.js", {
	expose: "formatter"
});
b.bundle(function (err, src) {
	fs.writeFileSync("esformatter.js", "#!/usr/bin/env node\n" + src + cli);
});