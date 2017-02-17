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

var Build = require("yy-build");
var DebugPlugin = Build.DebugPlugin;
var ExcludePlugin = Build.ExcludePlugin;
var ImgPlugin = Build.ImgPlugin;
var JadePlugin = Build.JadePlugin;
var LessPlugin = Build.LessPlugin;
var PathPlugin = Build.PathPlugin;

var defaultMap = {
    "react": "//cdn.bootcss.com/react/0.14.7/react.js",
    "react-dom": "//cdn.bootcss.com/react/0.14.7/react-dom.js",
    "lodash": "//cdn.bootcss.com/lodash.js/4.12.0/lodash.min.js",
    "bluebird": "//cdn.bootcss.com/bluebird/3.3.5/bluebird.min.js",
    "moment": "//cdn.bootcss.com/moment.js/2.13.0/moment.min.js",
}

function errorHandler(err) {
    console.log(err.stack);
}

module.exports = function(dirname, requireMap) {
    if (!dirname || !requireMap) {
        throw Error("Need __dirname And requireMap Arguments");
    }
    requireMap = _.merge(defaultMap, requireMap);

    function resolve(path) {
        return P.resolve(dirname, path);
    }

    function replaceSrc(path, to) {
        var arr = path.split("src");
        var last = _.nth(arr, -1);
        var pre = arr.slice(0, -1).join("src");
        return [pre, last].join(to);
    }

    function getApps() {
        function getAppPath(path) {
            var subApps = fs.readdirSync(path).map(function(name) {
                var stats = fs.statSync(`${path}/${name}`)
                if (stats.isDirectory() && name == _.upperFirst(name))
                    return `${path}/${name}`;
            }).filter(function(path) {
                return path != undefined;
            });
            if (!subApps.length) {
                ret.push(path);
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

    Build.ignore(".json");
    var apps = getApps();

    function build() {
        var build = new Build();
        build.plugin(new PathPlugin(dirname));
        build.plugin(new ImgPlugin());
        var buildTask = gulp.src(resolve("src/**/*.jsx"))
            .pipe(jadeToJsx())
            .on("error", errorHandler)
            .pipe(addsrc([resolve("src/**/*.js")]))
            .pipe(babel({ presets: ['react'] }))
            .pipe(rename({ extname: ".js" }))
            .pipe(build())
            .pipe(addsrc([resolve("src/**/*.less"), resolve("src/**/*.json")]))
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
        var lessTasks = [];
        var jadeTasks = [];
        var packTasks = apps.map(function(name) {
            var src = replaceSrc(`${name}/bundle.js`, "build");
            var dest = replaceSrc(name, "bundle");
            var b = browserify(src);
            var build = new Build.Browserify(b);
            var jp = new JadePlugin(requireMap, name, `${name}.jade`);
            var lp = new LessPlugin("bundle.css");
            build.plugin(jp);
            build.plugin(lp);
            var jadeTask = jp.pipe(gulp.dest(replaceSrc(name, "jade")));
            var lessTask = lp.pipe(gulp.dest(replaceSrc(name, "bundle")));
            jadeTasks.push(jadeTask);
            lessTasks.push(lessTask);
            return b.bundle()
                .pipe(source("bundle.js"))
                .pipe(buffer())
                .pipe(gulp.dest(dest))
        })
        return merge(packTasks.concat(jadeTasks).concat(lessTasks));
    }

    function dist() {
        var build = new Build();
        build.plugin(new ExcludePlugin());
        return gulp.src([resolve("build/**/*.js"), resolve("build/**/*.json")]).pipe(build()).pipe(gulp.dest(`dist`));
    }

    function clean(done) {
        // return gulp.src(resolve("build")).pipe(path(del));
        fs.unlinkSync(resolve("build"));
        fs.unlinkSync(resolve("bundle"));
        fs.unlinkSync(resolve("jade"));
        fs.unlinkSync(resolve("dist"));
        done();
    }

    var all = gulp.series(build, disp, pack);

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

    function watchSrc(done) {
        var app = process.argv.slice(-1)[0].slice(2);
        var watcher = gulp.watch(["src/**/*.jsx", "src/**/*.js", "src/**/*.json"]);
        watcher.on("change", function(path) {
            var build = new Build();
            build.plugin(new PathPlugin(dirname));
            build.plugin(new ImgPlugin());
            var output = P.resolve(dirname, P.dirname(path).replace(/^src/, "build"));
            path = P.resolve(dirname, path);
            console.log(`[${timeString()}] File Change: [${path}]`);
            console.log(`[${timeString()}] Build Output: [${output}]`);
            if (P.extname(path) == ".jsx") {
                gulp.src(path)
                    .pipe(jadeToJsx())
                    .on("error", errorHandler)
                    .pipe(babel({ presets: ["react"] }))
                    .pipe(rename({ extname: ".js" }))
                    .pipe(build())
                    .pipe(gulp.dest(output));
            } else {
                gulp.src(path).pipe(build()).pipe(gulp.dest(output));
            }
        })
        done();

        function timeString() {
            var now = new Date();
            return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        }
    }

    function watchBuild(done) {
        var app = process.argv.slice(-1)[0].slice(2);
        var b = browserify(`build/${app}/bundle.js`, { cache: {}, packageCache: {} });
        b.plugin(watchify);
        b.on("update", bundle);
        var build = new Build.Browserify(b);
        build.plugin(new ExcludePlugin(requireMap));
        build.plugin(new DebugPlugin());
        bundle();

        function timeString() {
            var now = new Date();
            return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        }

        function cb(err) {
            if (err) {
                console.log(`[${timeString()}] Build [${app}] Fail`);
                console.log(err.stack);
            } else {
                console.log(`[${timeString()}] Build [${app}] Succ`);
            }
        }

        function bundle() {
            console.log(`[${timeString()}] Build [${app}] Start`)
            return b.bundle(cb)
                .pipe(source("bundle.js"))
                .pipe(buffer())
                .pipe(gulp.dest(`bundle/${app}`))
        }
        done();
    }

    gulp.task('watch', gulp.series(watchValidate, build, disp, pack, watchSrc, watchBuild));
}
