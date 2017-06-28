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
var dataBase64 = require("./transform-img").dataBase64;

function transDataUri(filePath, lessPath) {
    var content = fs.readFileSync(lessPath).toString()
    var reg = /data-uri\((['"])(.+)\1\)/g
    var re = /data-uri\((['"])(.+)\1\)/

    if (!content.match(reg)) {
        return;
    }
    content = content.replace(reg, function(str) {
        var relPath = str.match(re)[2]
        if (!relPath.startsWith(".")) {
            return str;
        }
        var absPath = P.resolve(P.dirname(filePath), relPath)
        if (!fs.existsSync(absPath)) {
            console.error(new Error("Data-Uri Not Exists: " + absPath).stack)
            return str;
        }
        console.log(`[Less] data-uri: ${absPath}`)
        // absPath = absPath.replace(/\\/g, "/")
        var base64 = dataBase64(absPath)
        return `url(${base64})`
        // str = str.replace(relPath, absPath)
        // return str
    })
    fs.writeFileSync(lessPath, content)
}

function TransformLess(outputPath) {
    if (arguments.length != 1) {
        throw Error("Need [outputPath] Args")
    }
    var lines = [];
    this.transform = function(file, node) {
        var path = getNodeValue(node);
        var abs = P.resolve(P.dirname(file), path);
        transDataUri(file, abs);
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
