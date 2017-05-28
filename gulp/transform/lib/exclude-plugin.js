var clearNode = require("./common").clearNode;
var _ = require("lodash");

function ExcludePlugin(exclude) {
    if (!exclude) {
        exclude = [];
    }
    if (_.isPlainObject(exclude)) {
        // null 是需要打包进去的
        exclude = _.keys(exclude).filter(key => exclude[key] !== null);
    }
    //默认过滤less
    exclude.push(".*\\.less");
    //默认过滤以//开头的
    exclude.push("^//.*");
    exclude.push("^/.*");
    var pattern = "^((" + exclude.join(")|(") + "))$";
    this.test = new RegExp(pattern);
    this.transform = function(file, requireNodes) {
        requireNodes.map(clearNode);
    }
}

module.exports = ExcludePlugin;
