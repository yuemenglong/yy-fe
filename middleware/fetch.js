var createTransmit = require("./transmit").createTransmit;
var _ = require("lodash");
var Promise = require("bluebird");

module.exports = function(host, port) {
    return function(request, response, next) {
        if (request.path != "/fetch") {
            return next();
        }
        var pairs = _.toPairs(request.query);
        var fetchFn = createFetch(host, port);
        fetchFn(pairs, request, response, function(err, res) {
            if (err) {
                response.status(500).json(err);
            } else {
                response.json(res);
            }
        });
    }
}
module.exports.createFetch = createFetch;

function createFetch(host, port) {
    return function(pairs, request, response, fn) {
        Promise.map(pairs, function(pair) {
            return new Promise(function(resolve, reject) {
                var key = pair[0];
                var path = pair[1];
                var handler = createTransmit(host, port, function(req, res, body) {
                    resolve([key, JSON.parse(body)]);
                }, function(req, res, err) {
                    err.detail = key;
                    reject(err);
                }, path);
                handler(request, response);
            })
        }).then(function(res) {
            var result = _.fromPairs(res);
            fn(null, result);
            // var result = _.fromPairs(res);
            // response.json(result);
        }).catch(function(err) {
            fn(err, null);
            // response.status(500).json(err);
        })
    }
}
