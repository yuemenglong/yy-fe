var logger = require("yy-logger");
var util = require("util");
var formatRes = require("../util").formatRes;

module.exports = function() {
    return function(req, res, next) {
        var buf = [];
        req.on("error", function(err) {
            logger.error(err);
        })
        res.on("finish", function() {
            var body = /(POST)|(PUT)/.test(req.method.toUpperCase()) ? JSON.stringify(req.body) : "";
            var info = formatRes(req, res, body);
            if (Math.floor(res.statusCode / 100) == 4) {
                logger.warn(info);
            } else {
                logger.log(info);
            }
        })
        next();
    }
}
