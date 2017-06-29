var React = require("react");
var _ = require("lodash");
require("./style.less");

function NavTabClass() {
    this.getInitialState = function() {
        return { active: 0 }
    }
    this.getComponentWillMount = function() {
        if (!this.props.header || !this.props.body) {
            throw new Error("No Header / Body")
        }
        if (this.props.header.length != this.props.body.length) {
            throw new Error("Header & Body Length Not Match")
        }
    }
    this.onMouseEnter = function(i) {
        this.setState({ active: i })
    }
    this.renderHeaders = function() {
        return this.props.header.map(function(h, i) {
            var props = {
                key: i,
                onMouseEnter: this.onMouseEnter.bind(null, i),
                className: this.state.active == i ? "active" : "",
            }
            return jade(`li({...props}) {h}`)
        }.bind(this))
    }
    this.renderBody = function() {
        return this.props.body[this.state.active];
    }
    this.render = function() {
        var className = ["yy-nav-tabs", this.props.className].filter(function(item) {
            return !!item;
        }).join(" ");
        return jade(`
        div(id={this.props.id} className={className})
            ul(className="header")
                |{this.renderHeaders()}
            div(className="body")
                |{this.renderBody()}
            `)
    }
}

module.exports = React.createClass(new NavTabClass())
