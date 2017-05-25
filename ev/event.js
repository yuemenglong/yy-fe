var EventEmitter = require("events").EventEmitter;
var _ = require("./lodash");

var counter = 0;
var EVENT_TYPE = "@@EVENT";
var globalHookFn = function() {
    console.log([].slice.call(arguments));
};

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
    if (!global.window) return this;
    EventEmitter.prototype.on.apply(this, arguments);
    return this;
}

//等价于emit(@@EVENT, ...)
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

EventEmitterEx.prototype.get = function(key) {
    return this.env[key];
    // if (this.env[key] === undefined) {
    //     if (dft === undefined) {
    //         throw Error(`Can't Get [${key}] From Ev, Maybe Need A Default Value`);
    //     } else {
    //         return dft;
    //     }
    // } else {
    //     return this.env[key];
    // }
}

module.exports = EventEmitterEx;
