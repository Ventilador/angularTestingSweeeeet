var isInit;
var utils = require('./utils'),
    CONSTANTS = require('./constants'),
    base = utils.base,
    factory = utils.factory,
    provider = utils.provider,
    service = utils.service,
    copyProperties = utils.copyProperties,
    supportObject = utils.supportObject,
    getKey = utils.getKey,
    valueFn = utils.valueFn,
    assertRootScopeClean = utils.assertRootScopeClean;

var diretivesPushed = {};
var intercepted;
var why = angular.dummyModule = function (name, factory) {
    if (!diretivesPushed) {
        diretivesPushed[name] = true;
        $$module.directive(name, factory);
    }
};
var $$module = angular.module(CONSTANTS.MODULE_NAME, ['ng'])
    .decorator('$controller', ['$delegate', '$injector', function ($delegate, $injector) {
        var original$controller = $delegate;
        var intercepted = [];
        copyProperties($controller, original$controller);
        $controller.$$reset = $$reset;
        $controller.$$intercepted = $$intercepted;
        return $controller;
        function $controller(expression, locals, later, ident) {
            var tracker = getKey(expression);
            if (typeof expression === 'string') {
                expression = $injector.get(expression + 'Controller');
            }
            var result = original$controller(expression, locals, later, ident);
            intercepted.push(Object.assign({
                name: tracker,
                instance: result.instance
            }, locals));
            return result;
        }
        function $$intercepted() {
            return intercepted;
        }
        function $$reset() {
            intercepted = [];
            return $controller;
        }
    }]).decorator('$rootScope', ['$delegate', function (root) {
        root.$$reset = assertRootScopeClean;
        return root;
    }]);



module.exports = init;
function init() {
    if (isInit) {
        throw 'Please initialize ' + CONSTANTS.MODULE_NAME + ' only once, sorry :(';
    }
    isInit = true;
    angular.module = createAngularObject(angular.module(CONSTANTS.MODULE_NAME));
}


function createAngularObject(originalModule) {
    var modules = {};
    modules[CONSTANTS.MODULE_NAME] = originalModule;
    return function (name, requires) {
        if (requires) {
            if (name === CONSTANTS.MODULE_NAME) {
                throw 'Please don\'t override ' + CONSTANTS.MODULE_NAME + ' module';
            }
            modules[name] = newModule(requires, name);
        }
        if (!modules[name]) {
            throw 'Module "' + name + '" not found';
        }
        return modules[name];
    };
}
var internalProto = {
    $$INTERNAL: true
};

function newModule(requires, name) {
    var configArray = [];
    var runArray = [];
    var all = {};
    var instance = Object.create(internalProto);
    instance.directive = supportObject(setAll, function directive(name, factory) {
        $$module.directive(name.slice(0, -('Directive'.length)), factory).decorator(name, ['$delegate', function () {
            return [];
        }]);
        return provider(undefined, {
            $get: ['$injector', function ($injector) {
                return [$injector.instantiate(factory)];
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
    instance.constant = supportObject(returnInstance, angular.noop);
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
    instance._moduleConfig = configArray;
    instance._moduleRun = runArray;
    return instance;
    function setAll(name, value) {
        all[name + 'Provider'] = value;
        return instance;
    }

    function returnInstance() {
        return instance;
    }

    function transverseAll(array, only) {
        var toReturn = {
            $$all: {},
            run: [],
            config: []
        };
        var key;
        if (only) {
            array = array || instance.requires;
            while (array.length) {
                merge(array.pop());
            }
            return toReturn;
        }
        Object.assign(toReturn, instance.$$all);
        array = instance.requires.concat(array);
        while (array.length) {
            array = array.concat(merge(array.pop()) || []);
        }
        return toReturn;
        function merge(key) {
            if ((key = angular.module(key))) {
                Object.assign(toReturn, key.$$all);
                toReturn.run = toReturn.run.concat(key._moduleRun);
                toReturn.config = toReturn.config.concat(key._moduleConfig);
                return key.requires;
            }
        }
    }


    function config(getter) {
        configArray.push(getter);
    }
    function run(getter) {
        runArray.push(getter);
    }
}
