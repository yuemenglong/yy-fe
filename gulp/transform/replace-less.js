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

function replaceLess(dirname, file, content) {
    if (arguments.length != 3) {
        throw Error("Need [dirname, file, content] Args")
    }
    var reg = /data-uri\((['"])(.+)\1\)/g
    var re = /data-uri\((['"])(.+)\1\)/

    if (!content.match(reg)) {
        return content;
    }
    content = content.replace(reg, function(str) {
        var relPath = str.match(re)[2]
        if (!relPath.startsWith(".")) {
            return str;
        }
        var absPath = P.resolve(P.dirname(file), relPath)
        if (!fs.existsSync(absPath)) {
            console.error(new Error("Data-Uri Not Exists: " + absPath).stack)
            return str;
        }
        console.log(`[Less] data-uri: ${absPath}`)
        var base64 = dataBase64(absPath)
        return `url("${base64}")`
    })
    return content;
}

module.exports = replaceLess;
