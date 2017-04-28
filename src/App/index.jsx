var ev = require("yy-fe/ev");
var React = require("react");
var ReactDOM = require("react-dom");
var ReactRouter = require("react-router");
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var browserHistory = ReactRouter.browserHistory;
var IndexRoute = ReactRouter.IndexRoute;
var Link = ReactRouter.Link;
require("./style.less");

function AppClass() {
    this.getInitialState = function() {
        return {};
    }
    this.render = function() {
        return jade(`
        div
            Link(to="/") Index
            Link(to="/about") About
            |{this.props.children}`);
    };
}

function IndexClass() {
    this.fetch = ev.createFetch();
    this.getInitialState = function() {
        return { fetch: this.fetch("fetch", "/fetch-data") || {} };
    }
    this.render = function() {
        return jade(`
        h1 Index {this.state.fetch.status}`);
    };
}

function AboutClass() {
    this.fetch = ev.createFetch();
    this.getInitialState = function() {
        return { fetch2: this.fetch("fetch2", "/fetch-data2") || {} };
    }
    this.render = function() {
        return jade(`
        h1 About {this.state.fetch2.status}`);
    };
}

var App = React.createClass(new AppClass());
var Index = React.createClass(new IndexClass());
var About = React.createClass(new AboutClass());
// var app = React.createElement(App);

var route = jade(`
Router(history={browserHistory})
    Route(path="/" component={App})
        IndexRoute(component={Index})
        Route(path="/about" component={About})
    `);
module.exports = route;
// ReactDOM.render(route, document.getElementById('container'));
