var util = require("util");
exports.formatReq = function(req, body) {
    body = typeof body == "object" ? JSON.stringify(body) : body;
    body = body ? "\n" + body : "";
    body = req.method.toUpperCase() == "GET" ? "" : body;
    var type = req.xhr ? "AJAX" : "HTTP";
    return util.format("[%s-%s] %s%s",
        type, req.method.toUpperCase(),
        req._originalUrl || req.originalUrl, body)
}

exports.formatRes = function(req, res, body) {
    body = typeof body == "object" ? JSON.stringify(body) : body;
    body = body ? "\n" + body : "";
    body = req.method.toUpperCase() == "GET" && process.env.NODE_ENV === 'production' ? "" : body;
    var type = req.xhr ? "AJAX" : "HTTP";
    return util.format("[%s-%s] [%d] %s%s",
        type, req.method.toUpperCase(),
        res.statusCode, req._originalUrl || req.originalUrl, body)
}

// exports.formatReq = function(req, body) {
//     body = typeof body == "object" ? JSON.stringify(body) : body;
//     body = body ? "\n" + body : "";
//     body = req.method.toUpperCase() == "GET" ? "" : body;
//     var type = req.xhr ? "AJAX" : "HTTP";
//     return util.format("[%s] [%s-%s] %s%s",
//         req.headers["x-tid"], type, req.method.toUpperCase(),
//         req.originalUrl, body)
// }

// exports.formatRes = function(req, res, body) {
//     body = typeof body == "object" ? JSON.stringify(body) : body;
//     body = body ? "\n" + body : "";
//     body = req.method.toUpperCase() == "GET" && process.env.NODE_ENV === 'production' ? "" : body;
//     var type = req.xhr ? "AJAX" : "HTTP";
//     return util.format("[%s] [%s-%s] [%d] %s%s",
//         req.headers["x-tid"], type, req.method.toUpperCase(),
//         res.statusCode, req.originalUrl, body)
// }
