var EventEmitterEx = require("./event");
var fetch = require("./fetch");
var _ = require("lodash");

function createRoot() {

    var ev = new EventEmitterEx();
    ev.fetchData = {};
    ev.fetch = function(name, url) {
        if (!this.fetchData[name]) {
            this.fetchData[name] = {
                name: name,
                url: url,
                data: undefined,
            }
        } else if (this.fetchData[name].url != url) {
            throw Error(`Same Name [${name}] With Different Url [${this.fetchData[name].url}, ${url}]`)
        }
    }

    ev.doBrowserFetch = function(fn) {
        var that = this;
        var list = _(that.fetchData).values().filter(function(item) {
            return item.data === undefined;
        }).value();
        if (!list.length) {
            fn(null, null);
            return null;
        }
        fetch.browser(list, function(err, res) {
            if (err) {
                return fn(err, res);
            }
            _.keys(res).map(function(name) {
                that.fetchData[name].data = res[name];
                that.env[name] = res[name]; // 通过get可以拿到
            });
            fn(null, res);
        })
        return list;
    };

    ev.doServerFetch = function(request, response, fetchFn, fn) {
        var that = this;
        var list = _(that.fetchData).values().filter(function(item) {
            return item.data === undefined;
        }).value();
        if (!list.length) {
            fn(null, null);
            return null;
        }
        fetch.server(list, request, response, fetchFn, function(err, res) {
            if (err) {
                return fn(err, res);
            }
            _.keys(res).map(function(name) {
                that.fetchData[name].data = res[name];
                that.env[name] = res[name]; // 通过get可以拿到
            });
            fn(null, res);
        })
        return list;
    }
    return ev;
}


module.exports = createRoot();
module.exports.createRoot = createRoot;
