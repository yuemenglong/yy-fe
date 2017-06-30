var _ = require("lodash");
var fs = require("yy-fs");
var P = require("path");
var cp = require("child_process");

var gulp = require('gulp');
var jadeToJsx = require("gulp-jade-jsx");
var through = require("through2");

var browserify = require("browserify");
var watchify = require('watchify');
var del = require('del');
var path = require('vinyl-paths');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var babel = require('gulp-babel');
var rename = require("gulp-rename");
var addsrc = require('gulp-add-src');
var merge = require('merge-stream');

var Transform = require("./transform")

// 默认的映射文件
var defaultRequireMap = {
    "bootstrap": "//cdn.bootcss.com/bootstrap/3.3.6/css/bootstrap.css",
    "react": "//cdn.bootcss.com/react/0.14.9/react.js",
    "react-dom": "//cdn.bootcss.com/react/0.14.9/react-dom.js",
    "react-router": "//cdn.bootcss.com/react-router/2.3.0/ReactRouter.js",
    "lodash": "//cdn.bootcss.com/lodash.js/4.12.0/lodash.js",
    "bluebird": "//cdn.bootcss.com/bluebird/3.3.5/bluebird.js",
    "moment": "//cdn.bootcss.com/moment.js/2.13.0/moment.js",
    "yy-fe/ev": null,
    "yy-fe/element": null,
    "events": null,
    "util": null,
}

var defaultClearList = [/\.less$/]; // 需要将require删掉的文件
var defaultIgnoreList = [/\.json$/, /\.less$/, /\.jpg$/, /\.png$/, /\.gif$/]; // 无需处理的文件

function errorHandler(err) {
    console.log(err.stack);
}

