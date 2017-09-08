var Transmit = require("../util").Transmit;
var errorObject = require("../util").errorObject;
var _ = require("lodash");
var Promise = require("bluebird");

module.exports = function(host, port) {
    return function(request, response, next) {
        if (request.path != "/fetch") {
            return next();
        }
        var fetchFn = createFetch(host, port);
        fetchFn(request.query, request, response, function(err, res) {
            if (err) {
                response.status(500).json(errorObject(err));
            } else {
                response.json(res);
            }
        });
    }
}
module.exports.createFetch = createFetch;

function createFetch(host, port) {
    return function(query, request, response, fn) {
        var pairs = _.toPairs(query);
        Promise.map(pairs, function(pair) {
            return new Promise(function(resolve, reject) {
                var key = pair[0];
                var path = pair[1];
                var transmit = Transmit(host, port, function(err, body, res) {
                    if (err) {
                        err.detail = key;
                        return reject(err)
                    }
                    if (key == "$init" && res.headers["set-cookie"]) {
                        // 设置cookie
                        response.writeHead(res.statusCode, { "set-cookie": res.headers["set-cookie"] });
                    }
                    return resolve([key, JSON.parse(body)]);
                }, { path: path, headers: { "X-Requested-With": "XMLHttpRequest" } });
                transmit(request, response);
            })
        }).then(function(res) {
            var result = _.fromPairs(res);
            fn(null, result);
        }).catch(function(err) {
            fn(err, null);
        })
    }
}