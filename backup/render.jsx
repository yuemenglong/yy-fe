var React = require("react");
var Select = require("/element/Select");
var Chosen = require("/element/Chosen");
var DatePicker = require("/element/DatePicker");
var DateTimePicker = require("/element/DateTimePicker");
var CheckGroup = require("/element/CheckGroup");
var CheckMulti = require("/element/CheckMulti");
var DateTime = require("/element/DateTime");
var InputPhone = require("/element/InputPhone");
var kit = require("./kit");
require("./less/validate-style.less");

function transformToList(args) {
    if (_.isArray(args)) {
        return args;
    }
    return _.keys(args).map(function(key) {
        return {
            value: key,
            option: args[key]
        };
    })
}

function objectByEvent(e) {
    if (e.target.type == "checkbox") {
        return _.zipObject([e.target.name], [e.target.checked]);
    }
    return _.zipObject([e.target.name], [e.target.value]);
}

function objectByProps(props) {
    if (_.keys(props).length != 1) {
        throw new Error("Invalid Props", props);
    }
    return props;
}

function getChangeKV(arg) {
    if (arg.constructor.name == "SyntheticEvent" ||
        _.get(arg, "target.name")) {
        var kv = objectByEvent(arg);
    } else if (_.isPlainObject(arg)) {
        var kv = objectByProps(arg);
    } else {
        throw new Error("Unknown Arg", arg);
    }
    return kv;
}

function createOnChangeState(path) {
    return function(arg) {
        var kv = getChangeKV(arg);
        var key = _.keys(kv)[0];
        var statepath = [path.replace(/^state\.?/, ""), key]
            .filter(o => !!o).join(".")
            // .replace(".[", "[").replace("].", "]");
        var newState = _.cloneDeep(this.state);
        _.set(newState, statepath, kv[key]); //只能set不能merge
        kit.debug("SET_STATE", newState);
        this.setState(newState);
    }
}

function createOnChangeProps(path) {
    return function(arg) {
        var kv = getChangeKV(arg);
        var key = _.keys(kv)[0];
        var propsKey = path.replace(/^props\.?/, "")
            // .replace(".[", "[").replace("].", "]");
        var propsValue = _.cloneDeep(_.get(this, path));
        _.set(propsValue, key, kv[key]);
        var props = _.zipObject([propsKey], [propsValue]);
        kit.debug("POP_PROPS", props);
        this.props.ev && this.props.ev.event(props);
    }
}

function createRenderInput(path, opt) {
    if (!/^(props(\..+)?)|(state(\..+)?)/.test(path)) {
        throw new Error("Invalid Path, Must Start With props/state");
    }
    opt = opt || {};

    function getClassName(name, value, obj, className) {
        var reqr = opt.reqr;
        var validate = _.get(this, "props.validate") || _.get(this, "state.validate");
        if (!reqr || !validate) {
            return className;
        }
        var fn = _.get(reqr, name);
        if (!fn) {
            return className;
        }
        if (fn(value, obj) == null) {
            return className;
        }
        return className ? [className, "cch-invalid"].join(" ") : "cch-invalid";
    }

    function onChangeFn(arg) {
        opt.onPreChange && opt.onPreChange.call(this, arg);
        if (path.startsWith("props")) {
            createOnChangeProps(path).call(this, arg);
        } else if (path.startsWith("state")) {
            createOnChangeState(path).call(this, arg);
        } else {
            throw new Error("Path Must Start With Props/State");
        }
        opt.onPostChange && opt.onPostChange.call(this, arg);
    }

    return function(type, name, args, className, props) {
        var fullPath = [path, name].join(".");
        // .replace(".[", "[").replace("].", "]");
        var value = _.get(this, fullPath);
        var disabled = _.get(this, "props.disabled") || _.get(this, "state.disabled");
        var onChange = (opt.onChange || onChangeFn).bind(this);
        var obj = _.get(this, path);
        props = _.merge({
            disabled: disabled,
            name: name,
            //
            className: getClassName.call(this, name, value, obj, className),
            value: value,
            onChange: onChange,
            onKeyPress: this.onKeyPress,
            onFocus: this.onFocus,
            onBlur: this.onBlur,
            // style: style,
        }, props);
        if (type == "text") {
            return jade(`input(type="text" placeholder={args} {...props})`);
        } else if (type == "password") {
            return jade(`input(type="password" placeholder={args} {...props})`);
        } else if (type == "hidden") {
            return jade(`input(type="hidden" placeholder={args} {...props})`);
        } else if (type == "textarea") {
            return jade(`textArea(placeholder={args} {...props})`);
        } else if (type == "select") {
            return jade(`Select(list={transformToList(args)} {...props})`);
        } else if (type == "chosen") {
            return jade(`Chosen(list={transformToList(args)} {...props})`);
        } else if (type == "checkbox") {
            return jade(`input(type="checkbox" checked={props.value} {...props})`);
        } else if (type == "checkgroup") {
            return jade(`CheckGroup(list={transformToList(args)} {...props})`);
        } else if (type == "checkmulti") {
            return jade(`CheckMulti(list={transformToList(args)} {...props})`);
        } else if (type == "date") {
            return jade(`DatePicker(placeholder={args} {...props})`);
        } else if (type == "datetime") {
            return jade(`DateTimePicker(placeholder={args} {...props})`);
        } else if (type == "phone") {
            return jade(`InputPhone(placeholder={args} {...props})`);
        } else {
            throw new Error("Unknown Type: " + type);
        }
    }
}

function createRenderDisabled(path) {
    return function(name, className) {
        var fullPath = [path, name].join(".");
        var value = _.get(this, fullPath);
        var props = { disabled: true, value: value, className: className };
        return jade(`input(type="text" {...props})`);
    }
}

exports.createRenderInput = createRenderInput;
exports.createRenderDisabled = createRenderDisabled;
exports.createOnChangeProps = createOnChangeProps;
exports.createOnChangeState = createOnChangeState;
