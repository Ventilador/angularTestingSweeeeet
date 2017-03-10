var uniqueInjectorInstance;
var cache;
var providers;
var locals;
var angularInjector;
var angularModule;
var emitError;
var has;
var $rootScope;
var $$all;
var moduleConfig;
var providerPrefix = 'Provider';
var INSTANTIATING = function () { };
var hasMethods = require('./utils').hasMethods;
var CONSTANTS = require('./constants');
module.exports = createInjector;
createInjector.$$reset = function () {
    moduleConfig =
        uniqueInjectorInstance =
        $$all =
        cache =
        providers =
        locals =
        angularInjector =
        angularModule =
        emitError =
        has =
        $rootScope = null;
    INSTANTIATING = function () { };
};
createInjector.get = function () {
    if (!uniqueInjectorInstance) {
        throw 'Import ' + CONSTANTS.MODULE_NAME + ' module before this';
    }
    return uniqueInjectorInstance;
};
function createInjector(angularModule_, emitError_/*or required modules*/, force/*or original injector*/) {
    cache = {};
    providers = {};
    locals = {};
    angularModule = angularModule_;
    if (!uniqueInjectorInstance) {
        emitError = emitError_ || angular.noop;
        angularInjector = ensureInjector(force, [CONSTANTS.MODULE_NAME]);
        uniqueInjectorInstance = {
            annotate: angularInjector.annotate,
            addLocals: internalAddLocals
        };
    }
    Object.assign(uniqueInjectorInstance, {
        get: initDelegate(internalGet, 'get'),
        has: initDelegate(internalHas, 'has'),
        instantiate: initDelegate(internalInstantiate, 'instantiate'),
        invoke: initDelegate(internalInvoke, 'invoke')
    });
    if (Array.isArray(emitError_) || force) {
        moduleConfig = angularModule.transverseAll(emitError_, force);
        $$all = moduleConfig.$$all;
    } else {
        moduleConfig = {
            run: angularModule._moduleRun.slice(),
            config: angularModule_._moduleConfig.slice()
        };
        $$all = angularModule.$$all;
    }
    has = Function.prototype.call.bind(Object.prototype.hasOwnProperty, $$all);
    locals = {
        $injector: uniqueInjectorInstance
    };
    $rootScope.$$reset();
    return uniqueInjectorInstance;
}

function initDelegate(method, name) {
    return function () {
        Object.assign(uniqueInjectorInstance, {
            get: internalGet,
            has: internalHas,
            instantiate: internalIns,
            invoke: internalInv
        });
        if (!$rootScope) {
            angularInjector.invoke(decorateRoot);
        }
        loopAndCall(moduleConfig.config, instanciateProvider);
        loopAndCall(moduleConfig.run, internalInvoke);
        return uniqueInjectorInstance[method].apply(uniqueInjectorInstance, arguments);
    };
}

function loopAndCall(array, method) {
    for (var index = 0, current = array[0]; index < array.length; current = array[++index]) {
        method(current);
    }
}

function internalAddLocals(name, constructor) {
    assertNotEquals(name, 'hasOwnProperty', '$injector', '$scope', '$rootScope', '$q', '$timeout', '$interval', '$parse', '$compile', '$controller');
    var toDelete = [name];
    var key, length = 1;
    while (length--) {
        key = toDelete[length];
        toDelete.length--;
        if (cache[key]) {
            length = (toDelete = cache[key][requiresKey].concat(toDelete)).length;
            delete cache[key];
        }
    }
    locals[name] = constructor;
}

function internalGet(name) {
    if (cache.hasOwnProperty(name)) {
        if (cache[name] === INSTANTIATING) {
            emitError('Circular dependency');
        }
        return cache[name];
    } else {
        cache[name] = INSTANTIATING;
        if (name in locals) {
            if (!providers[name + providerPrefix]) {
                instanciateProvider(name + providerPrefix, locals[name]);
            }
            cache[name] = internalInvoke(providers[name + providerPrefix].$get, providers[name + providerPrefix]);
        } else if (has(name)) {
            if (!providers[name + providerPrefix]) {
                instanciateProvider(name + providerPrefix, $$all[name]);
            }
            cache[name] = internalInvoke(providers[name + providerPrefix]);
        } else if (angularInjector.has(name)) {
            cache[name] = angularInjector.get(name, locals);
        } else {
            emitError('Not found: ' + name);
        }
        return cache[name];
    }
}

