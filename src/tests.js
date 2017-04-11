var keys = [];
for (var i = 97; i < 123; i++) {
    keys.push(String.fromCharCode(i));
}
var contextBoundPrototype = {};
var functionBoundPrototype = {};
Object.defineProperty(contextBoundPrototype, 'prop', createContextGetterSetter(nothingReally, 'a', 0, 100));
Object.defineProperty(functionBoundPrototype, 'prop', createFunctionGetterSetter(nothingReally, 'a', 0, 100));
var contextBound = Object.create(contextBoundPrototype);
var functionBound = Object.create(functionBoundPrototype);
function nothingReally(shouldAssign, from, to) {
    if (shouldAssign) {
        from = 11 << from;
        to = 11 << to;
    }
}

function createContextGetterSetter(nothing, myProp, from, to) {
    var myValue = {};
    myValue[myProp] = true;
    return {
        get: get,
        set: set
    };
    function get() {
        for (var ii = from; ii < to; ii++) {
            nothing(myValue[myProp], from + ii, to - ii);
        }
        return myValue[myProp];
    }
    function set(b) {
        myValue[myProp] = b;
        for (var ii = from; ii < to; ii++) {
            nothing(myValue[myProp], from + ii, to - ii);
        }
    }
}

function createFunctionGetterSetter(nothing, myProp, from, to) {
    var myValue = {};
    myValue[myProp] = true;
    return {
        get: getBinder(myValue, getter, nothing, myProp, from, to),
        set: setterSlice(myValue, setter, nothing, myProp, from, to)
    };
}

function getBinder(context, fn) {
    var args = [].slice.call(arguments, 2);
    return function () {
        fn.apply(context, args);
    };
}
function setterSlice(context, fn) {
    var args = [].slice.call(arguments, 2);
    args.push(null);
    var pos = args.length - 1;
    return function (newVal) {
        args[pos] = newVal;
        fn.apply(context, args);
    };
}

function getter(nothing, myProp, from, to) {
    for (var ii = from; ii < to; ii++) {
        nothing(this[myProp], from + ii, to - ii);
    }
    return this[myProp];
}
function setter(nothing, myProp, from, to, newValue) {
    this[myProp] = newValue;
    for (var ii = from; ii < to; ii++) {
        nothing(this[myProp], from + ii, to - ii);
    }
}

for (var ii = 0; ii < 10; ii++) {
    var array = [];
    for (var ff = 0; ff < 10; ff++) {
        var newObject = {};
        for (var jj = 0; jj < keys.length; jj++) {
            Object.defineProperty(newObject, keys[jj], createContextGetterSetter(nothingReally, keys[jj], 0, 100));
        }
        array.push(newObject);
    }
    array.length = 0;
}

for (var ii = 0; ii < 10; ii++) {
    var array = [];
    for (var ff = 0; ff < 10; ff++) {
        var newObject = {};
        for (var jj = 0; jj < keys.length; jj++) {
            Object.defineProperty(newObject, keys[jj], createFunctionGetterSetter(nothingReally, keys[jj], 0, 100));
        }
        array.push(newObject);
    }
    array.length = 0;
}

for (var ii = 0; ii < 100; ii++) {
    var value = contextBound.prop;
}

for (var ii = 0; ii < 100; ii++) {
    var value = functionBound.prop;
}

for (var ii = 0; ii < 100; ii++) {
    contextBound.prop = false;
}

for (var ii = 0; ii < 100; ii++) {
    functionBound.prop = false;
}

for (var ii = 0; ii < 10; ii++) {
    var array = [];
    for (var ff = 0; ff < 10; ff++) {
        var newObject = {};
        for (var jj = 0; jj < keys.length; jj++) {
            Object.defineProperty(newObject, keys[jj], createContextGetterSetter(nothingReally, keys[jj], 0, 100));
            newObject[keys[jj]] = !newObject[keys[jj]];
        }
        array.push(newObject);
    }
    array.length = 0;
}

for (var ii = 0; ii < 10; ii++) {
    var array = [];
    for (var ff = 0; ff < 10; ff++) {
        var newObject = {};
        for (var jj = 0; jj < keys.length; jj++) {
            Object.defineProperty(newObject, keys[jj], createFunctionGetterSetter(nothingReally, keys[jj], 0, 100));
            newObject[keys[jj]] = !newObject[keys[jj]];
        }
        array.push(newObject);
    }
    array.length = 0;
}