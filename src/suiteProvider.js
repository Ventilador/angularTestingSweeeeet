var suiteCreator = require('./helpers/suiteInstance');
var createInjector = require('./helpers/injector');
var assign = require('./helpers/utils').assign;
var forEachKey = require('./helpers/utils').forEachKey;
var requiresKey = '$$$requires';
var CONSTANTS = require('./helpers/constants.js');
var DEFAULTS = {
    modules: [CONSTANTS.MODULE_NAME],
    strictAnnotations: true
};
var areEqual = require('./helpers/utils').areEqual;
var oldConfig;
var instance;
function createSuiteProvider(injector) {
    var copiedInjector = {};
    forEachKey(injector, function (key, value) {
        if (typeof value === 'function') {
            copiedInjector[key] = value.bind(injector);
        } else {
            copiedInjector[key] = value;
        }
    });
    return createSuite;
    function createSuite(config) {
        config = assign(oldConfig = config, DEFAULTS);
        var errorCbs = [];
        Object.defineProperties(AngularTestingSweet, {
            '$injector': {
                get: function () {
                    return injector;
                }
            },
            '$rootScope': {
                get: function () {
                    return injector.get('$rootScope');
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

        function emitError(message) {
            if (errorCbs.length) {
                for (var ii = 0; ii < errorCbs.length; ii++) {
                    try {
                        errorCbs[ii](message);
                    } catch (error) { }
                }
            } else {
                console.error(message);
            }
        }

    }
}

module.exports = createSuiteProvider;

