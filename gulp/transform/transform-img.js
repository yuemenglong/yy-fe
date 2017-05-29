var P = require("path");
var fs = require('fs');
var getNodeValue = require("./common").getNodeValue;
var replaceNode = require("./common").replaceNode;

function base64(path) {
    var bitmap = fs.readFileSync(path);
    return new Buffer(bitmap).toString('base64');
}

function ImgPlugin() {
    this.test = /(\.png)|(\.gif)$/;
    this.transform = function(file, requireNodes) {
        // console.log(JSON.stringify(ast, null, "  "));
        requireNodes.map(function(node) {
            // console.log(JSON.stringify(node, null, "  "));
            var value = getNodeValue(node);
            var path = P.resolve(P.dirname(file), value);
            var ext = P.extname(value).replace(/^\./, "");
            var b64 = base64(path);
            var content = `data:image/${ext};base64,${b64}`;
            // node.declarations[0].init = { type: "Literal", value: content, raw: `"${content}"` };
            replaceNode(node, content);
        })
    }
}

function transformImg(file, node) {
    var value = getNodeValue(node);
    var path = P.resolve(P.dirname(file), value);
    var ext = P.extname(value).replace(/^\./, "");
    var b64 = base64(path);
    var content = `data:image/${ext};base64,${b64}`;
    replaceNode(node, content);
}

module.exports = transformImg;
