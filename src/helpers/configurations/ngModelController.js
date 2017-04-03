module.exports = ngModelController;
ngModelController.$inject = ['$delegate', '$injector'];
function ngModelController($delegate, $injector) {
    for (var ii = 0, found; ii < $delegate.length; ii++) {
        if ((found = $delegate[ii].controller)) {
            var proto = (typeof found === 'function' ? found : found[found.length - 1]).prototype;
            proto.$$applyNewModel = $$applyNewModelSelector;
            break;
        }
    }
    return $delegate;
}
var onError = {
    'true': 'You should registre a function when requesting async behavior',
    'false': 'This model seems to have a debouncer, please register a callback or you will have weird behaviors'
};

function $$makeDispatchAsync(that) {
    var array = [];
    var $$scope = that.$$scope;
    that.$viewChangeListeners.push(onChange);
    var queued;

    return registerChange;
    function onChange() {
        if (queued) {
            return;
        }
        queued = true;
        $$scope.$$postDigest(flush);
    }
    function flush() {
        try {
            while (array.length) {
                array.pop()(that.$modelValue);
            }
        } catch (err) {
            console.debug(err);
        } finally {
            queued = false;
        }
    }
    function registerChange(fn, evalAsync) {
        if (typeof fn === 'function') {
            array.push(fn);
        } else {
            console.error(onError[!!evalAsync]);
        }
        $$scope.$evalAsync(onChange);
    }
}

function $$applyNewModelSelector() {
    var debounce = this.$options && this.$options.debounce;
    var dispatcher = $$makeDispatchAsync(this);
    if (debounce || typeof debounce === 'number') {
        this.$$applyNewModel = $$makeApplyModelAsync(dispatcher);
    } else {
        this.$$applyNewModel = $$makeApplyModelSync(dispatcher);
    }
    return this.$$applyNewModel.apply(this, arguments);
}


function $$makeApplyModelSync(dispatcher) {
    return $$applyNewModel;
    function $$applyNewModel(array, whenDone) {
        if (arguments.length === 3) {
            dispatcher(whenDone, true);
        }
        loop(array, this);
    }
}


function $$makeApplyModelAsync(dispatcher) {
    return $$applyNewModel;
    function $$applyNewModel(array, whenDone, debounce) {
        debounce = typeof debounce === 'number' ? debounce : 0;
        loop(array, this, debounce, dispatcher, whenDone);
    }
    function internalWhenDown() {

    }
}

function loop(array, that, debounce, dispatcher, whenDone) {
    if (debounce) {
        var config = {
            ii: 0,
            array: array,
            that: that,
            carried: '',
            whenDone: function () {
                dispatcher(whenDone, true);
            }
        };
        config.interval = setInterval(doInterval, debounce, config);
    } else {
        for (var ii = 0, current = array[ii], carried = ''; ii < array.length; current = array[++ii]) {
            that.$setViewValue(carried += current);
        }
    }
}

function doInterval(config) {
    if (config.ii === config.array.length) {
        clearInterval(config.interval);
        config.whenDone();
    } else {
        config.that.$setViewValue(config.carried += config.array[config.ii]);
        config.ii++;
    }
}



