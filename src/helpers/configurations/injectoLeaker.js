var valueFn = require('./../utils').valueFn;
module.exports = injectorLeaker;
injectorLeaker.$inject = ['$injector'];
function injectorLeaker($injector) {
    this.$get = valueFn($injector);
}