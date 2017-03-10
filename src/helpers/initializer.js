require('angular');
var isInit;
var utils = require('./utils'),
    CONSTANTS = require('./constants'),
    base = utils.base,
    factory = utils.factory,
    provider = utils.provider,
    service = utils.service,
    supportObject = utils.supportObject;


module.exports = init;
function init() {
    if (isInit) {
        throw 'Please initialize ' + CONSTANTS.MODULE_NAME + ' only once, sorry :(';
    }
    isInit = true;
    angular.module(CONSTANTS.MODULE_NAME, ['ng']);
    angular.module = createAngularObject();
}

function createAngularObject() {
    var modules = {};
    return function (name, requires) {
        if (requires) {
            if (name === CONSTANTS.MODULE_NAME) {
                throw 'Please don\'t override ' + CONSTANTS.MODULE_NAME + ' module';
            }
            modules[name] = newModule(requires, name);
        }
        return modules[name];
    };
}

function newModule(requires, name) {
    var configArray = [];
    var runArray = [];
    var all = {};
    var instance = {
        directive: supportObject(setAll, base, 'Directive'),
        controller: supportObject(setAll, base),
        service: supportObject(setAll, service),
        info: supportObject(setAll, base),
        provider: supportObject(setAll, provider),
        factory: supportObject(setAll, factory),
        value: supportObject(angular.noop, angular.noop),
        constant: supportObject(angular.noop, angular.noop),
        filter: supportObject(setAll, base, 'Filter'),
        decorator: supportObject(angular.noop, angular.noop),
        animation: supportObject(angular.noop, angular.noop),
        component: supportObject(setAll, base, 'Component'),
        config: supportObject(angular.noop, angular.noop),
        run: supportObject(angular.noop, angular.noop),
        configMock: supportObject(angular.noop, config),
        runMock: supportObject(angular.noop, run),
        requires: requires,
        name: name,
        $$all: all,
        transverseAll: transverseAll,
        _moduleConfig: configArray,
        _moduleRun: runArray
    };
    return instance;
    function setAll(name, value) {
        all[name] = value;
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

    function invoke(getter) {
        later.$inject = ['$injector'];
        return later;
        function later($injector) {
            if (typeof getter === 'object') {
                getter = valueToFn(getter);
            }
            return $injector.invoke(getter);
        }
    }
}