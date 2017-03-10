var utils = require('./utils'),
    base = utils.base,
    callModuleMethod = utils.callModuleMethod,
    factory = utils.factory,
    provider = utils.provider,
    service = utils.service,
    supportObject = utils.supportObject;
module.exports = suite;
function suite($injector, onError) {
    var suiteInstance = {
        service: supportObject($injector.addLocals, service),
        factory: supportObject($injector.addLocals, factory),
        provider: supportObject($injector.addLocals, provider),
        filter: supportObject($injector.addLocals, base, 'Filter'),
        controller: supportObject($injector.addLocals, base, 'Controller'),
        diretive: supportObject($injector.addLocals, base, 'Directive'),
        constant: supportObject(),
        bindFrom: supportObject(),
        done: create,
        createController: createController
    };
    var parent;
    return suiteInstance;
}
