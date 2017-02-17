var React = require("react");
var ReactDOM = require("react-dom");

var App = require(".");
if (App.name == "__CREATE_APP__") {
    App = App();
}
var app = React.createElement(App);

ReactDOM.render(app, document.getElementById("container"));
