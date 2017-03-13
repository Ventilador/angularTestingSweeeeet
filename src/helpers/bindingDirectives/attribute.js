var valueFn = require('./../utils').valueFn;
var $interpolate;
module.exports = function (expression) {
    expression = $interpolate(expression);
    var dir = {
        instance: undefined,
        directive: valueFn(link)
    };
    return dir;
    function link(scope) {
        dir.instance = expression(scope);
        if (expression.expressions.length) {
            scope.$watch(expression, function (newVal) {
                dir.instance = newVal;
            });
        }
    }
};
run.$inject = ['$interpolate'];
function run($interpolate_) {
    $interpolate = $interpolate_;
}
angular.module(require('./../constants').MODULE_NAME).run(run);
