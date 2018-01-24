var init = require('./helpers/initializer');
var attrRun = require('./helpers/bindingDirectives/attribute').run;
var eqRun = require('./helpers/bindingDirectives/equals').run;
var expRun = require('./helpers/bindingDirectives/expression').run;
var oneWayRun = require('./helpers/bindingDirectives/oneWay').run;
var compileRun = require('./helpers/compileProvider').run;
var ngModelDirective = require('./helpers/configurations/ngModel');
var controllerServiceDecorator = require('./helpers/configurations/controllerService');
var rootScopeDecorator = require('./helpers/configurations/rootScope');
var ngModelController = require('./helpers/configurations/ngModelController');
var injectorLeaker = require('./helpers/configurations/injectoLeaker');
var suiteProvider = require('./suiteProvider');
module.exports = (function (context) {
    var diretivesPushed = {};
    var $$module = context.$$module = angular.module(require('./helpers/constants').MODULE_NAME, ['ng'],
        ['$compileProvider', function (compile) {
            angular.dummyModule = function (name, factory) {
                if (!diretivesPushed[name]) {
                    diretivesPushed[name] = true;
                    compile.directive(name, factory);
                }
            };
        }])
        .provider('injectorLeaker', injectorLeaker)
        .decorator('$controller', controllerServiceDecorator)
        .decorator('$rootScope', rootScopeDecorator)
        .decorator('ngModelDirective', ngModelController)
        .run(attrRun)
        .run(oneWayRun)
        .run(eqRun)
        .run(expRun)
        .run(compileRun)
        .directive('ngModel', ngModelDirective);
    init();
    let injector;
    context.angularTestingSuite = suiteProvider(injector = angular.bootstrap('', [require('./helpers/constants').MODULE_NAME, 'pascalprecht.translate'], { strictDi: false }));
    context.angularTestingSuite.annotate = function (fn) {
        const args = injector.annotate(fn);
        fn = typeof fn === 'function' ? fn : (Array.isArray(fn) && typeof fn[fn.length - 1] === 'function' ? fn[fn.length - 1] : null);
        fn.$inject = args;
        return fn;
    };
    return context.angularTestingSuite;
})(typeof self !== 'undefined' ? self : window);

