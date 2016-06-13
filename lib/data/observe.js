/**
 * jsmodels Data observer proxy
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const Schema = require('../Schema');

/**
 * Observe errors storage
 *
 * @type {Map}
 * @access private
 */
let errors = new Map();

/**
 * Returns call stack path to the [file, line, column] of the
 * object modifier call, which caused validation error
 *
 * @returns {[string, number, number]}
 * @access private
 */
function callTrace() {
    return Error().stack
        .split(/\r?\n/)[5]
        .replace(/^.*?\((.*?)\)/, '$1')
        .split(':');
}

/**
 * Validates given arguments through given schema and define errors
 * if validation of each argument is not successful
 *
 * @param {*} target
 * @param {string} property
 * @param {Array} args
 * @param {Schema} schema
 * @param {number} shift
 * @access private
 */
function validateArgs(target, property, args, schema, shift = 0) {
    let callPath = callTrace();

    for (let i = 0, s = args.length; i < s; i++) {
        let item = args[i];
        let type = schema.typeOf(item);
        let isValidType = type === schema.type;
        let isValid = schema.validator(item);
        let valid = isValidType && isValid;

        if (!valid) {
            let validationErrors = errors.get(target) || new Map();

            validationErrors.get(property) ||
                validationErrors.set(property, []);

            validationErrors.get(property).push({
                target: args,
                property: i + shift,
                value: args[i],
                invalidType: !isValidType,
                invalidValue: !isValid,
                file: callPath[0],
                line: callPath[1],
                column: callPath[2]
            });

            errors.set(target, validationErrors);
        }
    }
}

/**
 * Performs validation of the given value for given property
 * on a given target object using given schema. If validation is not passed
 * it will fill validation errors
 *
 * @param {*} target
 * @param {string} property
 * @param {*} value
 * @param {Schema} schema
 * @access private
 */
function validate(target, property, value, schema) {
    let callPath = callTrace();
    let method = 'set';
    let type = schema.typeOf(value);
    let isValidType = type === schema.type;
    let isValid = schema.validator(value);
    let valid = isValidType && isValid;

    if (!valid) {
        let validationErrors = errors.get(target) || new Map();

        validationErrors.get(method) || validationErrors.set(method, []);
        validationErrors.get(method).push({
            target: target,
            property: property,
            value: value,
            invalidType: !isValidType,
            invalidValue: !isValid,
            file: callPath[0],
            line: callPath[1],
            column: callPath[2]
        });

        errors.set(target, validationErrors);
    }
}

/**
 * Checks if a given n is a numeric value
 *
 * @param {*} n
 * @returns {boolean}
 * @access private
 */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * This function returns proxy to a given data object (expected to be either
 * object or array type).
 * It upsets automatic data check listeners, so on each data modification
 * of the object it generates validation errors. Validation is done using
 * definition of the given schema, which should be assosiated with given
 * object.
 *
 * @param {*} obj
 * @param {Schema} schema
 * @returns {Proxy}
 */
function observe(obj, schema) {
    if (!(schema instanceof Schema)) {
        throw new TypeError('Given schema is invalid!');
    }

    let handler = {
        get(target, property) {
            if (typeof target[property] === 'function') {
                return obj instanceof Array ? function() {
                    let args = [...arguments];
                    let shift = 0;

                    if (property == 'splice') {
                        shift = 2;
                        args = args.slice(shift);
                    }

                    validateArgs(target, property, args, schema.items, shift);

                    return target[property].apply(target, arguments);
                } : target[property].bind(target);
            }

            return target[property];
        },
        set(target, property, value) {
            validate(obj, property, value,
                target instanceof Array && isNumeric(value) ?
                    schema.items : schema);

            target[property] = value;
        }
    };

    return new Proxy(obj, handler);
}

/**
 * Errors map, containing all validation errors found during data
 * modifications
 *
 * @type {Map}
 * @access public
 */
observe.errors = errors;

module.exports = observe;
