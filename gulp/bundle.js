var React = require("react");
var ReactDOM = require("react-dom");
var ev = require("yy-fe/ev"); // 这里极其特殊，因为这个文件是通过分发出去的，路径不在这里

var App = require(".");
if (App.name == "__CREATE_APP__") {
    App = App();
}
// var app = React.createElement(App);
// ReactDOM.render(app, document.getElementById("container"));
fetchLoop(function(app) {
    ReactDOM.render(app, document.getElementById("container"));
})

function fetchLoop(fn) {
    var app = React.createElement(App);
    ev.doBrowserFetch(function(err, res) {
        if (err) {
            // 出错了
            console.error(err);
        } else if (res) {
            // 可能还有数据
            fetchLoop(fn);
        } else {
            // 完成数据初始化
            fn(app);
        }
    })
}
