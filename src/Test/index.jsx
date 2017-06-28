var React = require("react");
var ev = require("yy-fe/ev");
require("./style.less");

function Test() {
    this.render = function() {
        return jade(`
        div(className="test" onMouse)
            `);
    }
}

module.exports = React.createClass(new Test())
