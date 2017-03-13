var valueFn = require('./../utils').valueFn;
var $parse;
module.exports = function (expression) {
    expression = $parse(expression);
    var internalExpression;
    return {
        instance: function (locals) {
            return internalExpression && internalExpression(locals);
        },
        directive: valueFn(link)
    };
    function link(scope) {
        internalExpression = function (locals_) {
            expression(scope, locals_);
        };
    }
};
run.$inject = ['$parse'];
angular.module(require('./../constants').MODULE_NAME).run(run);
function run($parse_) {
    $parse = $parse_;
}