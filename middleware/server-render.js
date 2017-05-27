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

module.exports = function(dirname, host, port) {
    var fetchFn = fetchMiddleware.createFetch(host, port);
    // return function(appName, request, response, opt) {
    var serverRender = function(fn, transmit) {
        return function(request, response) {
            var render = response.render.bind(response);
            response.render = serverRenderFn;
            fn(request, response)

            function serverRenderFn(appName, dft) {
                var appPath = P.resolve(dirname, "dist", appName);
                var App = require(appPath);
                var fetchData = {};
                if (transmit) {
                    fetchData["$init"] = { name: "$init", url: request.originalUrl }
                }
                swapAndRender(App, fetchData, request, response).then(function() {
                    return serverFetch(fetchData, fetchFn, request, response);
                }).then(function(res) {
                    return swapAndRender(App, fetchData, request, response);
                }).then(function(html) {
                    var opt = pickOpt(fetchData, dft)
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
        }
    }
    return serverRender;
}

function pickOpt(fetchData, dft) {
    var opt = {
        title: _.get(fetchData, "$init.data.$title", null),
        meta: _.get(fetchData, "$init.data.$meta", []),
    }
    delete fetchData["$init"]
    opt.init = { fetchData: fetchData }
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
    if (!list.length) {
        return Promise.resolve(null);
    }
    var query = _(list).map(function(item) {
        return [item.name, item.url];
    }).fromPairs().value();
    return new Promise(function(resolve, reject) {
        fetchFn(query, request, response, function(err, res) {
            if (err) {
                return reject(err);
            }
            _.keys(res).map(function(name) {
                fetchData[name].data = res[name];
            });
            // 对于$init特殊处理,打平到fetchData里
            _.toPairs(_.get(fetchData, "$init.data")).map(function(pair) {
                if (pair[0][0] != "$") {
                    fetchData[pair[0]] = { name: pair[0], data: pair[1] }
                }
            });
            // 同时将数据同步到ev上
            _.toPairs(fetchData).map(function(pair) {
                ev.env[pair[0]] = pair[1].data
            });
            return resolve(res);
            // fn(null, res);
        });
    })
}
