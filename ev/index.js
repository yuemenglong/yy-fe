var EventEmitterEx = require("./event");
var util = require("util");

function createRoot() {
    var ev = new EventEmitterEx();
    var fetchData = {}; // name, url, data, cb
    var window = global.window || {};

    ev.createFetch = function() {
        return function(name, url, fn) {
            if (typeof this.setState !== "function") {
                throw Error("Fetch Function Must Bind To React Element");
            }
            var that = this;

            function cb(res) {
                var state = {};
                state[name] = res;
                ev.env[name] = res;
                that.setState(state);
                fn && fn(res);
            }
            if (!fetchData[name]) {
                fetchData[name] = {
                    name: name,
                    url: url,
                    data: undefined,
                    cb: cb,
                }
                return null;
            } else if (fetchData[name].data !== undefined) {
                // 已经处理过的
                return fetchData[name].data;
            } else if (fetchData[name].cb === undefined) {
                // 服务端传来客户端还未处理
                fetchData[name].cb = cb;
                return null;
            } else if (fetchData[name].url != url) {
                // 重复注册且冲突的
                var err = util.format("Same Name [%s] With Different Url [%s, %s]", name, fetchData[name].url, url);
                // throw Error(`Same Name [${name}] With Different Url [${fetchData[name].url}, ${url}]`)
                throw Error(err)
            } else {
                return null;
            }
        }
    }
    ev.clearFetch = function(name) {
        for(var i in arguments){
            // delete fetchData[name];
            delete fetchData[arguments[i]]
        }
    }
    ev.updateFetch= function(name, value){
        if(!fetchData[name]){
            throw new Error("No Such Fetch Data When Upate: " + name)
        }
        fetchData[name].data = value
    }

    ev.getFetchData = function() {
        return fetchData;
    }
    ev.setFetchData = function(data) {
        var ret = fetchData;
        fetchData = data;
        return ret;
    }
    ev.window = function() {
        return window;
    }
    ev.setWindow = function(win) {
        var ret = window;
        window = win;
        return ret;
    }
    return ev;
}

var root = createRoot();

module.exports = root;
