var EventEmitter = require("events").EventEmitter;
var fetch = require("./fetch");
var _ = require("lodash");

var globalHookFn = null;
var fetchData = {};

var counter = 0;
var EVENT_TYPE = "@@EVENT";

function EventEmitterEx(parent) {
    EventEmitter.call(this);
    this.parent = parent;
    if (parent) {
        this.id = [parent.id, counter].join(".");
        this.env = Object.create(parent.env);
    } else {
        this.id = counter;
        this.env = {};
    }
    counter++;
}

! function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}(EventEmitterEx, EventEmitter);

EventEmitterEx.prototype.EVENT_TYPE = EVENT_TYPE;

EventEmitterEx.prototype.fork = function(cb) {
    var ret = new EventEmitterEx(this);
    if (typeof cb == "function") {
        ret.on(EVENT_TYPE, cb);
    }
    return ret;
}

EventEmitterEx.prototype.hook = function(cb) {
    this.hookFn = cb;
}

EventEmitterEx.prototype.globalHook = function(cb) {
    if (!cb) {
        return globalHookFn;
    } else {
        globalHookFn = cb;
    }
}
EventEmitterEx.prototype.on = function(type, cb) {
    EventEmitter.prototype.on.apply(this, arguments);
    return this;
}

EventEmitterEx.prototype.event = function() {
    if (typeof arguments[0] == "function") {
        throw new Error("Event Not Support Fn, Please Call Fork Instead");
    }
    var args = _.concat([EVENT_TYPE], arguments);
    return this.emit.apply(this, args);
}

EventEmitterEx.prototype.emitSelf = function(type, action) {
    globalHookFn && globalHookFn.apply(null, arguments);
    this.hookFn && this.hookFn.apply(this, arguments);
    return EventEmitter.prototype.emit.apply(this, arguments);
}

EventEmitterEx.prototype.emitParent = function(type, action) {
    globalHookFn && globalHookFn.apply(null, arguments);
    this.hookFn && this.hookFn.apply(this, arguments);
    if (!this.parent) {
        return EventEmitter.prototype.emit.apply(this, arguments);
    } else {
        return EventEmitter.prototype.emit.apply(this.parent, arguments);
    }
}

EventEmitterEx.prototype.emitThrough = function(type, action) {
    if (this.listenerCount(type) > 0) {
        //1. has handler
        return this.emitSelf.apply(this, arguments);
    } else if (this.parent) {
        //2. has parent
        return this.emitThrough.apply(this.parent, arguments);
    } else {
        return this.emitSelf.apply(this, arguments);
    }
}

EventEmitterEx.prototype.emit = EventEmitterEx.prototype.emitSelf;

EventEmitterEx.prototype.set = function(key, value) {
    this.env[key] = value;
}

EventEmitterEx.prototype.get = function(key, dft) {
    if (this.env[key] === undefined) {
        if (dft === undefined) {
            throw Error(`Can't Get [${key}] From Ev, Maybe Need A Default Value`);
        } else {
            return dft;
        }
    } else {
        return this.env[key];
    }
}

EventEmitterEx.prototype.fetch = function(name, url) {
    if (!fetchData[name]) {
        fetchData[name] = {
            name: name,
            url: url,
            data: undefined,
        }
    } else if (fetchData[name].url != url) {
        throw Error(`Same Name [${name}] With Different Url [${fetchData[name].url}, ${url}]`)
    }
}

var ev = new EventEmitterEx();

ev.doBrowserFetch = function(fn) {
    var list = _(fetchData).values().filter(function(item) {
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
            fetchData[name].data = res[name];
            ev.env[name] = res[name]; // 通过get可以拿到
        });
        fn(null, res);
    })
    return list;
};

ev.doServerFetch = function(request, response, fetchFn, fn) {
    var list = _(fetchData).values().filter(function(item) {
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
            fetchData[name].data = res[name];
            ev.env[name] = res[name]; // 通过get可以拿到
        });
        fn(null, res);
    })
    return list;
}

ev.getFetchData = function() {
    return fetchData;
}

ev.setFetchData = function(data) {
    fetchData = data || {};
}

// ev.env = {};
ev.globalHook(function() {
    // kit.debug([].slice.call(arguments));
    console.log([].slice.call(arguments));
})

module.exports = ev;
