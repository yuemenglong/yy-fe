var logger = require("yy-logger");

module.exports = function() {
    return function(err, req, res, next) {
        logger.error(err);
        res.status(500).json({ name: "SERVER_ERROR", message: err.message });
    }
}
