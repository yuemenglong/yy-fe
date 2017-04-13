var util = require("util");

exports.formatReq = function(req, body) {
    body = body ? "\n" + body : "";
    body = req.method.toUpperCase() == "GET" ? "" : body;
    var type = req.xhr ? "AJAX" : "HTTP";
    return util.format("[%s-%s] %s%s",
        type, req.method.toUpperCase(),
        req._originalUrl || req.originalUrl, body)
}

exports.formatRes = function(req, res, body) {
    body = body ? "\n" + body : "";
    var type = req.xhr ? "AJAX" : "HTTP";
    return util.format("[%s-%s] [%d] %s%s",
        type, req.method.toUpperCase(),
        res.statusCode, req._originalUrl || req.originalUrl, body)
}

exports.createHtmlNode = function() {
    var num = parseInt(Math.random() * 10000);
    var id = `temp-${num}`;
    console.log(id);
    return id;
}
