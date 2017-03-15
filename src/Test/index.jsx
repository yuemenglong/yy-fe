var React = require("react");
var App = require("../../App");
var ev = require("../../ev");
require("./style.less");

function TestClass() {
    this.render = function() {
        return jade(`h1 hello world!`);
    }
}

var Test = React.createClass(new TestClass())
module.exports = App.createApp(Test);
