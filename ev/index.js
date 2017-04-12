var EventEmitterEx = require("./event");
var fetch = require("./fetch");
var _ = require("lodash");

function createRoot() {
    var ev = new EventEmitterEx();
    var fetchData = {};

    ev.fetch = function(name, url) {
        if (!fetchData[name]) {
            fetchData[name] = {
                name: name,
                url: url,
                data: undefined,
            }
            return null;
        } else if (fetchData[name].url != url) {
            throw Error(`Same Name [${name}] With Different Url [${fetchData[name].url}, ${url}]`)
        } else if (fetchData[name].data !== undefined) {
            return fetchData[name].data;
        } else {
            return null;
        }
    }

    ev.doBrowserFetch = function(fn) {
        var localFetchData = fetchData; // 通过闭包保存一下
        var that = this;
        var list = _(localFetchData).values().filter(function(item) {
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
                localFetchData[name].data = res[name];
                // that.env[name] = res[name]; // 通过get可以拿到
            });
            fn(null, res);
        })
        return list;
    };

    ev.getFetchData = function() {
        return fetchData;
    }
    ev.setFetchData = function(data) {
        var ret = fetchData;
        fetchData = data;
        return ret;
    }
    return ev;
}

var root = createRoot();

module.exports = root;
