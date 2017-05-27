var util = require("util");
var http = require("http");
var logger = require("yy-logger");
var iconv = require('iconv-lite');
var _ = require("lodash");
var formatReq = require("./format").formatReq;
var formatRes = require("./format").formatRes;

function getMessage(status) {
    return `后台服务出错(${status})，请按F5刷新后重试`;
}

function Transmit(host, port, fn, opt) {
    opt = opt || {}
    var transmit = function(req, res) {
        function errorHandler(err) {
            logger.error(JSON.stringify(err.stack));
            res.status(500).end(JSON.stringify({ name: err.name, message: err.message }));
        }
        var resBuf = [];
        var options = _.merge({
            hostname: host,
            port: port,
            path: req.originalUrl,
            method: req.method,
            headers: req.headers,
        }, opt);
        var backendReq = http.request(options, function(backendRes) {
            backendRes.on("data", function(data) {
                resBuf.push(data);
            })
            backendRes.on("end", function() {
                var raw = Buffer.concat(resBuf);
                var bin = (backendRes.headers["content-type"] || "").match(/jpeg/);
                var body = bin ? "" : iconv.decode(raw, "utf8");
                // 处理出错的情况
                if (backendRes.statusCode >= 400) {
                    req._originalUrl = opt.path; // 为了打日志 
                    logger.error(formatRes(req, backendRes, body));
                    if (fn) {
                        return fn(body, null);
                    }
                    try {
                        var err = JSON.parse(body);
                        return res.status(backendRes.statusCode).json(err);
                    } catch (ex) {
                        return res.status(backendRes.statusCode).end(JSON.stringify({ name: "BACKEND_ERROR", message: getMessage(backendRes.statusCode) }));
                    }
                }
                req._originalUrl = opt.path; // 为了打日志 
                logger.info(formatRes(req, backendRes, body));
                // 处理重定向的情况
                if (Math.floor(backendRes.statusCode / 100) == 3) {
                    res.writeHead(backendRes.statusCode, backendRes.headers);
                    return res.end();
                }
                // 提供了回调函数
                if (fn) {
                    return fn(null, body);
                }
                // 没有提供回调函数的情况下默认透回去
                res.writeHead(backendRes.statusCode, backendRes.headers);
                // 处理bin的情况
                if (bin) {
                    return res.end(raw);
                } else {
                    return res.end(body);
                }
            });
            backendRes.on("error", errorHandler);
        });
        req.on("error", errorHandler);
        res.on("error", errorHandler);
        backendReq.on("error", errorHandler);

        req._originalUrl = opt.path; // 为了打日志
        logger.info(formatReq(req, JSON.stringify(req.body)));
        backendReq.end(JSON.stringify(req.body));
    }
    transmit.ajax = function(req, res, next) {
        if (req.xhr) {
            transmit(req, res)
        } else {
            next()
        }
    }
    return transmit;
}

module.exports = Transmit;
