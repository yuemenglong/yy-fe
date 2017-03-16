var util = require("util");

exports.formatReq = function(req, body) {
    body = body ? "\n" + body : "";
    body = req.method.toUpperCase() == "GET" ? "" : body;
    var type = req.xhr ? "AJAX" : "HTTP";
    return util.format("[%s-%s] %s%s",
        type, req.method.toUpperCase(),
        req.originalUrl, body)
}

exports.formatRes = function(req, res, body) {
    body = body ? "\n" + body : "";
    var type = req.xhr ? "AJAX" : "HTTP";
    return util.format("[%s-%s] [%d] %s%s",
        type, req.method.toUpperCase(),
        res.statusCode, req.originalUrl, body)
}
