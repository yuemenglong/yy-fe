var _ = require("lodash");
var stream = require("stream");
var util = require("util");
var P = require("path");
var fs = require("yy-fs");

var through = require("through2");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
// var vfs = require('vinyl-fs');
var stream = require("stream");
var getNodeValue = require("./common").getNodeValue;
var clearNode = require("./common").clearNode;

var tpl = `
html
    head
        meta(charset="utf-8")
        title #{title}
        script(src="//cdn.bootcss.com/es5-shim/4.5.9/es5-shim.js")
        script(src="//cdn.bootcss.com/es5-shim/4.5.9/es5-sham.js")
        script(src="//cdn.bootcss.com/jquery/1.12.4/jquery.js")
        @{INCLUDE}
        link(rel="stylesheet" href="/bundle/@{APP}/bundle.css")
        script.
            window.__INITIAL_STATE__ = (function(){return !{JSON.stringify(init)}})();
    body
        #container !{html}
        script(src="/bundle/@{APP}/bundle.js")`
var includeMatch = tpl.match(/^(.*)\@{INCLUDE}.*$/m);
var includeAnchor = includeMatch[0];
var includeIndent = includeMatch[1];

function TransformJade(requireMap, appName, outputPath) {
    if (arguments.length != 3) {
        throw Error("TransformJade Has [requireMap, appName, outputPath] Args")
    }
    var includes = {};
    this.transform = function(file, node) {
        var path = getNodeValue(node);
        if (includes[path]) {
            //已经加入过了，没啥好说的，直接删结点
            clearNode(node);
        } else if (requireMap[path]) {
            // 第一次require, 需要加入include
            clearNode(node);
            includes[path] = requireMap[path];
            var line = `Include [${path}] => ${requireMap[path]}`;
            console.log(`[Jade]: ${line}`);
        } else {
            throw new Error("Unknown Requirement: " + path)
        }
    }
    this.output = function() {
        var lines = _.flatten(_.values(includes));
        var includeOutput = lines.map(function(l) {
            if (_.endsWith(l, ".js")) {
                return util.format("%sscript(src='%s')", includeIndent, l)
            } else if (_.endsWith(l, ".css")) {
                return util.format("%slink(rel='stylesheet' href='%s')", includeIndent, l);
            } else {
                throw new Error("Unknown Include Type: " + l);
            }
        }).join("\n");
        var content = tpl
            .replace(/\@{APP}/g, appName)
            .replace(includeAnchor, includeOutput)
        fs.mkdirSync(P.dirname(outputPath))
        fs.writeFileSync(outputPath, content)
        console.log("[Jade] Output => " + outputPath)
    }
}

function JadePlugin(requireMap, appName, outputName) {
    stream.Readable.call(this);
    var that = this;
    var includes = {};
    var tpl = fs.readFileSync(__dirname + "/jade-plugin.jade").toString();
    var match = tpl.match(/^(.*)\${INCLUDE}.*$/m);
    var includeAnchor = match[0];
    var includeIndent = match[1];

    this.test = /^[^.].*/;
    this.transform = function(file, requireNodes) {
        requireNodes.map(function(node) {
            var path = getNodeValue(node);
            if (includes[path]) {
                //已经加入过了，没啥好说的，直接删结点
                clearNode(node);
                return;
            } else if (/^\/\/.+/.test(path)) {
                // 以//开头的情况，直接展开，不用到requireMap里找了
                clearNode(node);
                includes[path] = path.slice(1);
                var line = `Include [${path}]`;
                console.log(`[Jade]: ${line}`);
                return;
            } else if (requireMap[path] === undefined) {
                // 没有配置require路径
                throw new Error(`Unknown Require: ${path}, [${file}]`);
            } else if (requireMap[path] === null) {
                // 这种情况表示直接打包进去, 不用处理，由browserify处理
                return;
            } else if (requireMap[path] && !includes[path]) {
                // 第一次require, 需要加入include
                clearNode(node);
                includes[path] = requireMap[path];
                var line = `Include [${path}] => ${requireMap[path]}`;
                console.log(`[Jade]: ${line}`);
                return;
            }
        })
    }
    this._read = function() {}

    this.pipe = (function() {
        var ret = that
            .pipe(outputJade())
            .pipe(source(outputName))
            .pipe(buffer());
        return ret.pipe.bind(ret);
    })();

    function outputJade() {
        return through(function(chunk, enc, cb) {
            cb();
        }, function(cb) {
            var lines = _.flatten(_.values(includes));
            var includeOutput = lines.map(function(l) {
                if (_.endsWith(l, ".js")) {
                    return util.format("%sscript(src='%s')", includeIndent, l)
                } else if (_.endsWith(l, ".css")) {
                    return util.format("%slink(rel='stylesheet' href='%s')", includeIndent, l);
                } else {
                    throw new Error("Unknown Include Type: " + l);
                }
            }).join("\n");
            var content = tpl
                .replace(/\${APP}/g, appName)
                .replace(includeAnchor, includeOutput)
            this.push(content);
            cb();
        })
    }
}
util.inherits(JadePlugin, stream.Readable);

module.exports = TransformJade;
