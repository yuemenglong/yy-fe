var Transmit = require("./transmit");
var formatReq = require("./format").formatReq;
var formatRes = require("./format").formatRes;

exports.createHtmlNode = function() {
    var num = parseInt(Math.random() * 10000);
    var id = `temp-${num}`;
    return id;
}

exports.Transmit = Transmit;
exports.formatReq = formatReq;
exports.formatRes = formatRes;
