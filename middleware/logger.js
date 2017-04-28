var logger = require("yy-logger");
var util = require("util");
var formatReq = require("../util").formatReq;
var formatRes = require("../util").formatRes;

module.exports = function() {
    return function(req, res, next) {
        var body = /(POST)|(PUT)/.test(req.method.toUpperCase()) ? JSON.stringify(req.body) : "";
        var info = formatReq(req, body);
        logger.log(info);
        req.on("error", function(err) {
            logger.error(err);
        })
        res.on("finish", function() {
            delete req._originalUrl;
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
