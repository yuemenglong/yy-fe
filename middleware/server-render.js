var React = require("react");
var Promise = require("bluebird");
var ev = require("../ev");
var P = require("path");
var URL = require("URL");
var logger = require("yy-logger");
var URL = require("URL");
var _ = require("lodash");
var ReactRouter = require("react-router");
var RouterContext = ReactRouter.RouterContext;
var match = ReactRouter.match;
var createRoutes = ReactRouter.createRoutes;
var fetchMiddleware = require("../middleware/fetch");
var renderToStaticMarkup = require('react-dom/server').renderToStaticMarkup;

var transmit = {}

module.exports = function(dirname, host, port) {
    var fetchFn = fetchMiddleware.createFetch(host, port);
    // return function(appName, request, response, opt) {
    var ret = function(request, response, next) {
        var render = response.render.bind(response);
        response.render = function(appName, opt) {
            var appPath = P.resolve(dirname, "dist", appName);
            var App = require(appPath);
            var fetchData = {};
            swapAndRender(App, fetchData, request, response).then(function() {
                return serverFetch(fetchData, fetchFn, request, response);
            }).then(function(res) {
                return swapAndRender(App, fetchData, request, response);
            }).then(function(html) {
                var opt = pickOpt(fetchData)
                opt.html = html;
                // opt.init = _.defaults({ ev: fetchData }, opt.init);
                return render(appName, opt)
            }).catch(function(err) {
                if (err.type == "REDIRECT") {
                    var redirect = err.redirect;
                    return response.redirect(redirect.pathname + redirect.search);
                } else if (err.type == "NOT_FOUND") {
                    return response.status(404).end();
                } else {
                    return response.status(500).json({ name: err.name, message: err.message, detail: err.detail });
                }
            });
        }
        next();
        // return renderToStaticMarkup(app);
    }
    ret.transmit = function(url) {
        transmit[url] = true;
    }
    return ret;
}

function pickOpt(fetchData, dft) {
    var opt = {
        title: _.get(fetchData, "$title.data", null),
        meta: _.get(fetchData, "$meta.data", []),
    }
    delete fetchData["$title"]
    delete fetchData["$meta"]
    opt.init = { ev: fetchData }
    return _.merge(opt, dft)
}

function swapAndRender(App, fetchData, request, response) {
    return Promise.try(function() {
        if (typeof App === "function") {
            // 原生react class
            var app = React.createElement(App);
            return Promise.resolve(app);
        } else {
            // 前端路由
            var routes = createRoutes(App);
            return new Promise(function(resolve, reject) {
                var location = request.originalUrl;
                match({ routes, location }, function(err, redirect, props) {
                    if (err) {
                        reject(err);
                    } else if (redirect) {
                        reject({ type: "REDIRECT", redirect: redirect });
                    } else if (props) {
                        var routeCtx = React.createElement(RouterContext, props);
                        resolve(routeCtx);
                    } else {
                        reject({ type: "NOT_FOUND" });
                    }
                })
            })
        }
    }).then(function(app) {
        var backupFetchData = ev.setFetchData(fetchData);
        var html = renderToStaticMarkup(app);
        ev.setFetchData(backupFetchData);
        return html;
    })
}

function serverFetch(fetchData, fetchFn, request, response, fn) {
    var that = this;
    var list = _(fetchData).values().filter(function(item) {
        return item.data === undefined;
    }).value();
    var query = _(list).map(function(item) {
        return [item.name, item.url];
    }).fromPairs().value();
    // 加入本来这个页面的fetch
    if (transmit[request.path]) {
        query["$init"] = request.originalUrl;
    }
    if (!_.keys(query).length) {
        return Promise.resolve(null);
    }
    return new Promise(function(resolve, reject) {
        fetchFn(query, request, response, function(err, res) {
            if (err) {
                return reject(err);
            }
            _.keys(res).map(function(name) {
                if ("$init" == name) {
                    // 打平存入fetchData，因为下一次渲染要使用
                    _.toPairs(res[name]).map(function(pair) {
                        fetchData[pair[0]] = { data: pair[1] }
                    })
                } else {
                    fetchData[name].data = res[name];
                }
            });
            return resolve(res);
            // fn(null, res);
        });
    })
}
