var P = require("path");
var fs = require('fs');
var getNodeValue = require("./common").getNodeValue;
var replaceNode = require("./common").replaceNode;

function base64(path) {
    var bitmap = fs.readFileSync(path);
    return new Buffer(bitmap).toString('base64');
}

function getImgSrc(path) {
    var ext = P.extname(path).replace(/^\./, "");
    var b64 = base64(path);
    var content = `data:image/${ext};base64,${b64}`;
    return content;
}

function transformImg(file, node) {
    var value = getNodeValue(node);
    var path = P.resolve(P.dirname(file), value);
    var content = getImgSrc(path);
    replaceNode(node, content);
}

module.exports = transformImg;

if (require.main == module) {
    if (process.argv.length != 3) {
        console.log("Usage: node transform-img <path>")
        return;
    }
    var path = P.resolve(__dirname, process.argv[2]);
    console.log(getImgSrc(path))
}
