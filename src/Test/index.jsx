var React = require("react");
var ev = require("yy-fe/ev");
var icon = require("./lib/quit.png")
var data = require("./lib/data.json")
require("/Test/lib/index")
require("./style.less");

function ThirdClass() {
    this.fetch = ev.createFetch();
    this.getInitialState = function() {
        return { fetchThird: this.fetch("fetchThird", "/fetch-data3") || {} };
    }
    this.render = function() {
        return jade(`h5 Third {this.state.fetchThird.status}`);
    }
}
var Third = React.createClass(new ThirdClass());

function SecondClass() {
    this.fetch = ev.createFetch();
    this.getInitialState = function() {
        return { fetchSecond: this.fetch("fetchSecond", "/fetch-data2") || {} };
    }
    this.renderThird = function() {
        if (!this.state.fetchSecond.status) {
            return;
        }
        return jade(`Third`);
    }
    this.render = function() {
        return jade(`
        div
            h3 Second {this.state.fetchSecond.status}
            |{this.renderThird()}
            `);
    }
}
var Second = React.createClass(new SecondClass());

function FirstClass() {
    this.fetch = ev.createFetch();
    this.getInitialState = function() {
        return { fetch: this.fetch("fetch", "/fetch-data") || {} };
    }
    this.renderSecond = function() {
        return jade(`Second`);
    }
    this.render = function() {
        return jade(`
        div
            pre {JSON.stringify(ev, null, 2)}
            h1 Test {this.state.fetch.status}
            |{this.renderSecond()}
            `);
    }
}

module.exports = React.createClass(new FirstClass())
