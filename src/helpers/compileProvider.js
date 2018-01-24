var MODULE_NAME = require('./constants').MODULE_NAME;
var utils = require('./utils'),
    valueFn = utils.valueFn,
    forEachKey = utils.forEachKey,
    snake_case = utils.snake_case;
module.exports = {
    createDirective: createDirective,
    onModuleRun: run,
    buildHTML: buildHTML,
    decorateDirective: decorateDirective,
};

var bindingTypes = {
    '=': require('./bindingDirectives/equals'),
    '&': require('./bindingDirectives/expression'),
    '>': require('./bindingDirectives/oneWay'),
    '@': require('./bindingDirectives/attribute')
};
var regex = /(=|&|>|@)(?:\?)?(.*)/;
var REQUIRE_PREFIX_REGEXP = /^(?:(\^\^?)?(\^\^?)?)?/;
var toClean = [];
var compiled;
var $parse;
var $injector;
run.$inject = ['$parse', '$injector'];
module.exports.run = run;
function run($parse_, $injector_) {
    $parse = $parse_;
    $injector = $injector_;
}


function createDirective(factory, name) {
    if (typeof factory === 'string') {
        var result = regex.exec(factory);
        if (!result) {
            throw 'Invalid binding';
        }
        var type = result[1];
        var expression = result[2] || name;
        return decorateDirective(bindingTypes[type](expression), name);
    }
    return decorateDirective({
        directive: typeof factory == 'function' ? factory : valueFn(factory)
    }, name);
}

function decorateDirective(directiveObj, name) {
    var directive = $injector.invoke(directiveObj.directive);
    if (typeof directive === 'function') {
        directive = { compile: valueFn(directive) };
    } else if (!directive.compile && directive.link) {
        directive.compile = valueFn(directive.link);
    }
    directive.priority = directive.priority || 0;
    directive.index = directive.index || 0;
    directive.name = directive.name || name;
    directive.require = getDirectiveRequire(directive);
    directive.restrict = getDirectiveRestrict(directive.restrict, name);
    directive.$$moduleName = 'dummy';
    directive.priority = 0;
    directiveObj.directive = directive;
    directiveObj.name = name;
    return directiveObj;
}

function getDirectiveRequire(directive) {
    var require = directive.require || (directive.controller && directive.name);
    if (!angular.isArray(require) && angular.isObject(require)) {
        angular.forEach(require, function (value, key) {
            var match = value.match(REQUIRE_PREFIX_REGEXP);
            var name = value.substring(match[0].length);
            if (!name) require[key] = match[0] + key;
        });
    }

    return require;
}

function getDirectiveRestrict(restrict, name) {
    if (restrict && !(angular.isString(restrict) && /[EACM]/.test(restrict))) {
        throw 'Restrict property \'' + restrict + '\' of directive \'' + name + '\' is invalid';
    }

    return restrict || 'EA';
}

function cleanLater(fn) {
    toClean.push(fn);
}


function buildHTML(directiveToCompile, name, attrs, parent) {
    var controllerToFectch = directiveToCompile.controller;
    var bindings = directiveToCompile.bindToController || directiveToCompile.scope || {};
    if (attrs) {
        bindings = Object.assign({}, bindings, attrs);
    }
    var attrsToCreate = [];
    var nameAdded;
    forEachKey(bindings, function (key, value) {
        var result = regex.exec(value || '');
        var attrName, attrValue;
        if (result) {
            attrName = result[2] || key;
            switch (result[1]) {
                case '&':
                    var val = parent[attrName];
                    if (isAnnotated(val)) {
                        attrValue = stringiFyAnnotatedFunction(val, attrName);
                    } else {
                        attrValue = attrName;
                    }
                    break;
                case '@':
                    attrValue = parent[value];
                    break;
                default:
                    attrValue = value;
                    break;
            }
        }
        attrsToCreate.push({
            attrName: snake_case(attrName),
            attrValue: attrValue
        });
    });

    if (nameAdded) {
        name = 'div';
    } else if (getDirectiveRestrict(directiveToCompile.restrict, directiveToCompile.name).indexOf('E') !== -1) {
        name = snake_case(name);
    } else {
        attrsToCreate.push({
            attrName: snake_case(name)
        });
        name = 'div';
    }

    return {
        controller: controllerToFectch,
        html: ['<' + name + ' ', attrsToCreate.map(function (value) {
            if (value.attrValue) {
                return value.attrName + '="' + value.attrValue + '"';
            } else {
                return value.attrName;
            }
        }).join(' '), ' ></' + name + '>'].join('')
    };
}

function stringiFyAnnotatedFunction(fn, name) {
    return name + '(' + (fn.$inject || fn.slice(0, -1)).join(',') + ')';
}

function isAnnotated(fn) {
    if (!fn) {
        return false;
    }
    if (Array.isArray(fn)) {
        if (typeof fn[fn.length - 1] === 'function') {
            let length = fn.length - 1;
            while (length--) {
                if (typeof fn[length] !== 'string') {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    return typeof fn === 'function' && !!fn.$inject;
}

