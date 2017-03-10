var suiteCreator = require('./helpers/suiteInstance');
var createInjector = require('./helpers/injector');
var assign = require('./helpers/utils').assign;
var requiresKey = '$$$requires';
var CONSTANTS = require('./helpers/constants.js');
var DEFAULTS = {
    modules: [CONSTANTS.MODULE_NAME],
    strictAnnotations: true
};
var warn = false;
module.exports = createSuite;
function createSuite(config) {
    if (warn) {
        console.log('You don\'t need to create multiples ' + CONSTANTS.MODULE_NAME + ' providers :)');
    } else {
        warn = true;
    }
    config = assign(config, DEFAULTS);
    createInjector.$$reset();
    var errorCbs = [];
    // var compilerProvider;
    // var internalmodule = angular.module(CONSTANTS.MODULE_NAME).config(['$compileProvider', function ($compileProvider_) {
    //     compilerProvider = $compileProvider_;
    // }]);
    var internalInjector = createInjector(internalmodule, emitError, angular.injector(config.modules, config.strictAnnotations));
    Object.defineProperties(AngularTestingSweet, {
        '$injector': {
            get: function () {
                return internalInjector;
            }
        },
        '$rootScope': {
            get: function () {
                return internalInjector.get('$rootScope');
            }
        },
        'onError': {
            get: function () {
                return onError;
            }
        }
    });
    return AngularTestingSweet;
    function AngularTestingSweet(moduleName, actualDependencies) {
        return suiteCreator(
            createInjector(angular.module(moduleName), actualDependencies),
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

