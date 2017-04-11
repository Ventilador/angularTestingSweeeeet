var copyProperties = require('./../utils').copyProperties;
var getKey = require('./../utils').getKey;
var forEachKey = require('./../utils').forEachKey;

module.exports = controllerService;
controllerService.$inject = ['$delegate', '$injector'];
function controllerService($delegate, $injector) {
    var original$controller = $delegate;
    var intercepted = [];
    copyProperties($controller, original$controller);
    $controller.$$reset = $$reset;
    $controller.$$intercepted = $$intercepted;
    return $controller;
    function $controller(expression, locals, later, ident, bindings, scope) {
        var tracker = getKey(expression);
        if (typeof expression === 'string') {
            expression = $injector.get(expression + 'Controller');
        }
        var result = original$controller(expression, locals, later, ident);
        intercepted.push(Object.assign({
            name: tracker,
            instance: result.instance
        }, locals));
        if (result.instance && scope && bindings) {
            applyBindings(result.instance, scope, bindings);
        }
        return result;
    }
    function $$intercepted() {
        return intercepted;
    }
    function $$reset() {
        intercepted = [];
        return $controller;
    }
    function applyBindings(instance, parent, bindings) {
        forEachKey(bindings, function (expression, key) {
            // TODO 
        });
    }
}