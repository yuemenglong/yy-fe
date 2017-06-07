var _ = require("lodash");
var fs = require("yy-fs");
var P = require("path");
var through = require('through2');
var stream = require("stream");
var esprima = require("esprima");
var escodegen = require("escodegen");
var estraverse = require("estraverse");

var transformPath = require("./transform-path");
var transformImg = require("./transform-img");
var TransformJade = require("./transform-jade");
var TransformLess = require("./transform-less");

var requirePattern = /^.*require\((['"]).+\1\).*$/gm;
var pathPattern = /.*require\((['"])(.+)\1\).*/;
var useStrictPattern = /^(['"])use strict\1.*/g

var getNodeValue = require("./common").getNodeValue
var setNodeValue = require("./common").setNodeValue
var replaceNode = require("./common").replaceNode
var clearNode = require("./common").clearNode

function getRequirementNodes(ast) {
    var ret = [];
    var stack = [];
    estraverse.traverse(ast, {
        enter: function(node) {
            if (node.type == "CallExpression" &&
                node.callee.type == "Identifier" &&
                node.callee.name == "require") {
                ret.push(node);
            }
            if (stack.length) {
                node.$parent = stack[0];
            }
            stack.unshift(node);
        },
        leave: function(node) {
            stack.shift();
        }
    })
    return ret;
}

function checkDirnameValid(dirname) {
    var dirs = fs.readdirSync(dirname);
    var valid = dirs.some(function(dir) {
        return dir == "node_modules";
    })
    if (!valid) {
        throw new Error("Invalid Root Location, Can't Find node_modules");
    }
    return valid;
}

function match(patList, str) {
    for (var i in patList) {
        if (patList[i] instanceof RegExp && patList[i].test(str)) {
            return true
        }
        if (typeof patList[i] == "string" && patList[i] == str) {
            return true
        }
    }
    return false
}
///////////////////////////////////////////////////

function Transform(dirname) {
    checkDirnameValid(dirname)

    function transform(file, content) {
        console.log(`Build File: [${file}]`);
        var fileName = P.basename(file);
        if (match(ignore, fileName)) {
            return content;
        }
        try {
            var ast = esprima.parse(content);
        } catch (ex) {
            var info = `Parse [${file}] Fail`;
            var line = _.times(info.length, _.constant("-")).join("");
            console.log(`+${line}+`);
            console.log(`|${info}|`);
            console.log(`+${line}+`);
            throw ex;
        }
        transformAst(file, ast);
        content = escodegen.generate(ast);
        return content;
    }

    var watchFiles = {};

    function transformAst(file, ast) {
        var nodes = getRequirementNodes(ast);
        for (var i in nodes) {
            var node = nodes[i];
            var requirePath = getNodeValue(node);
            if (enablePath && requirePath[0] == "/") {
                transformPath(dirname, file, node)
            } else if (enableBase64 && /(\.png)|(\.gif)|(\.jpg)$/.test(requirePath)) {
                transformImg(file, node)
            } else if (match(clear, requirePath)) {
                clearNode(node)
            } else if (match(persist, requirePath)) {
                // nothing
            } else if (transformLess && /\.less$/.test(requirePath)) {
                transformLess.transform(file, node)
            } else if (transformJade && requirePath[0] != ".") {
                transformJade.transform(file, node)
            }
            // 获取监控文件集合
            if (requirePath[0] == ".") {
                var rel = P.relative(dirname, file);
                if (/^build/.test(rel)) {
                    var abs = require.resolve(P.resolve(P.dirname(file), requirePath))
                    watchFiles[abs] = true;
                }
            }
        }
    }

    this.gulp = function() {
        var obj = through.obj(function(file, enc, cb) {
            var filePath = _.nth(file.history, -1);
            var content = transform(filePath, file.contents.toString());
            file.contents = new Buffer(content);
            this.push(file);
            return cb();
        });
        return obj;
    }
    this.browserify = function() {
        return function(file, opt) {
            var buf = [];
            var obj = through(function(chunk, enc, cb) {
                buf.push(chunk);
                return cb();
            }, function(cb) {
                var content = Buffer.concat(buf).toString();
                content = transform(file, content);
                this.push(new Buffer(content));
                return cb();
            });
            return obj;
        }
    }
    var clear = [];
    this.clear = function(list) {
        // 删掉
        clear = _.concat(clear, list)
    }
    var persist = [];
    this.persist = function(list) {
        // 保留
        persist = _.concat(persist, list)
    }
    var ignore = [/.*\.json$/, /.*\.less$/];
    this.ignore = function(list) {
        // 不处理,比如json, less
        ignore = _.concat(ignore, list)
    }

    var transformJade = null
    this.enableJade = function(requireMap, appName, outputPath) {
        // jade里引用
        transformJade = new TransformJade(requireMap, appName, outputPath)
    }
    var transformLess = null
    this.enableLess = function(outputPath) {
        transformLess = new TransformLess(outputPath)
    }
    var enablePath = false;
    this.enablePath = function() {
        enablePath = true;
    }
    var enableBase64 = false;
    this.enableBase64 = function() {
        enableBase64 = true;
    }
    this.output = function() {
        if (transformJade) {
            transformJade.output()
        }
        if (transformLess) {
            transformLess.output()
        }
    }

    this.getWatchFiles = function() {
        return _.keys(watchFiles)
    }
}

Transform.build = function(dirname) {
    if (arguments.length != 1) {
        throw Error("Pack Need [dirname] Args")
    }
    var trans = new Transform(dirname);
    // 路径展开
    trans.enablePath();
    // base64展开
    trans.enableBase64();
    // 保留所有
    trans.persist(/.*/);
    return trans;
}

Transform.pack = function(dirname, requireMap, persistList, appName) {
    if (arguments.length != 4) {
        throw Error("Pack Need [dirname, requireMap, persistList, appName] Args")
    }
    var trans = new Transform(dirname);
    trans.persist(persistList);
    // jade and less
    var jadePath = P.resolve(dirname, "jade", appName + ".jade")
    var lessPath = P.resolve(dirname, "bundle", appName, "bundle.css")
    trans.enableJade(requireMap, appName, jadePath)
    trans.enableLess(lessPath)
    return trans
}

Transform.dist = function(dirname) {
    if (arguments.length != 1) {
        throw Error("Pack Need [dirname] Args")
    }
    var trans = new Transform(dirname);
    trans.clear([/\.less$/, /\.png$/]);
    return trans;
}

Transform.onBundleFinish = function(browserify, cb) {
    if (arguments.length != 2) {
        throw Error("Need [browserify, cb] Args")
    }
    browserify.on('bundle', function(bundle) {
        bundle.on("end", function() {
            cb()
        })
    })
}

module.exports = Transform;
module.exports.setNodeValue = setNodeValue
module.exports.getNodeValue = getNodeValue
module.exports.replaceNode = replaceNode
module.exports.clearNode = clearNode
