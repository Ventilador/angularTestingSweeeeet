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
    assertDefinedNotNull = utils.assertDefinedNotNull,
    supportObject = utils.supportObject;
module.exports = suite;
var toClean = [];
var isJquery = Function.prototype.bind.call(Object.prototype.isPrototypeOf, angular.element.prototype);
function suite($injector, onError) {
    clean();
    var compiledDirective = {};
    var options = {};
    var suiteInstance = {
        service: support,
        factory: support,
        filter: supportObject(addLocals, base, 'Filter'),
        directives: directives,
        removeDirectives: removeDirectives,
        bindToController: supportOption('bindToController'),
        bindFrom: supportOption('bindFrom'),
        controller: supportOption('controller'),
        controllerAs: supportOption('controllerAs'),
        template: supportOption('template', angular.element),
        get: get,
        invoke: invoke,
        compile: compile
    };
    return suiteInstance;

    function get(name) {
        return $injector.get(name);
    }

    function invoke() {
        return $injector.invoke.apply($injector, arguments);
    }

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

    function supportOption(optionKey, factory) {
        return function (newValue) {
            options[optionKey] = factory ? factory(newValue) : newValue;
            return suiteInstance;
        };
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
                fn: $injector.$$overrideCache(name + 'Directive', [saveDirectiveInstance(createDirective(factory, name))])
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
        options.template = directive || options.template;
        var found;
        var parentScope = Object.assign($rootScope.$new(true), options.bindFrom || {});
        var compiled;
        if (typeof options.template === 'string') {
            if (!$injector.has(options.template + 'Directive')) {
                onError('Directive "' + options.template + '" not found', compile, arguments);
                return null;
            }
            var info = buildHTML($injector.get(options.template + 'Directive')[0], options.template, attrs, parentScope);
            options.controller = info.controller;
            options.template = info.html;
            compiled = $compile(options.template)(parentScope);
        } else if (isJquery(options.template) && assertDefinedNotNull(options, 'controller')) {
            var locals = {
                $scope: parentScope.$new(true),
                $attr: {}
            };
            attrs = Object.assign({}, options.bindToController, attrs);
            var laterFn = $controller(options.controller, locals, true, options.controllerAs, attrs, parentScope);
            locals.$element = compiled = $compile(angular.element('<form/>').append(options.template))(parentScope);
            laterFn();
        }
        return {
            compiledFrom: valueFn(options.template),
            getParentScope: valueFn(parentScope),
            getHtml: valueFn(compiled),
            getController: propertyGetter('instance'),
            getDirective: getDirective,
            getChildScope: propertyGetter('$scope'),
            getElement: propertyGetter('$element'),
            getAttrs: propertyGetter('$attrs'),
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
                return found || findByName(options.controller);
            } else if (!name) {
                return;
            }
            name = getKey(name);
            for (var i = 0, value = controllersList[i]; i < controllersList.length; value = controllersList[++i]) {
                if (value.name === name) {
                    return value;
                }
            }
            onError('Controller "' + name + '" not found', findByName, arguments);
        }

        function getDirective(name) {
            return compiledDirective[name];
        }

    }



    function clean() {
        while (toClean.length) {
            toClean.pop().fn();
        }
    }
}