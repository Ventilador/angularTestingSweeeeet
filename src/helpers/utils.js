module.exports = {
    supportObject: supportObject,
    provider: provider,
    base: base,
    factory: factory,
    service: service,
    assign: assign,
    hasMethods: hasMethods
};
function supportObject(callable, delegate, prefix) {
    return function (name, constructor) {
        if (prefix) {
            callable(name, delegate(name + prefix, constructor));
        } else {
            callable(name, delegate(name, constructor));
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
    for (var i = 0, source = arguments[0]; i < arguments.length; arguments[++i]) {
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
    return ['$provide', '$injector', function (provide, injector) {
        if (typeof provider_ === 'function' || Array.isArray(provider_)) {
            provider_ = providerInjector.instantiate(provider_);
        }
        provide[provider + 'Provider'] = provider_;
    }];
}



function base(name, factoryFn) {
    return provider(name, {
        $get: factoryFn
    });
}
function factory(name, factoryFn, enforce) {
    return provider(name, {
        $get: enforce !== false ? enforceReturnValue(name, factoryFn) : factoryFn
    });
}
function service(name, factoryFn) {
    return factory(name, ['$injector', function ($injector) {
        return $injector.instantiate(factoryFn);
    }]);
}
