require('angular');
var init = require('./helpers/initializer');
module.exports = (function (context) {
    init();
    context.angularTestingSuite = require('./suiteProvider');
    return context.angularTestingSuite;
})(typeof self !== 'undefined' ? self : window); 
