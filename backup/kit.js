var _ = require("lodash");
var Alert = require("/element/Alert");
var Loading = require("/element/Loading");


exports.keyObject = function(obj) {
    if (obj == undefined) {
        return { _key: Math.random() };
    }
    if (_.isPlainObject(obj) && !obj._key) {
        obj._key = Math.random();
    }
    return recursive(obj);

    function recursive(obj) {
        if (_.isPlainObject(obj)) {
            for (var name in obj) {
                recursive(obj[name]);
            }
        } else if (_.isArray(obj)) {
            obj.map(function(item) {
                recursive(item);
                if (!item._key) {
                    item._key = Math.random();
                }
            })
        }
        return obj;
    }
}

exports.getOrderId = function() {
    var url = window.location.href;
    var match = url.match(/.*\/(?:order|advice|profit-order|problematic-order|daily-settle-personal)\/([^\/#?]+)/);
    return match && match[1];
}


exports.attachArgs = function(obj, init) {
    var args = init || {};
    obj.args || (obj.args = function(value) {
        return _.merge(args, value);
    })
    return obj;
}

exports.errorHandler = function(res) {
    try {
        var message = JSON.parse(res.responseText).message;
    } catch (ex) {}
    message = message || "请求出错，请按F5刷新后重试";
    Alert(message);
}

exports.ajax = function(opt) {
    var loading = new Loading();
    $.ajax(_.defaults({
        success: function(res) {
            opt.success && opt.success(res);
            loading.hide();
        },
        error: function(res) {
            opt.error ? opt.error(res) : exports.errorHandler(res);
            loading.hide();
        }
    }, opt));
}

//删除指定字段
exports.clear = function(obj, keys) {
    var json = JSON.stringify(obj, function(key, value) {
        if (keys.indexOf(key) >= 0) {
            return undefined;
        } else {
            return value;
        }
    })
    return JSON.parse(json);
}

//复制指定字段
exports.copy = function(obj, keys) {
    var air = {};
    var key = "";
    for (key in obj) {
        if (keys.indexOf(key) >= 0) {
            air[key] = obj[key];
        }
    };
    return air;
}

exports.debug = function() {
    if (global.window && window._CCH_NO_DEBUG_ != true) {
        console.log.apply(console, arguments);
    }
}

exports.searchToFilter = function(search) {
    search = (search.match(/^\?(.+)/) || [])[1] || "";
    var filter = _(search).split("&").map(function(kv) {
        kv = kv.split("=");
        if (!kv[0] || !kv[1]) {
            return;
        }
        return [decodeURIComponent(kv[0]), decodeURIComponent(kv[1])];
    }).filter(_.isArray).fromPairs().value();
    return filter;
}
exports.filterToSearch = function(filter) {
    var search = _(filter).toPairs().map(function(kv) {
        if (!kv[1] && kv[1] != 0) return;
        return [encodeURIComponent(kv[0]), encodeURIComponent(kv[1])].join("=");
    }).join("&") || "";
    return "?" + search;
}

exports.openWindow = function(url) {
    var id = `link-${parseInt(Math.random() * 1000000)}`;
    var a = document.getElementById(id);
    if (!a) {
        a = document.createElement('a');
        document.body.appendChild(a);
    }
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.setAttribute('id', id);
    a.click();
}

exports.joinClassName = function(){
    return _.flattenDeep(arguments).join(" ")
}
