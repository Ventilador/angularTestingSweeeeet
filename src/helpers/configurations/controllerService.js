var copyProperties = require('./../utils').copyProperties;
var getKey = require('./../utils').getKey;

module.exports = controllerService;
controllerService.$inject = ['$delegate', '$injector'];
function controllerService($delegate, $injector) {
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
}