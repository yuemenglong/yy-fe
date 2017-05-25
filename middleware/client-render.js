var createTransmit = require("./transmit").createTransmit;

module.exports = function(host, port) {
    return function(req, res, next) {
        // ajax不处理，只处理http请求
        if (req.xhr) {
            return next();
        }
        var render = res.render.bind(res);
        var handler = createTransmit(host, port, function(err, body) {
            if (err) {
                res.status(500).end(err);
            } else {
                var data = JSON.parse(body)
                res.render = function(path, opt) {
                    // 把title和meta提取出来，剩下的放到init里
                    var title = data["$title"];
                    var meta = data["$meta"];
                    delete data["$title"];
                    delete data["$meta"];
                    render(path, _.merge(opt, data))
                }
                next();
            }
        });
        handler(req, res)
    }
}
