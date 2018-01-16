var hasProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
var pushedDirectives = {};
var moduleConfig;
var overritenCache;
var providerRegex = /^(.+)Provider$/;
var requiresKey = '$$requires';
var providerPrefix = 'Provider';
var INSTANTIATING = function () { };
var hasMethods = require('./utils').hasMethods;
var setKeys = require('./utils').setKeys;
var CONSTANTS = require('./constants');
var visited = {};
module.exports = createInjector;
createInjector.cleanMap = function () {
    visited = {};
};
function createInjector(angularModule, requires, force, angularInjector, emitError, originalMethods) {
    var cache = {};
    var overritenCache = {};
    var providers = {};
    var locals = {};
    var $$all = {};
    var injectorProvider = originalMethods.get('injectorLeaker');
    Object.assign(angularInjector, {
        annotate: originalMethods.annotate,
        addLocals: internalAddLocals,
        $$overrideCache: $$overideCache,
        get: initDelegate(internalGet, 'get'),
        has: initDelegate(internalHas, 'has'),
        instantiate: initDelegate(internalInstantiate, 'instantiate'),
        invoke: initDelegate(internalInvoke, 'invoke')
    });
    var instance = angularInjector;
    if (Array.isArray(requires) || force === true) {
        moduleConfig = angularModule.transverseAll(requires, force);
        $$all = moduleConfig.$$all;
    } else {
        moduleConfig = {
            run: angularModule.runArray.slice(),
            config: angularModule.configArray.slice()
        };
        $$all = angularModule.$$all;
    }
    cache.$injector = instance;
    return instance;

    function $$overideCache(name, value) {
        cache[name] = value;
        return function $$cleanCache() {
            delete cache[name];
        };
    }

    function initDelegate(method, name) {
        return function () {
            Object.assign(instance, {
                get: internalGet,
                has: internalHas,
                instantiate: internalInstantiate,
                invoke: internalInvoke
            });
            loopAndCall(moduleConfig.config, runConfig);
            loopAndCall(moduleConfig.run, internalInvoke);
            return method.apply(instance, arguments);
        };
    }

    function loopAndCall(array, method) {
        for (var index = 0, current = array[0]; index < array.length; current = array[++index]) {
            method(current);
        }
    }

    function runConfig(item) {
        if (item.id && visited[item.id]) {
            return;
        }
        visited[item.id] = 1;
        var args = injectArgs(item.fn, [], null, instanciateProvider);
        (Array.isArray(item.fn) ? item.fn[item.fn.length - 1] : item.fn).apply(null, args);
    }



    function internalAddLocals(name, constructor) {
        assertNotEquals(emitError, name, 'hasOwnProperty', '$injector', '$scope', '$rootScope', '$q', '$timeout', '$interval', '$parse', '$compile', '$controller');
        var toDelete = [name];
        var key, length = 1;
        while (length--) {
            key = toDelete[length];
            toDelete.length--;
            if (cache[key] && cache[key][requiresKey]) {
                length = (toDelete = cache[key][requiresKey].concat(toDelete)).length;
            }
            delete cache[key];
        }
        locals[name] = constructor;
    }

    function internalGet(name) {
        if (hasProp(cache, name)) {
            if (cache[name] === INSTANTIATING) {
                emitError('Circular dependency', internalGet, [name]);
            }
            return cache[name];
        } else if (hasProp(locals, name)) {
            return (cache[name] = locals[name]);
        }
        cache[name] = INSTANTIATING;
        var providerName = name + providerPrefix;
        if (hasProp($$all, providerName)) {
            var found;
            if (!providers[providerName]) {
                providers[providerName] = instanciateProvider(providerName, $$all[providerName]);
            }
            if (providers[providerName]) {
                cache[name] = internalInvoke(providers[providerName].$get, providers[providerName]);
            }
        } else if (/^[^n][^g].+Directive$/.test(name)) {
            return (cache[name] = []);
        } else if (originalMethods.has(name)) {
            cache[name] = originalMethods.get(name);
        } else {
            delete cache[name];
            emitError('Not found: ' + name, internalGet, [name]);
        }
        return cache[name];

    }

    function instanciateProvider(name, fn) {
        if (hasProp(providers, name)) {
            if (providers[name] === INSTANTIATING) {
                emitError('Circular dependency in ' + name, instanciateProvider, [name]);
                return;
            }
            return providers[name];
        }
        if (fn) {
            return providers[name] = injectorProvider.invoke(fn);
        }
        var provider, result;
        if (injectorProvider.has(name)) {
            return injectorProvider.get(name);
        } else if ((result = providerRegex.exec(name)) && injectorProvider.has(result[1])) {
            return injectorProvider.get(result[1]);
        }

        providers[name] = INSTANTIATING;
        if (hasProp(locals, name)) {
            provider = locals[name];
        } else if (hasProp($$all, name)) {
            provider = $$all[name];
        } else {
            emitError('Provider not registered', instanciateProvider, [name]);
            return providers[name] = null;
        }
        var instance = Object.create((Array.isArray(provider) ? provider[provider.length - 1] : provider).prototype || null);
        var requires = [];
        var args = injectArgs(provider, requires, null, instanciateProvider);
        provider = Array.isArray(provider) ? provider[provider.length - 1] : provider;
        args.unshift(null);
        var toReturn = new (Function.prototype.bind.apply(provider, args))();
        toReturn[requiresKey] = requires;
        return (providers[name] = toReturn);
    }

    function internalHas(name) {
        return cache[name] || hasProp($$all, name + providerPrefix) || originalMethods.has(name) || !!providers[name + providerPrefix];
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
        var injections = originalMethods.annotate(toInstanciate);
        for (var i = 0, key = injections[0]; i < injections.length; key = injections[++i]) {
            if (locals_ && key in locals_) {
                args.push(locals_[key]);
            } else {
                if (instanciator) {
                    args.push(instanciator(key));
                } else {
                    args.push(internalGet(key));
                }
            }
            if (key in locals) {
                requires.push(key);
            }
        }
        return args;
    }


    function internalInvoke(toInstanciate, self, locals_, serviceName) {
        if (typeof locals_ === 'string') {
            serviceName = locals_;
            locals_ = {};
        }
        var fn = Array.isArray(toInstanciate) ? toInstanciate[toInstanciate.length - 1] : toInstanciate;
        var requires = [];
        var args = injectArgs(toInstanciate, requires, locals_);

        if (!isClass(fn)) {
            return fn.apply(self, args);
        }
        args.unshift(null);
        return new (Function.prototype.bind.apply(fn, args))();
    }
}




function isClass(func) {
    // Support: IE 9-11 only
    // IE 9-11 do not support classes and IE9 leaks with the code below.
    if (window.document.documentMode || typeof func !== 'function') {
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

function stringifyFn(fn) {
    return Function.prototype.toString.call(fn);
}

function assertNotEquals(emitError, toCheck) {
    var error;
    var array = [];
    for (var i = 2, key = arguments[i]; i < arguments.length; key = arguments[++i]) {
        if (toCheck === key) {
            array.push(toCheck);
            emitError('Cannot set ' + toCheck + ' as locals for $injector');
            error = true;
        }
    }
    if (error) {
        emitError('Throwing');
        throw 'Invalid property(s): ' + array.join(', ') + '.';
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
