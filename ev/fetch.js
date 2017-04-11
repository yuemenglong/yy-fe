var _ = require("lodash");
var Promise = require("bluebird");

exports.browser = function(pairs, fn) {
    var search = pairs.map(function(item) {
        return [item.name, item.url].join("=");
    }).join("&");
    var url = "/fetch?" + search;
    $.ajax({
        url: url,
        type: "GET",
        success: function(res) {
            fn(null, res);
        },
        error: function(err) {
            fn(err, null);
        },
    })
    return;
}

exports.server = function(pairs, request, respones, fetchFn, fn) {
    pairs = pairs.map(function(item) {
        return [item.name, item.url];
    });
    fetchFn(pairs, request, respones, fn);
}
