var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("lodash");
var ev = require("../ev");

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
                var state = global.window ? window.__INITIAL_STATE__ : initState;
                state = state || {};
                var state = _.merge({ ev: ev }, state);
                state.ev.on(ev.EVENT_TYPE, this.onChange);
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
