var React = require("react");
var App = require("../../App");
var ev = require("yy-fe/ev");
require("./style.less");

function SubClass() {
    this.getInitialState = function() {
        return { fetchSub: ev.fetch("fetchSub", "/fetch-data2") || {} };
    }
    this.render = function() {
        return jade(`h3 Sub {this.state.fetchSub.status}`);
    }
}

var Sub = React.createClass(new SubClass());

function TestClass() {
    this.getInitialState = function() {
        return { fetch: ev.fetch("fetch", "/fetch-data") || {} };
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
            // |{this.renderSub()}
            `);
    }
}

var Test = React.createClass(new TestClass())
module.exports = App.createApp(Test);
