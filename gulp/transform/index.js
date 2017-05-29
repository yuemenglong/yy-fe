var _ = require("lodash");
var fs = require("yy-fs");
var P = require("path");
var through = require('through2');
var stream = require("stream");
var esprima = require("esprima");
var escodegen = require("escodegen");
var estraverse = require("estraverse");
var getValue = require("./lib/common").getValue;

var DebugPlugin = require("./lib/debug-plugin");
var ExcludePlugin = require("./lib/exclude-plugin");
var ImgPlugin = require("./lib/img-plugin");
var JadePlugin = require("./lib/jade-plugin");
var LessPlugin = require("./lib/less-plugin");
var PathPlugin = require("./lib/path-plugin");

var transformPath = require("./transform-path");
var transformImg = require("./transform-img");

var requirePattern = /^.*require\((['"]).+\1\).*$/gm;
var pathPattern = /.*require\((['"])(.+)\1\).*/;
var useStrictPattern = /^(['"])use strict\1.*/g

var getNodeValue = require("./common").getNodeValue
var setNodeValue = require("./common").setNodeValue
var replaceNode = require("./common").replaceNode
var cutNode = require("./common").cutNode

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

    function transformAst(file, ast) {
        var nodes = getRequirementNodes(ast);
        for (var i in nodes) {
            var node = nodes[i];
            var requirePath = getNodeValue(node);
            if (enablePath && requirePath[0] == "/") {
                transformPath(dirname, file, node)
            } else if (enableBase64 && /(\.png)|(\.gif)$/.test(requirePath)) {
                transformImg(file, node)
            } else if (match(cut, requirePath)) {
                cutNode(node)
            } else if (match(persist, requirePath)) {
                // nothing
            } else if (requirePath[0] != ".") {
                throw new Error("Unknown Require Path: " + requirePath)
            }
        }

        // plugins.forEach(function(plugin) {
        //     var matches = nodes.filter(function(node) {
        //         var value = getValue(node) || "";
        //         return plugin.test.test(value);
        //     })
        //     if (matches.length === 0) {
        //         return;
        //     }
        //     console.log(`Build Through: [${plugin.constructor.name}]`);
        //     plugin.transform(file, matches, ast);
        // });
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

    }
    var cut = [];
    this.cut = function(list) {
        // 删掉
    }
    var persist = [];
    this.persist = function(list) {
        // 保留
        persist = _.concat(persist, list)
    }

    var script = {};
    this.script = function(map) {
        // jade里引用
    }
    var ignore = [/.*\.json/];
    this.ignore = function(list) {
        // 不处理,比如json
    }

    var enablePath = false;
    this.enablePath = function() {
        enablePath = true;
    }
    var enableBase64 = false;
    this.enableBase64 = function() {
        enableBase64 = true;
    }
}

Transform.build = function(dirname) {
    var trans = new Transform(dirname);
    // 路径展开
    trans.enablePath();
    // base64展开
    trans.enableBase64();
    // 保留所有
    trans.persist(/.*/);
    return trans;
}


function transform(file, content, plugins) {
    console.log(`Build File: [${file}]`);
    if (IGNORES.indexOf(P.extname(file)) >= 0) {
        return content;
    }
    try {
        // var ast = esprima.parse(content, { sourceType: "module" });
        var ast = esprima.parse(content);
    } catch (ex) {
        var info = `Parse [${file}] Fail`;
        var line = _.times(info.length, _.constant("-")).join("");
        console.log(`+${line}+`);
        console.log(`|${info}|`);
        console.log(`+${line}+`);
        throw ex;
    }
    var nodes = getRequirementNodes(ast);
    plugins.forEach(function(plugin) {
        var matches = nodes.filter(function(node) {
            var value = getValue(node) || "";
            return plugin.test.test(value);
        })
        if (matches.length === 0) {
            return;
        }
        console.log(`Build Through: [${plugin.constructor.name}]`);
        plugin.transform(file, matches, ast);
    });
    content = escodegen.generate(ast);
    return content;
}

function wrapPlugin(ret) {
    ret.plugin = function() {
        ret.plugins = _.concat(ret.plugins, arguments);
    }
    ret.plugins = [];
}

function wrapEvent(obj, ret) {
    obj.on("end", function() {
        ret.plugins.map(function(o) {
            if (o instanceof stream.Readable) {
                o.push(null);
            }
        })
    })
}

function Browserify(browserify) {
    if (!browserify) {
        throw new Error("Must Pass Browserify As Arguments When Use Prerequire Transform");
    }
    var DEBUG_DIR = null;

    var ret = function(file, opt) {
        var buf = [];
        var obj = through(function(chunk, enc, cb) {
            buf.push(chunk);
            return cb();
        }, function(cb) {
            var content = Buffer.concat(buf).toString();
            content = transform(file, content, ret.plugins);
            this.push(new Buffer(content));
            if (DEBUG_DIR) {
                var relative = P.relative(DEBUG_DIR, file);
                var debugDir = P.resolve(DEBUG_DIR, "bundle-debug");
                fs.mkdirSync(debugDir);
                var debugFile = P.resolve(debugDir, relative);
                // var debugFile = `${file}.bundle`;
                console.log(`Write Bundle Debug To [${debugFile}]`);
                fs.writeFileSync(debugFile, content);
            }
            return cb();
        });
        // wrapEvent(obj, ret);
        return obj;
    }
    ret.debug = function(dirname) {
        console.log("debug", dirname);
        if (!dirname) {
            throw Error("Call Debug Must With Dirname");
        }
        DEBUG_DIR = dirname;
    }

    wrapPlugin(ret);
    browserify.on('bundle', function(bundle) {
        bundle.on("end", function() {
            ret.plugins.map(function(o) {
                if (o instanceof stream.Readable) {
                    o.push(null);
                }
            })
        })
    })
    browserify.transform(ret);
    return ret;
}

function Build() {
    var ret = function() {
        var obj = through.obj(function(file, enc, cb) {
            var filePath = _.nth(file.history, -1);
            var content = transform(filePath, file.contents.toString(), ret.plugins);
            file.contents = new Buffer(content);
            this.push(file);
            return cb();
        });
        // wrapEvent(obj, ret);
        return obj;
    }
    wrapPlugin(ret);
    return ret;
}

module.exports = Transform;
module.exports.setNodeValue = setNodeValue
module.exports.getNodeValue = getNodeValue
module.exports.replaceNode = replaceNode
module.exports.cutNode = cutNode
