var keys = [],
    slice = Array.prototype.slice,
    forEach = Array.prototype.forEach,
    globalFrom = 0,
    globalTo = 100;
for (var i = 97; i < 123; i++) {
    keys.push(String.fromCharCode(i));
}

function nothingReally(shouldAssign, from, to) {
    if (shouldAssign) {
        from = 11 << from;
        to = 11 << to;
    }
}
function createContextGetterSetter(nothing, myProp, from, to) {
    var myValue = {};
    var value = true;
    Object.defineProperty(myValue, myProp, {
        get: function () { return value; },
        set: function (newValue) { value = newValue; }
    });
    return {
        get: get,
        set: set
    };
    function get() {
        if (from !== globalFrom) {
            throw 'error from get';
        }
        if (to !== globalTo) {
            throw 'error to get';
        }
        if (typeof myProp !== 'string') {
            throw 'error myProp get';
        }
        if (typeof nothing !== 'function') {
            throw 'error nothing get';
        }
        nothing(myValue[myProp], from, to);
        return myValue[myProp];
    }
    function set(newValue) {
        if (from !== globalFrom) {
            throw 'error from set';
        }
        if (to !== globalTo) {
            throw 'error to set';
        }
        if (typeof myProp !== 'string') {
            throw 'error myProp set';
        }
        if (typeof nothing !== 'function') {
            throw 'error nothing set';
        }
        if (typeof newValue !== 'boolean') {
            throw 'error newValue set';
        }
        myValue[myProp] = newValue;
        nothing(myValue[myProp], from, to);
    }
}
function createFunctionGetterSetterSlice(nothing, myProp, from, to) {
    var myValue = {};
    var value = true;
    Object.defineProperty(myValue, myProp, {
        get: function () { return value; },
        set: function (newValue) { value = newValue; }
    });
    return {
        get: getterSlice(myValue, getter, nothing, myProp, from, to),
        set: setterSlice(myValue, setter, nothing, myProp, from, to)
    };
}
function createFunctionGetterSetterLoop(nothing, myProp, from, to) {
    var myValue = {};
    var value = true;
    Object.defineProperty(myValue, myProp, {
        get: function () { return value; },
        set: function (newValue) { value = newValue; }
    });
    return {
        get: getterLoop(myValue, getter, nothing, myProp, from, to),
        set: setterLoop(myValue, setter, nothing, myProp, from, to)
    };
}
function createFunctionGetterSetterLoopObj(nothing, myProp, from, to) {
    var myValue = {};
    var value = true;
    Object.defineProperty(myValue, myProp, {
        get: function () { return value; },
        set: function (newValue) { value = newValue; }
    });
    return {
        get: getterLoopObj(myValue, getter, nothing, myProp, from, to),
        set: setterLoopObj(myValue, setter, nothing, myProp, from, to)
    };
}
function createFunctionGetterSetter(nothing, myProp, from, to) {
    var myValue = {};
    var value = true;
    Object.defineProperty(myValue, myProp, {
        get: function () { return value; },
        set: function (newValue) { value = newValue; }
    });
    return {
        get: getterBind(myValue, getter, nothing, myProp, from, to),
        set: setterBind(myValue, setter, nothing, myProp, from, to),
    };
}
function createFunctionGetterSetterargs(nothing, myProp, from, to) {
    var myValue = {};
    var value = true;
    Object.defineProperty(myValue, myProp, {
        get: function () { return value; },
        set: function (newValue) { value = newValue; }
    });
    return {
        get: argBind(getter, myValue, nothing, myProp, from, to),
        set: argBind(setter, myValue, nothing, myProp, from, to),
    };
}


function getter(nothing, myProp, from, to) {
    if (from !== globalFrom) {
        throw 'error from get';
    }
    if (to !== globalTo) {
        throw 'error to get';
    }
    if (typeof myProp !== 'string') {
        throw 'error myProp get';
    }
    if (typeof nothing !== 'function') {
        throw 'error nothing get';
    }
    nothing(this[myProp], from, to);
    return this[myProp];
}
function setter(nothing, myProp, from, to, newValue) {
    if (from !== globalFrom) {
        throw 'error from set';
    }
    if (to !== globalTo) {
        throw 'error to set';
    }
    if (typeof myProp !== 'string') {
        throw 'error myProp set';
    }
    if (typeof nothing !== 'function') {
        throw 'error nothing set';
    }
    if (typeof newValue !== 'boolean') {
        throw 'error newValue set';
    }
    this[myProp] = newValue;
    nothing(this[myProp], from, to);
}
function getterSlice(context, fn) {
    var args = slice.call(arguments, 2);
    return function () {
        fn.apply(context, args);
    };
}
function setterSlice(context, fn) {
    var args = slice.call(arguments, 2);
    args.push(null);
    var pos = args.length - 1;
    return function (newVal) {
        args[pos] = newVal;
        fn.apply(context, args);
    };
}
function getterLoop(context, fn) {
    var args = [];
    for (var ii = 2; ii < arguments.length; ii++) {
        args.push(arguments[ii]);
    }
    return function () {
        fn.apply(context, args);
    };
}
function setterLoop(context, fn) {
    var args = [];
    var ii = 2;
    for (; ii < arguments.length; ii++) {
        args.push(arguments[ii]);
    }
    ii = args.push(null) - 1;
    return function (newVal) {
        args[ii] = newVal;
        fn.apply(context, args);
    };
}
function getterLoopObj(context, fn) {
    var args = { length: 0 };
    for (var ii = 2; ii < arguments.length; ii++) {
        args[args.length++] = arguments[ii];
    }
    return function () {
        fn.apply(context, args);
    };
}
function setterLoopObj(context, fn) {
    var args = {};
    var ii = 2, jj = 0;
    for (; ii < arguments.length; ii++ , jj++) {
        args[jj] = arguments[ii];
    }
    args.length = jj + 1;
    return function (newVal) {
        args[jj] = newVal;
        fn.apply(context, args);
    };
}
function getterLoopObj(context, fn) {
    var args = { length: 0 };
    for (var ii = 2; ii < arguments.length; ii++) {
        args[args.length++] = arguments[ii];
    }
    return function () {
        fn.apply(context, args);
    };
}
function setterLoopObj(context, fn) {
    var args = {};
    var ii = 2, jj = 0;
    for (; ii < arguments.length; ii++ , jj++) {
        args[jj] = arguments[ii];
    }
    args.length = jj + 1;
    return function (newVal) {
        args[jj] = newVal;
        fn.apply(context, args);
    };
}
function getterBind(myValue, getter, nothing, myProp, from, to) {
    return getter.bind(myValue, nothing, myProp, from, to);
}
function setterBind(myValue, setter, nothing, myProp, from, to) {
    return setter.bind(myValue, nothing, myProp, from, to);
}
function argBind() {
    return Function.prototype.apply(Function.prototype.bind.call, arguments);
}


function test(typeOfGetter) {
    var newObject = {};
    keys.length = 1;
    for (var jj = 0; jj < keys.length; jj++) {
        Object.defineProperty(newObject, keys[jj], typeOfGetter(nothingReally, keys[jj], globalFrom, globalTo));
    }
    for (var ii = 0; ii < 100000; ii++) {
        for (jj = 0; jj < keys.length; jj++) {
            var value = newObject[keys[jj]];
        }
        for (jj = 0; jj < keys.length; jj++) {
            newObject[keys[jj]] = !newObject[keys[jj]];
        }
    }
}

