var comProv = require('./compileProvider'),
    buildHTML = comProv.buildHTML,
    createDirective = comProv.createDirective;
var utils = require('./utils'),
    base = utils.base,
    callModuleMethod = utils.callModuleMethod,
    factory = utils.factory,
    provider = utils.provider,
    service = utils.service,
    getKey = utils.getKey,
    forEachKey = utils.forEachKey,
    valueFn = utils.valueFn,
    createMethod = utils.createMethod,
    supportObject = utils.supportObject;
module.exports = suite;
var toClean = [];
function suite($injector, onError) {
    clean();
    var compiledDirective = {};
    var suiteInstance = {
        service: support,
        factory: support,
        filter: supportObject(addLocals, base, 'Filter'),
        bindFrom: bindFrom,
        diretives: directives,
        removeDirectives: removeDirectives,
        compile: compile
    };
    var options;
    var parent;
    return suiteInstance;

    function support(name, instance, callback, spyCreator) {
        var factoryInstance;
        if (typeof instance === 'function') {
            factoryInstance = ensureResult(instance);
        } else if (Array.isArray(instance)) {
            factoryInstance = {};
            spyCreator = spyCreator || $injector.has('spyService') ? $injector.get('spyService') : createMethod;
            instance.forEach(function (key) {
                factoryInstance[key] = spyCreator(key, factoryInstance);
            });
        } else if (typeof instance === 'object') {
            factoryInstance = instance;
        }
        if (callback) {
            callback(factoryInstance);
        }
        return addLocals(name, factoryInstance);
    }

    function ensureResult(factory) {
        var internalInstance = Object.create(factory.prototype || null);
        var result = $injector.invoke(factory, internalInstance);
        if (result !== internalInstance && (typeof result === 'function' || typeof result === 'object')) {
            internalInstance = result;
        }
        return internalInstance;
    }

    function addLocals(name, factory) {
        $injector.addLocals(name, factory);
        return suiteInstance;
    }
    function directives(name, factory) {
        if (typeof name === 'object' && !factory) {
            forEachKey(name, directives);
        } else {
            toClean.push({
                name: name,
                fn: $injector.$$overrideCache(name, saveDirectiveInstance(createDirective(factory, name)))
            });
        }
        return suiteInstance;
    }

    function removeDirectives() {
        for (var i = 0, value = arguments[i]; i < arguments.length; value = arguments[++i]) {
            if (Array.isArray(value)) {
                removeDirectives.apply(null, value);
            } else if (compiledDirective[value]) {
                cleanDirective(value);
                delete compiledDirective[value];
            }
        }
        return suiteInstance;
    }


    function cleanDirective(name) {
        for (var i = toClean.length - 1, value = toClean[i]; i > -1; value = toClean[--i]) {
            if (value.name === name) {
                value.fn();
                toClean.splice(i, 1);
            }
        }
    }

    function bindFrom(newParent) {
        parent = newParent;
        return suiteInstance;
    }


    function saveDirectiveInstance(dirObj) {
        if (dirObj.instance) {
            compiledDirective[dirObj.name] = dirObj.instance;
        }
        return dirObj.directive;
    }


    function compile(directive, attrs) {
        var $controller = $injector.get('$controller').$$reset();
        var $compile = $injector.get('$compile');
        var $rootScope = $injector.get('$rootScope');
        var controllersList = $controller.$$intercepted();
        var toCompile = directive;
        var controllerToFectch;
        var found;
        var name;
        var compiled;
        var parentScope = Object.assign($rootScope.$new(true), parent);
        var childScope;
        if (typeof directive === 'string') {
            if (!$injector.has(directive + 'Directive')) {
                onError('Directive "' + directive + '" not found', compile, arguments);
                return null;
            }
            var info = buildHTML($injector.get(directive + 'Directive')[0], directive, attrs, parentScope);
            controllerToFectch = info.controller;
            toCompile = info.html;
        }
        compiled = $compile(toCompile)(parentScope);
        return {
            compiledFrom: valueFn(toCompile),
            getParentScope: valueFn(parentScope),
            getController: propertyGetter('instance'),
            getDirective: getDirective,
            getChildScope: propertyGetter('$scope'),
            getElement: propertyGetter('$element'),
            getAttrs: propertyGetter('$attrs'),
            getHtml: getHtml,
            $apply: callRoot('$apply'),
            $applyAsync: callRoot('$applyAsync'),
            $eval: callRoot('$eval'),
            $evalAsync: callRoot('$evalAsync')
        };

        function callRoot(method) {
            return function () {
                return $rootScope[method].apply($rootScope, arguments);
            };
        }


        function propertyGetter(property) {
            return function () {
                var result = findByName.apply(null, arguments);
                return result && result[property];
            };
        }

        function findByName(name) {
            if (!arguments.length) {
                return found || findByName(controllerToFectch);
            } else if (!name) {
                return;
            }
            name = getKey(name);
            for (var i = 0, value = controllersList[i]; i < controllersList.length; value = controllersList[++i]) {
                if (value.name === getKey(name)) {
                    return value;
                }
            }
            onError('Controller "' + name + '" not found', findByName, arguments);
        }

        function getDirective(name) {
            return compiledDirective[name];
        }

        function getHtml() {
            return compiled;
        }
    }



    function clean() {
        while (toClean.length) {
            toClean.pop().fn();
        }
    }
}