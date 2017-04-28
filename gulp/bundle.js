var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("lodash");
var ev = require("yy-fe/ev"); // 这里极其特殊，因为这个文件是通过分发出去的，路径不在这里

if (global.window) {
    $.ajaxSetup({ contentType: "application/json; charset=utf-8" });
    // 前端渲染使用
    var init = window.__INITIAL_STATE__ || {};
    // 用fetchData初始化ev
    ev.setFetchData(init.ev || {});
    // 同时初始化env
    ev.env = _(ev.getFetchData()).values().map(function(item) {
        return [item.name, item.data];
    }).fromPairs().value();

    var App = require(".");
    var app = createApp(App);
    ReactDOM.render(app, document.getElementById("container"));
    fetchLoop();
}

function createApp(App) {
    if (typeof App == "function") {
        return React.createElement(App);
    } else {
        return App;
    }
}

function fetchLoop() {
    browserFetch(function(err, res) {
        if (err) {
            window.alert("加载错误");
        } else if (res) {
            fetchLoop();
        } else {
            setTimeout(fetchLoop, 1000);
        }
    })
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
    return $.ajax({
        url: url,
        type: "GET",
        success: function(res) {
            _.keys(res).map(function(name) {
                fetchData[name].data = res[name];
                fetchData[name].cb(res[name]);
            })
            fn(null, res);
        },
        error: function(err) {
            fn(err, null);
        },
    })
}
