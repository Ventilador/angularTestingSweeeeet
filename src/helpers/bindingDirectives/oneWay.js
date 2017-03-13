var valueFn = require('./../utils').valueFn;
var $parse;
module.exports = function (expression) {
    expression = $parse(expression);
    var lastValue;
    var parentValue;
    return {
        instance: {
            get: get,
            set: set
        },
        directive: valueFn(link)
    };
    function link(scope) {
        lastValue = scope.$eval(expression);
        scope.$watch(expression, function (newValue) {
            lastValue = newValue;
        });
    }
    function set(newValue) {
        lastValue = newValue;
    }
    function get() {
        return lastValue;
    }
};
run.$inject = ['$parse'];
function run($parse_) {
    $parse = $parse_;
}
angular.module(require('./../constants').MODULE_NAME).run(run);