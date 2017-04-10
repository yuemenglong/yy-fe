var _ = require("lodash");

module.exports = function(pairs, fn, fnErr) {
    var search = pairs.map(function(item) {
        return [item.name, item.url].join("=");
    }).join("&");
    var url = "/fetch?" + search;
    $.ajax({
        url: url,
        type: "GET",
        success: fn,
        error: fnErr,
    })
}
