function concat(a1, a2) {
    var ret = [];
    for (var i = 0; i < a1.length; i++) {
        ret.push(a1[i]);
    }
    for (var i = 0; i < a2.length; i++) {
        ret.push(a2[i]);
    }
    return ret;
}

module.exports = {
    concat: concat,
}
