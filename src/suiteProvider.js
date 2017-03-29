var suiteCreator = require('./helpers/suiteInstance');
var createInjector = require('./helpers/injector');
var assign = require('./helpers/utils').assign;
var forEachKey = require('./helpers/utils').forEachKey;
var requiresKey = '$$$requires';
var MODULE_NAME = require('./helpers/constants.js').MODULE_NAME;
var DEFAULTS = {
    modules: [MODULE_NAME],
    strictAnnotations: true
};
var areEqual = require('./helpers/utils').areEqual;
var oldConfig;
var instance;
function createSuiteProvider(injector, config) {
    var copiedInjector = {};
    config = assign(config, DEFAULTS);
    forEachKey(injector, function (key, value) {
        if (typeof value === 'function') {
            copiedInjector[key] = value.bind(injector);
        } else {
            copiedInjector[key] = value;
        }
    });
    return createSuite;
    function createSuite(instanceModules) {
        var errorCbs = [];
        var root = injector.get('$rootScope');
        Object.defineProperties(AngularTestingSweet, {
            '$injector': {
                get: function () {
                    return injector;
                }
            },
            '$rootScope': {
                get: function () {
                    return root;
                }
            },
            'onError': {
                get: function () {
                    return onError;
                }
            }
        });
        return AngularTestingSweet;
        function AngularTestingSweet(moduleName, actualDependencies, force) {
            if (instanceModules && Array.isArray(instanceModules)) {
                instanceModules.forEach(pushTo(actualDependencies));
            }
            return suiteCreator(
                (internalInjector = createInjector(angular.module(moduleName), actualDependencies, force, injector, emitError, copiedInjector)),
                emitError
            );
        }

        function onError(fn) {
            errorCbs.push(fn);
            return function () {
                var index = errorCbs.indexOf(fn);
                if (index !== -1) {
                    errorCbs.splice(fn);
                }
            };
        }

        function emitError(message, fn, args) {
            if (errorCbs.length) {
                for (var ii = 0; ii < errorCbs.length; ii++) {
                    try {
                        errorCbs[ii](message, fn, args);
                    } catch (error) { }
                }
            } else {
                console.error(message + (fn ? ' at ' + fn.name : ''));
            }
        }

    }
}

var removeModules = {
    ng: true,
    ngLocale: true
};
removeModules[MODULE_NAME] = true;

function pushTo(array) {
    for (var i = array.length - 1; i > -1; i--) {
        if (removeModules[array[i]]) {
            array.splice(i, 1);
        }
    }
    return function (name) {
        if (!removeModules[name] && angular.module.has(name) && array.indexOf(name) === -1) {
            array.push(name);
        }
    };
}

module.exports = createSuiteProvider;

