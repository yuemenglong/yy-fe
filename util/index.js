var Transmit = require("./transmit");
var formatReq = require("./format").formatReq;
var formatRes = require("./format").formatRes;

exports.errorObject = function(err) {
    return { name: err.name, message: err.message, detail: err.detail };
}

exports.Transmit = Transmit;
exports.formatReq = formatReq;
exports.formatRes = formatRes;
