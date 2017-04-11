var React = require("react");
var renderToStaticMarkup = require('react-dom/server').renderToStaticMarkup;
var ev = require("../ev");
var P = require("path");
var logger = require("yy-logger");
var fetchMiddleware = require("../middleware/fetch");

module.exports = function(dirname, host, port) {
    var fetchFn = fetchMiddleware.createFetch(host, port);
    // return function(appName, request, response, opt) {
    return function(request, response, next) {
        var render = response.render.bind(response);
        response.render = function(appName, opt) {
            var appPath = P.resolve(dirname, "dist", appName);
            var App = require(appPath);
            if (App.name == "__CREATE_APP__") {
                App = App();
            }
            var app = React.createElement(App);
            // ev.doServerFetch = function(request, response, fetchFn, fn) 
            ev.doServerFetch(request, response, fetchFn, function(err, res) {
                if (err) {
                    logger.error(JSON.stringify(err.stack));
                    response.status(500).json(JSON.parse(JSON.stringify(err)));
                } else {
                    var html = renderToStaticMarkup(app);
                    opt.html = html;
                    render(appName, opt)
                }
            });
        }
        next();
        // return renderToStaticMarkup(app);
    }
}

// serverRender( req, res, "Test",{title:"asdf"});
