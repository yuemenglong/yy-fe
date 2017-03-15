var _ = require("lodash");
var express = require("express");
var logger = require("yy-logger");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var fe = require(".");

var transmitMiddleware = fe.middleware.transmit;
var uploadMiddleware = fe.middleware.upload;
var loggerMiddleware = fe.middleware.logger;
var errorMiddleware = fe.middleware.error;

var transmit = transmitMiddleware("localhost", 8080);

var app = express();
app.set('views', __dirname + '/jade');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use('/bundle', express.static(__dirname + '/bundle'));
app.use('/static', express.static(__dirname + '/static'));
app.use("/upload", uploadMiddleware("static/files"));
app.use(transmit);
app.use(bodyParser.json());
app.use(loggerMiddleware());
app.use(errorMiddleware());

process.on("uncaughtException", function(err) {
    logger.error(JSON.stringify(err.stack));
})

app.get("/", function(req, res) {
    res.render("Test", { title: "yy-fe-测试" });
})

app.listen(80, function(err) {
    if (err) {
        logger.error(JSON.stringify(err));
    } else {
        logger.log(`Start Web Server On [80] Succ .....`);
    }
});
