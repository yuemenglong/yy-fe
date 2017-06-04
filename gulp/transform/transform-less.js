var stream = require("stream");
var util = require("util");
var P = require("path");
var less = require("less");
var fs = require("yy-fs");

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var through = require("through2");
var stream = require("stream");
var getNodeValue = require("./common").getNodeValue;
var clearNode = require("./common").clearNode;

function TransformLess(outputPath) {
    if (arguments.length != 1) {
        throw Error("Need [outputPath] Args")
    }
    var lines = [];
    this.transform = function(file, node) {
        var path = getNodeValue(node);
        var abs = P.resolve(P.dirname(file), path);
        var line = `@import '${abs.replace("\\", "\\\\")}';`;
        console.log(`[Less]: ${line}`);
        // that.push(line + "\n");
        lines.push(line);
        clearNode(node);
    }
    this.output = function() {
        var src = lines.join("\n");
        less.render(src, function(err, output) {
            if (err) {
                console.log(err)
                throw err
            }
            fs.mkdirSync(P.dirname(outputPath))
            fs.writeFileSync(outputPath, output.css)
            console.log(`[Less] Output => ${outputPath}`)
        })
    }
}

module.exports = TransformLess;
