var React = require("react");
var renderToStaticMarkup = require('react-dom/server').renderToStaticMarkup;
var ev = require("../ev");
var P = require("path");
var logger = require("yy-logger");
var fetchMiddleware = require("../middleware/fetch");
var URL = require("URL");
var createApp = require("../gulp/bundle").createApp;
var _ = require("lodash");

module.exports = function(dirname, host, port) {
    var fetchFn = fetchMiddleware.createFetch(host, port);
    // return function(appName, request, response, opt) {
    return function(request, response, next) {
        var render = response.render.bind(response);
        response.render = function(appName, opt) {
            var appPath = P.resolve(dirname, "dist", appName);
            var App = require(appPath);
            var App = createApp(App);
            var fetchData = {};
            var win = buildWindow(request, response);
            swapAndRender(fetchData, win, App);
            // ev.doServerFetch = function(request, response, fetchFn, fn) 
            serverFetch(request, response, fetchData, fetchFn, function(err, res) {
                if (err) {
                    logger.error(JSON.stringify(err.stack));
                    response.status(500).json(err);
                } else {
                    opt.html = swapAndRender(fetchData, win, App);
                    opt.init = _.defaults({ ev: fetchData }, opt.init);
                    render(appName, opt)
                }
            });
        }
        next();
        // return renderToStaticMarkup(app);
    }
}

function buildWindow(request, response) {
    var location = URL.parse(request.originalUrl);
    return { location: location };
}

function swapAndRender(fetchData, win, App) {
    var backupFetchData = ev.setFetchData(fetchData);
    var backupWindow = ev.setWindow(win);
    var app = React.createElement(App);
    var html = renderToStaticMarkup(app);
    ev.setFetchData(backupFetchData);
    ev.setWindow(backupWindow);
    return html;
}

function serverFetch(request, response, fetchData, fetchFn, fn) {
    var that = this;
    var list = _(fetchData).values().filter(function(item) {
        return item.data === undefined;
    }).value();
    if (!list.length) {
        fn(null, null);
        return;
    }
    var query = _(list).map(function(item) {
        return [item.name, item.url];
    }).fromPairs().value();
    fetchFn(query, request, response, function(err, res) {
        if (err) {
            return fn(err, res);
        }
        _.keys(res).map(function(name) {
            fetchData[name].data = res[name];
            // that.env[name] = res[name]; // 通过get可以拿到
        });
        fn(null, res);
    });
}
