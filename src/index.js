var init = require('./helpers/initializer');
var assertRootScopeClean = require('./helpers/utils').assertRootScopeClean;
var copyProperties = require('./helpers/utils').copyProperties;
var getKey = require('./helpers/utils').getKey;
var attrRun = require('./helpers/bindingDirectives/attribute').run;
var eqRun = require('./helpers/bindingDirectives/equals').run;
var expRun = require('./helpers/bindingDirectives/expression').run;
var oneWayRun = require('./helpers/bindingDirectives/oneWay').run;
var compileRun = require('./helpers/compileProvider').run;

var diretivesPushed = {};

(typeof self !== 'undefined' ? self : window).$$module = angular.module(require('./helpers/constants').MODULE_NAME, ['ng'])
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
    }]).run(attrRun).run(oneWayRun).run(eqRun).run(expRun).run(compileRun)
    .config(['$compileProvider', function (compile) {
        angular.dummyModule = function (name, factory) {
            if (!diretivesPushed[name]) {
                diretivesPushed[name] = true;
                compile.directive(name, factory);
            }
        };
    }]);
var injector = angular.bootstrap('<div/>', [require('./helpers/constants').MODULE_NAME, 'pascalprecht.translate'], { strictDi: false });
module.exports = (function (context) {
    init();
    context.angularTestingSuite = require('./suiteProvider')(injector);
    return context.angularTestingSuite;
})(typeof self !== 'undefined' ? self : window); 
