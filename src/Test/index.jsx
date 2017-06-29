var React = require("react");
var ev = require("yy-fe/ev");
require("./style.less");

function Test() {
    this.render = function() {
        return jade(`
        div(className="test")
            ul
                li 1
                li 2
            div(className="r1") hello
            div(className="r2") world
            `);
    }
}

module.exports = React.createClass(new Test())
