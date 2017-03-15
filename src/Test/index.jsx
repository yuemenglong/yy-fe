var React = require("react");

function Test() {
    this.render = function() {
        return jade(`h1 hello world!`);
    }
}

module.exports = React.createClass(new Test());
