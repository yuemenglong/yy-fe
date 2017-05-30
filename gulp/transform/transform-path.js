var P = require("path");
var fs = require("fs");
var getNodeValue = require("./common").getNodeValue;
var setNodeValue = require("./common").setNodeValue;

function root(path) {
    var parsed = P.parse(path);
    if (parsed.dir.length > 0) {
        return root(parsed.dir);
    }
    return path;
}

function getRelativePath(cwd, filePath, requirePath) {
    var workspace = root(P.relative(cwd, filePath));
    var absolute = P.resolve(cwd, "./" + workspace, "." + requirePath);
    var relative = P.relative(P.parse(filePath).dir, absolute).replace(/\\/g, "/");
    return relative;
}

function transformPath(dirname, file, node) {
    var path = getNodeValue(node);
    var relativePath = getRelativePath(dirname, file, path)
    if (relativePath[0] != ".") {
        relativePath = "./" + relativePath
    }
    setNodeValue(node, relativePath);
}

module.exports = transformPath;
