var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("lodash");
var ev = require("../ev");

if (global.window) {
    var init = window.__INITIAL_STATE__ || {};
    ev.fetchData = init.ev;
    // 用fetchData初始化env
    ev.env = _(ev.fetchData).values().map(function(item) {
        return [item.name, item.data];
    }).fromPairs().value();
}

exports.createApp = function(reactClass) {
    function __CREATE_APP__(initState) {
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
    return __CREATE_APP__;
}
