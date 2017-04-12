var EventEmitterEx = require("./event");
var fetch = require("./fetch");
var _ = require("lodash");

function createRoot() {
    var ev = new EventEmitterEx();
    var fetchData = {};

    ev.fetch = function(name, url) {
        console.log(name, url);
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
