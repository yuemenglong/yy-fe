var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("lodash");
var ev = require("yy-fe/ev"); // 这里极其特殊，因为这个文件是通过分发出去的，路径不在这里

if (global.window) {
    var App = require(".");
    var App = createApp(App);
    var tempNode = renderToTemp(App);
    browserFetch(function(err, res) {
        ReactDOM.unmountComponentAtNode(tempNode);
        if (err) {
            window.alert("加载错误");
        } else {
            var app = React.createElement(App);
            ReactDOM.render(app, document.getElementById("container"));
        }
    })
}

function createApp(reactClass) {
    if (global.window) {
        var init = window.__INITIAL_STATE__ || {};
        // 用fetchData初始化ev
        ev.setFetchData(init.ev || {});
        // 同时初始化env
        ev.env = _(ev.getFetchData()).values().map(function(item) {
            return [item.name, item.data];
        }).fromPairs().value();
    }

    function AppClass() {
        this.getDefaultProps = function() {
            // 保证最先执行到
            if (global.window && global.$) {
                $.ajaxSetup({ contentType: "application/json; charset=utf-8" });
            }
            return {};
        }
        this.getInitialState = function() {
            // state = state || {};
            var state = _.defaults({ ev: ev }, init);
            ev.on(ev.EVENT_TYPE, this.onChange);
            return state;
        }
        this.onChange = function(props) {
            this.setState(props);
        }
        this.render = function() {
            return React.createElement(reactClass, this.state);
        }
    }
    return React.createClass(new AppClass());
}


function renderToTemp(App) {
    var app = React.createElement(App);
    var tempNode = document.createElement("div");
    ReactDOM.render(app, tempNode);
    return tempNode;
}

function browserFetch(fn) {
    var fetchData = ev.getFetchData();
    var list = _.values(fetchData).filter(function(item) {
        return item.data === undefined;
    });
    if (!list.length) {
        return fn(null, null);
    }
    var search = list.map(function(item) {
        return [item.name, encodeURIComponent(item.url)].join("=");
    }).join("&");
    var url = "/fetch?" + search;
    $.ajax({
        url: url,
        type: "GET",
        success: function(res) {
            _.keys(res).map(function(name) {
                fetchData[name].data = res[name];
            })
            fn(null, res);
        },
        error: function(err) {
            fn(err, null);
        },
    })
}

module.exports.createApp = createApp;
