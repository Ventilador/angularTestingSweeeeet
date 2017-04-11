module.exports = {
    supportObject: supportObject,
    provider: provider,
    base: base,
    factory: factory,
    service: service,
    assign: assign,
    hasMethods: hasMethods,
    copyProperties: copyProperties,
    next: next,
    forEachKey: forEachKey,
    valueFn: valueFn,
    assertRootScopeClean: assertRootScopeClean,
    setKeys: setKeys,
    getKey: getKey,
    snake_case: snake_case,
    areEqual: areEqual,
    createMethod: createMethod,
    unique: unique,
    assertDefinedNotNull: assertDefinedNotNull
};

function assertDefinedNotNull(obj) {
    for (var ii = 1, current = arguments[ii]; ii < arguments.length; current = arguments[++ii]) {
        if (obj[current] == undefined) { // jshint ignore:line
            return false;
        }
    }
    return true;
}

var unique = 0;
function next() {
    return unique++;
}

function createMethod() {
    return function () {

    };
}

function forEachKey(obj, fn, i) {
    for ((i = typeof i === 'number' ? i : 0), array = Object.keys(obj), key = array[i]; i < array.length; key = array[++i]) {
        fn(key, obj[key]);
    }
}

function supportObject(callable, delegate, prefix) {
    return function (name, constructor) {
        if (prefix) {
            return callable(name + prefix, delegate(name + prefix, constructor));
        } else {
            return callable(name, delegate(name, constructor));
        }
    };
}
function hasMethods(source) {
    if (!source) {
        return false;
    }
    for (var i = 1; i < arguments.length; i++) {
        if (typeof source[arguments[i]] !== 'function') {
            return false;
        }
    }
    return true;
}
function assign(destination) {
    for (var i = 1, source = arguments[i]; i < arguments.length; arguments[++i]) {
        if (typeof source !== 'object' || source === null) {
            destination = source;
        } else if (Array.isArray(source)) {
            destination = destination && Array.isArray(destination) ? destination : [];
            for (i = 0; i < source.length; i++) {
                destination.push(assign(null, source[i]));
            }
        } else if (source instanceof Date) {
            destination = new Date(+source);
        } else {
            var array = Object.keys(source), key;
            destination = typeof destination === 'object' && destination && !Array.isArray(destination) ? destination : {};
            for (i = 0, key = array[0]; i < array.length; key = array[++i]) {
                destination[key] = assign(destination[key], source[key]);
            }
        }
    }
    return destination;
}

function provider(name, provider_) {
    if (Array.isArray(provider_) || typeof provider_ === 'function') {
        return provider_;
    }
    return valueFn(provider_);
}

function unique(array) {
    var keys = {};
    for (var i = 0; i < array.length; i++) {
        keys[array[i]] = true;
    }
    return Object.keys(keys);
}



function base(name, factoryFn) {
    return provider(name, {
        $get: factoryFn
    });
}
function factory(name, factoryFn) {
    return provider(name, {
        $get: factoryFn
    });
}
function service(name, factoryFn) {
    return factory(name, ['$injector', function ($injector) {
        return $injector.instantiate(factoryFn);
    }]);
}

function copyProperties(dest, source) {
    for (var i = 0, array = Object.keys(source), key = array[i]; i < array.length; key = array[++i]) {
        dest[key] = source[key];
    }
}

function valueFn(val) {
    return function () {
        return val;
    };
}

var INTERNAL_KEYS = {};
function setKeys(cleanRoot) {
    forEachKey(cleanRoot, function (key) {
        INTERNAL_KEYS[key] = true;
    });
}

function assertRootScopeClean() {
    while (this.$$childTail) {
        this.$$childTail.$destroy();
    }
    var keys = Object.keys(this);
    for (var i = 0, key = keys[i]; i < keys.length; key = keys[++i]) {
        if (!INTERNAL_KEYS[key]) {
            delete this[key];
        }
    }
    this.$$phase = this.$parent = this.$$watchers =
        this.$$nextSibling = this.$$prevSibling =
        this.$$childHead = this.$$childTail = null;
    this.$root = this;
    this.$$destroyed = false;
    this.$$listeners = {};
    this.$$listenerCount = {};
    this.$$watchersCount = 0;
    this.$$isolateBindings = null;
    return this;
}

function getKey(expression) {
    if (typeof expression === 'string') {
        return expression;
    }
    if (expression.name) {
        return expression.name;
    }
    if (typeof expression.$$internalId !== 'number') {
        expression.$$internalId = next();
    }
    return expression.$$internalId;
}

var SNAKE_CASE_REGEXP = /[A-Z]/g;
function snake_case(name, separator) {
    separator = separator || '-';
    return name.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
        return (pos ? separator : '') + letter.toLowerCase();
    });
}

function areEqual(val1, val2) {
    if (val1 === val2) { return true; }
    if (val1 !== val1 && val2 !== val2) { return true; }
    if (typeof val1 !== typeof val2) { return false; }
    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) {
            return false;
        }
        for (var i = 0; i < val1.length; i++) {
            if (!areEqual(val1[i], val2[i])) {
                return false;
            }
        }
        return true;
    }
    if (toString(val1) !== toString(val2)) {
        return false;
    }
    if (toString(val1) === '[object Date]') {
        return +val1 === +val1;
    }
    var keys1 = Object.keys(val1), keys2 = Object.keys(val2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (var j = 0; j < keys1.length; j++) {
        if (!areEqual(val1[keys1[j]], val2[keys1[j]])) {
            return false;
        }
    }
    return true;
}
var toString = Function.prototype.bind.call(Object.prototype.toString);