module.exports = function(dirname, requireMap, clearList, ignoreList) {
    if (arguments.length != 4) {
        throw Error("Need [dirname, requireMap, clearList, ignoreList] Args")
    }
    requireMap = _.merge({}, defaultRequireMap, requireMap);
    clearList = _.concat([], defaultClearList, clearList);
    ignoreList = _.concat([], defaultIgnoreList, ignoreList);

    function resolve(path) {
        return P.resolve(dirname, path);
    }

    function replaceSrc(path, to) {
        var arr = path.split("src");
        var last = _.nth(arr, -1);
        var pre = arr.slice(0, -1).join("src");
        return [pre, last].join(to);
    }

    function clearSrc(path) {
        var arr = path.split("src/");
        return _.nth(arr, -1);
    }

    function getApps() {
        function getAppPath(path) {
            var hasIndex = false;
            var subApps = fs.readdirSync(path).map(function(name) {
                var stats = fs.statSync(`${path}/${name}`);
                if (stats.isFile() && name.match(/^index\./)) {
                    hasIndex = true;
                }
                if (stats.isDirectory() && name == _.upperFirst(name)) {
                    return `${path}/${name}`;
                }
            }).filter(function(path) {
                return path != undefined;
            });
            if (!subApps.length && hasIndex) {
                // 正常情况
                ret.push(path);
            } else if (subApps.length && hasIndex) {
                // 异常情况，APP路径下还有子路径
                throw Error(`[${path}] App Path Can't Has Sub Path With UpperCase`);
            } else if (!subApps.length && !hasIndex) {
                // 空路径，不用处理
            } else {
                subApps.map(getAppPath);
            }
        }
        var ret = [];
        getAppPath(resolve("src"));
        ret = ret.map(function(path) {
            return path.replace(/^src\//, "");
        });
        return ret;
    }

    var apps = getApps();

    function build() {
        var trans = Transform.build(dirname, ignoreList)
        var buildTask = gulp.src(resolve("src/**/*.jsx"))
            .pipe(jadeToJsx())
            .on("error", errorHandler)
            // .pipe(addsrc([resolve("src/**/*.js")]))
            .pipe(babel({ presets: ['react'] }))
            .pipe(rename({ extname: ".js" }))
            .pipe(addsrc([resolve("src/**/*.*"), "!" + resolve("src/**/*.jsx")]))
            .pipe(trans.gulp())
            .pipe(gulp.dest(resolve("build")));
        return buildTask;
    }

    function disp(done) {
        var content = fs.readFileSync(P.resolve(__dirname, "bundle.js"));
        var dispatchTasks = apps.map(function(name) {
            var to = replaceSrc(`${name}/bundle.js`, "build");
            console.log(`Dispatch [bundle.js] => [${to}]`);
            fs.writeFileSync(to, content);
        })
        done();
    }

    function pack() {
        var packTasks = apps.map(function(name) {
            var appName = clearSrc(name);
            var src = P.resolve(dirname, "build", appName, "bundle.js")
            var dest = P.resolve(dirname, "bundle", appName)
            var b = browserify(src);
            var trans = Transform.pack(dirname, appName, requireMap, ignoreList)
            b.transform(trans.browserify())
            return b.bundle(() => trans.output())
                .pipe(source("bundle.js"))
                .pipe(buffer())
                .pipe(gulp.dest(dest))
        })
        return merge(packTasks);
    }

    function dist() {
        var trans = Transform.dist(dirname, clearList, ignoreList)
        return gulp.src(resolve("build/**/*.*"))
            .pipe(trans.gulp())
            .pipe(gulp.dest(`dist`));
    }

    function clean(done) {
        console.log(`Clean ${resolve("build")}`);
        console.log(`Clean ${resolve("bundle")}`);
        console.log(`Clean ${resolve("jade")}`);
        console.log(`Clean ${resolve("dist")}`);
        fs.unlinkSync(resolve("build"));
        fs.unlinkSync(resolve("bundle"));
        fs.unlinkSync(resolve("jade"));
        fs.unlinkSync(resolve("dist"));
        done();
    }

    var all = gulp.series(build, disp, pack, dist);

    gulp.task("build", build);
    gulp.task("disp", disp);
    gulp.task("pack", pack);
    gulp.task("dist", dist);
    gulp.task("clean", clean);
    gulp.task("all", all);
    gulp.task("default", all);

    function watchValidate(done) {
        var app = process.argv.slice(-1)[0];
        if (!/^--.+/.test(app)) {
            console.error("Usage: gulp watch --<APP_NAME>");
            process.exit(1);
        }
        app = app.slice(2);
        try {
            var stat = fs.lstatSync(`src/${app}/index.jsx`);
        } catch (err) {
            console.error("Can't Find App: " + app);
            process.exit(1);
        }
        done();
    }

    function watch(done) {
        var appName = process.argv.slice(-1)[0].slice(2);
        var src = P.resolve(dirname, "build", appName, "bundle.js")
        var dest = P.resolve(dirname, "bundle", appName)
        var b = browserify(src);
        var trans = Transform.pack(dirname, appName, requireMap, ignoreList)
        b.transform(trans.browserify())

        function startWatch() {
            var buildFiles = trans.getWatchFiles();
            var srcFiles = buildFiles.map(function(file) {
                var rel = P.relative(dirname, file).replace(/^build/, "src");
                var abs = P.resolve(dirname, rel)
                if (/\.js$/.test(abs) && !fs.existsSync(abs)) {
                    abs += "x"; // convert to jsx
                }
                console.log("[Watch] " + abs)
                return abs;
            })

            var srcWatcher = gulp.watch(srcFiles);
            srcWatcher.on("change", onSrcChange)
        }

        function onSrcChange(path) {
            var trans = Transform.build(dirname, ignoreList)
            var output = P.dirname(replaceSrc(path, "build"));
            console.log("\n");
            console.log(`[${timeString()}] File Change: [${path}]`);
            console.log(`[${timeString()}] Build Output: [${output}]`);
            if (P.extname(path) == ".jsx") {
                var stm = gulp.src(path)
                    .pipe(jadeToJsx())
                    .on("error", errorHandler)
                    .pipe(babel({ presets: ["react"] }))
                    .pipe(rename({ extname: ".js" }))
                    .pipe(trans.gulp())
                    .pipe(gulp.dest(output));
            } else if (P.extname(path) == ".js") {
                var stm = gulp.src(path).pipe(trans.gulp()).pipe(gulp.dest(output));
            } else { //less json
                var stm = gulp.src(path).pipe(gulp.dest(output));
            }
            stm.on("finish", repack)
            stm.on("finish", redist.bind(null, path))
        }

        function repack() {
            var src = P.resolve(dirname, "build", appName, "bundle.js")
            var dest = P.resolve(dirname, "bundle", appName)
            var b = browserify(src);
            var trans = Transform.pack(dirname, appName, requireMap, ignoreList)
            b.transform(trans.browserify())
            return b.bundle(() => trans.output())
                .pipe(source("bundle.js"))
                .pipe(buffer())
                .pipe(gulp.dest(dest))
        }

        function redist(path) {
            switch (P.extname(path)) {
                case ".js":
                case ".json":
                    break;
                case ".less":
                    return;
                case ".jsx":
                    path = path.replace(/jsx$/, "js");
                    break;
                default:
                    throw new Error("Unknown Ext: " + P.extname(path))
            }
            var trans = Transform.dist(dirname, clearList, ignoreList)
            var input = replaceSrc(path, "build")
            var output = P.dirname(replaceSrc(path, "dist"))
            console.log("[Dist] Output => " + output)
            return gulp.src(input)
                .pipe(trans.gulp())
                .pipe(gulp.dest(output));
        }

        function timeString() {
            var now = new Date();
            return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        }

        b.bundle(startWatch)
            .pipe(source("bundle.js"))
            .pipe(buffer())
            .pipe(gulp.dest(dest))
    }

    gulp.task('watch', gulp.series(watchValidate, all, watch));

    return gulp;
}
