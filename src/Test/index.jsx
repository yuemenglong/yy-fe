var React = require("react");
var App = require("../../App");
var ev = require("yy-fe/ev");
require("./style.less");

function SubClass() {
    this.getDefaultProps = function() {
        ev.fetch("fetch-data2", "/fetch-data2");
        return {};
    }
    this.getInitialState = function() {
        return { data: ev.get("fetch-data2") };
    }
    this.render = function() {
        return jade(`h3 Sub`);
    }
}

var Sub = React.createClass(new SubClass());

function TestClass() {
    this.getDefaultProps = function() {
        ev.fetch("fetch-data", "/fetch-data");
        return {};
    }
    this.getInitialState = function() {
        return { "fetch-data": ev.get("fetch-data") };
    }
    this.renderSub = function() {
        if (!this.state["fetch-data"]) {
            return;
        }
        return jade(`Sub`);
    }
    this.render = function() {
        return jade(`
        div
            h1 Test
            |{this.renderSub()}`);
    }
}

var Test = React.createClass(new TestClass())
module.exports = App.createApp(Test);
