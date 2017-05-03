var EventEmitterEx = require("./event");

function createRoot() {
    var ev = new EventEmitterEx();
    var fetchData = {};
    var window = global.window || {};

    ev.createFetch = function() {
        return function(name, url) {
            if (typeof this.setState !== "function") {
                throw Error("Fetch Function Must Bind To React Element");
            }
            var that = this;

            function cb(res) {
                var state = {};
                state[name] = res;
                ev.env[name] = res;
                that.setState(state);
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
                throw Error(`Same Name [${name}] With Different Url [${fetchData[name].url}, ${url}]`)
            } else {
                return null;
            }
        }
    }
    ev.clearFetch = function(name) {
        delete fetchData[name];
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
