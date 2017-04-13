var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("lodash");
var ev = require("yy-fe/ev"); // 这里极其特殊，因为这个文件是通过分发出去的，路径不在这里

var App = require(".");
renderToTemp(App);
browserFetch(function(err, res) {
    if (err) {
        window.alert("加载错误");
    } else {
        var app = React.createElement(App);
        ReactDOM.render(app, document.getElementById("container"));
    }
})

function renderToTemp(App) {
    var app = React.createElement(App);
    var tempNode = document.createElement("div");
    ReactDOM.render(app, tempNode);
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
        return [item.name, item.url].join("=");
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

// ReactDOM.render(app, document.getElementById("container"));
// fetchLoop(function(app) {
//     ReactDOM.render(app, document.getElementById("container"));
// })

// function fetchLoop(fn) {
//     var app = React.createElement(App);
//     ev.doBrowserFetch(function(err, res) {
//         if (err) {
//             // 出错了
//             console.error(err);
//         } else if (res) {
//             // 可能还有数据
//             fetchLoop(fn);
//         } else {
//             // 完成数据初始化
//             fn(app);
//         }
//     })
// }

// ev.doBrowserFetch = function(fn) {
//     var localFetchData = fetchData; // 通过闭包保存一下
//     var that = this;
//     var list = _(localFetchData).values().filter(function(item) {
//         return item.data === undefined;
//     }).value();
//     if (!list.length) {
//         fn(null, null);
//         return null;
//     }
//     fetch.browser(list, function(err, res) {
//         if (err) {
//             return fn(err, res);
//         }
//         _.keys(res).map(function(name) {
//             localFetchData[name].data = res[name];
//             // that.env[name] = res[name]; // 通过get可以拿到
//         });
//         fn(null, res);
//     })
//     return list;
// };
