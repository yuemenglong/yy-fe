var logger = require("yy-logger");
var formatReq = require("./log-format").formatReq;
var http = require("http");
var iconv = require('iconv-lite');
var formatReq = require("./log-format").formatReq;
var formatRes = require("./log-format").formatRes;

module.exports = function(host, port, fn) {
    return function(req, res) {
        function errorHandler(err) {
            logger.error(JSON.stringify(err.stack));
            res.status(500).end(JSON.stringify({ name: err.name, message: err.message }));
        }
        var reqBuf = [];
        var resBuf = [];
        var options = {
            hostname: host,
            port: port,
            path: req.originalUrl,
            method: req.method,
            headers: req.headers,
        };
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
                    logger.error(formatRes(req, backendRes, body));
                    try {
                        var err = JSON.parse(body);
                        return res.status(backendRes.statusCode).json(err);
                    } catch (ex) {
                        return res.status(backendRes.statusCode).end(JSON.stringify({ name: "BACKEND_ERROR", message: getMessage(backendRes.statusCode) }));
                    }
                }
                logger.info(formatRes(req, backendRes, body));
                // 处理重定向的情况
                if (Math.floor(backendRes.statusCode / 100) == 3) {
                    res.writeHead(backendRes.statusCode, backendRes.headers);
                    return res.end();
                }
                // 提供回调函数的情况
                if (fn) {
                    return fn(req, res, body);
                }
                // 处理ajax请求的情况
                if (req.xhr) {
                    res.writeHead(backendRes.statusCode, backendRes.headers);
                    return res.end(body);
                }
                // 处理bin的情况
                if (bin) {
                    res.writeHead(backendRes.statusCode, backendRes.headers);
                    return res.end(raw);
                }
                // 处理ModalAndView的情况
                try {
                    var mv = JSON.parse(body);
                    return res.render(mv.view, { init: mv.model, title: mv.title });
                } catch (err) {
                    return errorHandler(err);
                }
            });
            backendRes.on("error", errorHandler);
        });
        backendReq.on("error", errorHandler);

        var json = JSON.stringify(req.body);
        logger.info(formatReq(req, json));
        backendReq.write(json);
        backendReq.end();
    }
}
