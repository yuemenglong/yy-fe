var React = require("react");
var ev = require("yy-fe/ev");
require("./style.less");
var PIC = require("./small.png")

function Test() {
    this.render = function() {
        var props = {
            style: {
                backgroundImage: "url('" + PIC + "')",
            }
        }
        return jade(`
        div
            div(className="test" {...props})
            div(className="test2")
            `);
    }
}

module.exports = React.createClass(new Test())
