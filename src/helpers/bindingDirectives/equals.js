var $parse;
var valueFn = require('./../utils').valueFn;
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
        var diff = 0;
        lastValue = scope.$eval(expression);
        scope.$watch(function () {
            if (parentValue !== (parentValue = scope.$eval(expression))) {
                diff++;
                lastValue = parentValue;
            } else if (lastValue !== parentValue) {
                diff++;
                expression.assign(scope, lastValue);
            }
            return diff;
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
module.exports.run = run;
function run($parse_) {
    $parse = $parse_;
}