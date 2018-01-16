var CONSTANTS = require('./constants');
var isInit;
var utils = require('./utils'),
    base = utils.base,
    factory = utils.factory,
    provider = utils.provider,
    service = utils.service,
    copyProperties = utils.copyProperties,
    supportObject = utils.supportObject,
    getKey = utils.getKey,
    valueFn = utils.valueFn,
    unique = utils.unique,
    assertRootScopeClean = utils.assertRootScopeClean;
var decorateDirective = require('./compileProvider').decorateDirective;
var diretivesPushed = {};
var intercepted;



module.exports = init;

function init() {
    if (isInit) {
        throw 'Please initialize ' + CONSTANTS.MODULE_NAME + ' only once, sorry :(';
    }
    isInit = true;
    const origMod = angular.module;
    const known = Object.create(null);
    angular.module = function (name) {
        const module = origMod.apply(null, arguments);
        if (!known[name]) {
            known[name] = module;
        }
        return module;
    }
    angular.sweetModule = createAngularObject(angular.module(CONSTANTS.MODULE_NAME), known);
    extendJquery(angular.element);
}


function createAngularObject(originalModule, knownModules) {
    var modules = {};
    modules[CONSTANTS.MODULE_NAME] = originalModule;
    newModule.has = function (name) {
        return name in modules;
    };
    return newModule;
    function newModule(name, requires) {
        if (requires) {
            if (name === CONSTANTS.MODULE_NAME) {
                throw 'Please don\'t override ' + CONSTANTS.MODULE_NAME + ' module';
            } else if (name === 'hasOwnProperty') {
                throw 'Please don\'t override hasOwnProperty method';
            }
            modules[name] = newModuleInternal(requires, name);

        }
        if (!modules[name]) {
            if (knownModules[name]) {
                modules[name] = generateFrom(knownModules[name]);
            } else {
                throw 'Module "' + name + '" not found';
            }
        }
        return modules[name];
    }
    function has(name) {
        return modules.hasOwnProperty(name);
    }
}
var internalProto = {
    $$INTERNAL: true
};
function returnNoop() {
    return angular.noop;
}

function generateFrom(module) {
    const mod = newModuleInternal(module.requires, module.name);
    module._invokeQueue.forEach(function (item) {
        if (item[0] === '$controllerProvider' && item[1] === 'register') {
            mod['controller'].apply(mod, item[2]);
        } else {
            mod[item[1]].apply(mod, item[2]);
        }
    });
    return mod;
}

function newModuleInternal(requires, name) {
    var configArray = [];
    var runArray = [];
    var all = {};
    var instance = Object.create(internalProto);
    instance.directive = supportObject(setAll, function directive(name, factory) {
        angular.dummyModule(name.slice(0, -('Directive'.length)), returnNoop);
        return provider(undefined, {
            $get: [function () {
                return [decorateDirective({
                    directive: factory
                }, name).directive];
            }]
        });
    }, 'Directive');
    instance.controller = supportObject(setAll, function controller(name, constructor) {
        return provider(undefined, {
            $get: valueFn(constructor)
        });
    }, 'Controller');
    instance.service = supportObject(setAll, service);
    instance.info = supportObject(setAll, base);
    instance.provider = supportObject(setAll, provider);
    instance.factory = supportObject(setAll, factory);
    instance.value = supportObject(returnInstance, angular.noop);
    instance.constant = constant;
    instance.filter = supportObject(setAll, base, 'Filter');
    instance.decorator = supportObject(returnInstance, angular.noop);
    instance.animation = supportObject(returnInstance, angular.noop);
    instance.component = supportObject(setAll, base, 'Component');
    instance.config = supportObject(returnInstance, angular.noop);
    instance.run = supportObject(returnInstance, angular.noop);
    instance.configMock = supportObject(returnInstance, config);
    instance.runMock = supportObject(returnInstance, run);
    instance.requires = requires;
    instance.name = name;
    instance.$$all = all;
    instance.transverseAll = transverseAll;
    instance.doConfig = suportQueue(configArray);
    instance.doRun = suportQueue(runArray);
    instance.runArray = runArray;
    instance.configArray = configArray;
    return instance;
    function setAll(name, value) {
        all[name + 'Provider'] = value;
        return instance;
    }

    function constant(name, value) {
        all[name + 'Provider'] = valueFn({ $get: valueFn(value) });
        return instance;
    }

    function suportQueue(array) {
        return function (id, fn) {
            if (arguments.length === 1) {
                fn = id;
                id = null;
            }
            array.push({
                id: id,
                fn: fn
            });
            return instance;
        };
    }

    function returnInstance() {
        return instance;
    }

    function transverseAll(array, force) {
        var toReturn = {
            $$all: Object.assign({}, instance.$$all),
            run: [],
            config: []
        };
        var visited = {};
        array = unique(instance.requires.concat(array || []));
        if (!force) {
            while (array.length) {
                merge(array.pop());
            }
            return toReturn;
        }
        while (array.length) {
            array = unique(array.concat(merge(array.pop())));
        }
        return toReturn;
        function merge(key) {
            if (!visited[key] && angular.sweetModule.has(key)) {
                key = angular.sweetModule(key);
                visited[key] = true;
                Object.assign(toReturn.$$all, key.$$all);
                toReturn.run = toReturn.run.concat(key.runArray);
                toReturn.config = toReturn.config.concat(key.configArray);
                return key.requires;
            }
            return [];
        }
    }


    function config(getter) {
        configArray.push(getter);
    }
    function run(getter) {
        runArray.push(getter);
    }
}

function extendJquery($) {
    $.fn.model = $model;
}


function $model() {
    if (arguments.length) {
        return this.trigger('ngModel', arguments);
    } else {
        var temp;
        this.trigger('ngModel', function $$getModel(value) {
            temp = value;
        });
        return temp;
    }
}
