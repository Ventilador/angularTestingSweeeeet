module.exports = ngModelDirective;
function ngModelDirective() {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelController) {
            element.on('ngModel', modelHandler);
            (ngModelController.$$scope = scope).$on('$destroy', function () {
                element.off('ngModel', modelHandler);
            });
            function modelHandler() {
                var newValue = arguments[1];
                if (typeof newValue === 'function' && newValue.name === '$$getModel') {
                    newValue(ngModelController.$modelValue);
                } else {
                    var debounceTime = 0,
                        isArray = newValue && Array.isArray(newValue),
                        eachItem = isArray,
                        ii = 2,
                        current = arguments[ii],
                        whenDone;
                    for (; ii < arguments.length; current = arguments[++ii]) {
                        switch (typeof current) {
                            case 'boolean':
                                eachItem = current;
                                break;
                            case 'function':
                                whenDone = current;
                                break;
                            default:
                                debounceTime = current;
                                break;
                        }
                    }
                    if (eachItem) {
                        newValue = Array.prototype.slice.call(newValue);
                    } else if (isArray) {
                        newValue = newValue.join('');
                    }
                    ngModelController.$$applyNewModel(newValue, whenDone, debounceTime);
                }
            }
        }
    };
}

