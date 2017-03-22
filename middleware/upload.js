var formidable = require('formidable');
var fs = require('fs');
var logger = require("yy-logger");
var uuid = require("node-uuid");
var P = require("path");
var moment = require("moment");

// try 允许我们在执行时错误测试的代码
// catch 当try发生错误时，执行的代码块
function exists(path) {
    try {
        var stat = fs.statSync(path); //同步版的stat，返回一个stat数组对象
        return true;
    } catch (err) {
        return false;
    }
}

function mkdir(path) {
    if (exists(path)) {
        return;
    }
    var dir = P.parse(path).dir; //将字符串转成json
    if (dir) {
        mkdir(dir);
    }
    fs.mkdirSync(path); //同步版的mkdir
}

module.exports = function(path) {
    return function(req, res, next) {
        if (req.method !== "POST") {
            return next();
        }
        var form = new formidable.IncomingForm(); //创建上传表单
        var dir = moment().format("YYYY-MM-DD");
        var uploadDir = P.resolve(path, dir);
        mkdir(uploadDir);
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = uploadDir; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 8 * 1024 * 1024; //文件大小

        form.parse(req, function(err, fields, files) {
            // console.log(files)
            if (err) {
                return res.status(500).json({ name: "UPLOAD_ERROR", message: err.message });
            }
            var file = files.file || files.upfile;
            if (!file) {
                return res.status(500).json({ name: "UPLOAD_ERROR", message: "Upload Error, No File Exists" });
            }
            var rand = uuid.v4().split("-")[0];
            var ext = P.extname(file.name);
            var fileName = new Buffer(P.basename(file.name, ext)).toString("base64");
            var id = moment().format("YYYYMMDD-HHmmss-") + rand + "-" + fileName + ext;
            var newPath = P.resolve(uploadDir, id); //P.resolve([from],to)把to解析为一个绝对路径
            fs.renameSync(file.path, newPath); //重命名（同步版的rename）
            var ret = `${dir}/${id}`;
            logger.info("[UPLOAD] %s", ret);
            res.end(ret);
        });
    }
}