function instanciateProvider(name) {
    if (providers.hasOwnProperty(name)) {
        if (providers[name] === INSTANTIATING) {
            emitError('Circular dependency in ' + name);
            return;
        }
        return providers[name];
    } else {
        providers[name] = INSTANTIATING;
        var provider = locals[name];
        var instance = Object.create((Array.isArray(provider) ? provider[provider.length - 1] : provider).prototype || null);
        var args = injectArgs(toInstanciate, requires, locals_, instanciateProvider);
        args.shift(null);
        var toReturn = new (Function.prototype.bind.apply(provider, args))();
        toReturn[requiresKey] = requires;
        return (providers[name] = toReturn);
    }
}

function internalHas(name) {
    return has(name) || angularInjector.has(name) || !!providers[name + providerPrefix];
}


function internalInstantiate(toInstanciate, locals_) {
    if (!locals_ || typeof locals !== 'object') {
        locals_ = {};
    }
    var fn = Array.isArray(toInstanciate) ? toInstanciate[toInstanciate.length - 1] : toInstanciate;
    var requires = [];
    var args = injectArgs(toInstanciate, requires, locals_);
    args.shift(null);
    var toReturn = new (Function.prototype.bind.apply(fn, args))();
    toReturn[requiresKey] = requires;
    return toReturn;
}

function injectArgs(toInstanciate, requires, locals_, instanciator) {
    var args = [];
    var injections = angularInjector.annotate(toInstanciate);
    for (var i = 0, key = injections[0]; i < injections.length; key = injections[++i]) {
        if (key in locals_) {
            args.push(locals_[key]);
        } else {
            if (instanciator) {
                args.push(instanciator(key));
            } else {
                args.push(internalGet(key));
                key += providerPrefix;
            }
        }
        if (key in locals) {
            requires.push(key);
        }
    }
}


function internalInvoke(toInvoke, self, locals_, serviceName) {
    if (typeof locals_ === 'string') {
        serviceName = locals_;
        locals_ = {};
    }

    var requires = [];
    var args = injectArgs(toInstanciate, requires, locals_);

    if (!isClass(fn)) {
        return fn.apply(self, args);
    }
    args.unshift(null);
    return new (Function.prototype.bind.apply(fn, args))();
}



function isClass(func) {
    // Support: IE 9-11 only
    // IE 9-11 do not support classes and IE9 leaks with the code below.
    if (msie || typeof func !== 'function') {
        return false;
    }
    var result = func.$$ngIsClass;
    if (typeof result !== 'boolean') {
        // Support: Edge 12-13 only
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/6156135/
        result = func.$$ngIsClass = /^(?:class\b|constructor\()/.test(stringifyFn(func));
    }
    return result;
}

function assertNotEquals(toCheck) {
    for (var i = 1, key = arguments[i]; i < arguments.length; key = arguments[++i]) {
        if (toCheck === key) {
            throw 'Cannot set ' + toCheck + ' as locals for $injector';
        }
    }
}


decorateRoot.$inject = ['$rootScope'];
function decorateRoot($rootScope_) {
    $rootScope = $rootScope_;
    var eventName = 'testingSweet';
    var toClean = [];
    var originals = {};
    $rootScope.$new = decoratedNew();
    $rootScope.$$reset = Function.prototype.bind.call($rootScope.$broadcast, $rootScope, eventName);
    return suportListener('$on', '$watch', '$watchCollection', '$watchGroup');

    function suportListener() {
        for (var i = 0, method = arguments[0]; i < arguments.length; method = arguments[++i]) {
            originals[method] = $rootScope[method];
            $rootScope[method] = getDecorator(method);
        }
        $rootScope.$on(eventName, clean);
    }

    function decoratedNew() {
        var originalMethod = $rootScope.$new;
        return function $new() {
            var toReturn = originalMethod.apply($rootScope, arguments);
            toReturn.$on(eventName, destroyTarget);
            return toReturn;
        };
    }

    function getDecorator(method) {
        return function () {
            return pushTo(toClean, originals[method].apply($rootScope, arguments));
        };
    }


    function clean() {
        var index = toClean.length;
        while (index--) {
            try {
                toClean[index]();
            } finally {
                continue;
            }
        }
        toClean.length = 0;
    }
}

function ensureInjector(suposed, modules) {
    if (hasMethods(suposed, 'has', 'get', 'annotate', 'invoke', 'instantiate')) {
        return suposed;
    }
    return angular.injector(modules, true);
}




function destroyTarget(event) {
    event.currentTarget.$destroy();
}

function pushTo(array, obj) {
    array.push(obj);
    return obj;
}