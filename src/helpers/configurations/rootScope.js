var assertRootScopeClean = require('./../utils').assertRootScopeClean;
rootDecorator.$inject = ['$delegate'];
module.exports = rootDecorator;
function rootDecorator(root) {
    root.$$reset = assertRootScopeClean;
    return root;
}