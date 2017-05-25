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
var fetchMiddleware = fe.middleware.fetch;
var serverRenderMiddleware = fe.middleware.serverRender;

var transmit = transmitMiddleware("localhost", 8080);
var fetch = fetchMiddleware("localhost", 8080);
var serverRender = serverRenderMiddleware(__dirname, "localhost", 8080);

var app = express();
app.set('views', __dirname + '/jade');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use('/bundle', express.static(__dirname + '/bundle'));
app.use('/static', express.static(__dirname + '/static'));
app.use("/upload", uploadMiddleware("static/files"));
app.use(fetch); // fetch接口依赖的数据不需要transmit了,可能绕过权限
app.use(bodyParser.json());
app.use(transmit);
app.use(serverRender);
app.use(loggerMiddleware());
app.use(errorMiddleware());

process.on("uncaughtException", function(err) {
    logger.error(JSON.stringify(err.stack));
})

app.get("/test", function(req, res) {
    res.render("Test", { title: "yy-fe-测试" });
})

app.get("/*", function(req, res) {
    res.render("App", { title: "yy-fe-测试" });
})

serverRender.transmit("/")

app.listen(80, function(err) {
    if (err) {
        logger.error(JSON.stringify(err));
    } else {
        logger.log(`Start Web Server On [80] Succ .....`);
    }
});

var be = express();
be.use(loggerMiddleware());
be.get("/", function(req, res) {
    res.json({ "$title": "PageTitle", "$meta": [{ content: "ISO-9001" }], pageData: "Load Page Succ" });
})
be.get("/fetch-data", function(req, res) {
    res.json({ status: "succ" });
})
be.get("/fetch-data2", function(req, res) {
    res.json({ status: "succ2" });
})
be.get("/fetch-data3", function(req, res) {
    res.json({ status: "succ3" });
})
be.listen(8080, function(err) {
    if (err) {
        logger.error(JSON.stringify(err));
    } else {
        logger.log(`Start Backend Server On [8080] Succ ....`);
    }
})
