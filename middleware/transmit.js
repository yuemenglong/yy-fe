var util = require("util");
var http = require("http");
var logger = require("yy-logger");
var iconv = require('iconv-lite');
var _ = require("lodash");
var formatReq = require("../util").formatReq;
var formatRes = require("../util").formatRes;

function getMessage(status) {
    return `后台服务出错(${status})，请按F5刷新后重试`;
}

function createTransmit(host, port, cb) {
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
        req.on("data", function(data) {
            reqBuf.push(data);
            backendReq.write(data);
        })
        req.on("end", function() {
            var raw = Buffer.concat(reqBuf);
            var body = iconv.decode(raw, "utf8");
            logger.info(formatReq(req, body));
            backendReq.end();
        })
        req.on("error", errorHandler);
        res.on("error", errorHandler);
        backendReq.on("error", errorHandler);
    }
}

function transmit(host, port) {
    var handler = createTransmit(host, port);

    function mergeRegex(arr) {
        if (!arr.length) {
            return;
        }
        var buf = arr.join(")|(");
        buf = `(${buf})`;
        return new RegExp(buf);
    }

    function normalizeUrl(url) {
        return "^" + url.replace(/\*/g, ".*").replace(/:[^/]*/g, "[^/]*") + "$";
    }

    function retFunc(req, res, next) {
        if (!req) {
            console.log(req, res, next);
        }
        var method = req.method;
        //不透传
        if (excludeRegex && excludeRegex.test(req.path)) {
            return next();
        }
        //全类型
        if (_both[method] && _both[method].test(req.path)) {
            return handler(req, res);
        }
        //http和ajax
        if (req.xhr && _ajax[method] && _ajax[method].test(req.path)) {
            return handler(req, res);
        } else if (!req.xhr && _http[method] && _http[method].test(req.path)) {
            return handler(req, res);
        }
        return next();
    }

    var _both = {};
    var _http = {};
    var _ajax = {};
    ["get", "post", "put", "delete"].map(function(method) {
        _both[method] = _both[method] || [];
        retFunc[method] = function(url) {
            url = normalizeUrl(url);
            _both[method].push(url);
            _both[method.toUpperCase()] = mergeRegex(_both[method]);
        }

        _http[method] = _http[method] || [];
        retFunc["http" + _.upperFirst(method)] = function(url) {
            url = normalizeUrl(url);
            _http[method].push(url);
            _http[method.toUpperCase()] = mergeRegex(_http[method]);
        }

        _ajax[method] = _ajax[method] || [];
        retFunc["ajax" + _.upperFirst(method)] = function(url) {
            url = normalizeUrl(url);
            _ajax[method].push(url);
            _ajax[method.toUpperCase()] = mergeRegex(_ajax[method]);
        }
    })

    var _exclude = [];
    var excludeRegex = null;
    retFunc.exclude = function(url) {
        url = normalizeUrl(url);
        _exclude.push(url);
        excludeRegex = mergeRegex(_exclude);
    }
    return retFunc;
}

module.exports = transmit;
module.exports.createTransmit = createTransmit;
