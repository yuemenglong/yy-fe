var React = require("react");
var App = require("../../App");
var ev = require("yy-fe/ev")();
require("./style.less");

function SubClass() {
    this.getDefaultProps = function() {
        ev.fetch("fetchSub", "/fetch-data2");
        return {};
    }
    this.getInitialState = function() {
        return { fetchSub: ev.get("fetchSub") };
    }
    this.render = function() {
        return jade(`h3 Sub {this.state.fetchSub.status}`);
    }
}

var Sub = React.createClass(new SubClass());

function TestClass() {
    this.getDefaultProps = function() {
        ev.fetch("fetch", "/fetch-data");
        return {};
    }
    this.getInitialState = function() {
        return { fetch: ev.get("fetch") };
    }
    this.renderSub = function() {
        if (!this.state.fetch) {
            return;
        }
        return jade(`Sub`);
    }
    this.render = function() {
        return jade(`
        div
            h1 Test {this.state.fetch.status}
            |{this.renderSub()}`);
    }
}

var Test = React.createClass(new TestClass())
module.exports = App.createApp(Test);
