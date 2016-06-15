/**
 * jsmodels Data observer proxy
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 *
 * TODO: re-work listeners - emit and subscribe on a root supervisor
 */
const Schema = require('./Schema');

/**
 * Returns call stack path to the [file, line, column] of the
 * object modifier call, which caused validation error
 *
 * @returns {[string, number, number]}
 * @access private
 */
function callTrace() {
    let stackTrace = Error().stack.split(/\r?\n/);
    let found = false;

    for (let i = 0, s = stackTrace.length; i < s; i++) {
        let matched = stackTrace[i].indexOf('at Function.observe');

        if (found && !~matched) {
            matched = stackTrace[i].indexOf('at Proxy.<anonymous>');
        }

        if (found && !~matched) {
            return stackTrace[i]
                .replace(/^.*?\((.*?)\)/, '$1')
                .split(':')
                .map((val, i) => i > 0 ? parseInt(val, 10) : val);
        }

        if (~matched) {
            found = true;
        }
    }

    return new Array(3);
}

/**
 * Raises new validation error in a given errors container with the
 * given error code, generating corresponding error message from
 * error template using given template variables.
 * If shouldThrow is set to true will explicitly throw TypeError with
 * the corresponding error message.
 *
 * @param {object} errors
 * @param {boolean} shouldThrow
 * @param {number} code
 * @param {...string} templateVars
 * @access private
 */
function raiseError(errors, shouldThrow, code, ...templateVars) {
    let [file, line, column] = callTrace();
    let message = compile(code, ...templateVars);

    if (shouldThrow) {
        throw new TypeError(message);
    }

    errors[nextKey(errors)] = {
        code: code,
        message: message,
        fileName: file,
        lineNumber: line,
        columnNumber: column
    };
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
 * Data validation error template messages
 *
 * @type {Array}
 * @access private
 */
let errorTemplates = [
    'Data validation error: Unexpected property \'$0\' is present in data, ' +
        'but is not defined in schema!',
    'Data validation error: missing required property$0!',
    'Data validation error: Given data value is invalid!',
    'Data validation error: Given object expected to be of type \'$0\', but ' +
        '\'$1\' given!',
    'Data validation error: Given schema is invalid$0!'
];

/**
 * Compiles given data validation error template, replacing variables inside
 * it with the given arguments one-by-one
 *
 * @param {number} type
 * @param {...string} args
 * @returns {string}
 * @access private
 */
function compile(type, ...args) {
    let tpl = errorTemplates[type];

    for (let i = 0, s = args.length; i < s; i++) {
        tpl = tpl.replace(new RegExp('\\$' + i), args[i]);
    }

    return tpl;
}

/**
 * Generates and returns incremental numeric key for the given object
 * properties
 *
 * @param {object} obj
 * @returns {number}
 * @access private
 */
function nextKey(obj) {
    let keys = Object.keys(obj);
    let numbers = [];

    for (let i = 0, s = keys.length; i < s; i++) {
        let key = keys[i];

        if (!isNumeric(key)) {
            continue;
        }

        key = parseFloat(key);

        if (!Number.isInteger(key)) {
            continue;
        }

        numbers.push(key);
    }

    let next =  Math.max.apply(null, numbers);

    return isNaN(next) || !isFinite(next) ? 0 : ++next;
}

/**
 * Performs data validation through given schema.
 * If schema options is strict then it will throw TypeError on data validation
 * fail. It will also throw TypeError if given schema is invalid.
 * Schema expected to be of jsmodels type Schema.
 *
 * @throws TypeError
 * @param {*} data
 * @param {Schema} schema
 * @param {object} errors
 * @returns {boolean}
 * @access private
 */
function validate(data, schema, errors) {
    if (!(schema instanceof Schema)) {
        raiseError(
            errors,
            true,
            Observer.ERROR_SCHEMA,
            (schema.name ? ( ' for property \'' + schema.name) : '\'')
        );
    }

    let objType = schema.typeOf(data);
    let schemaType = schema.type;
    let isStrict = schema.options.strict;
    let isValid = true;

    if (schemaType === 'array' &&
        objType === 'array' &&
        schema.items.type !== 'object'
    ) {
        for (let i = 0, s = data.length; i < s; i++) {
            isValid = isValid && validate(
                data[i],
                schema.items,
                errorsOf(errors, i)
            );
        }
    }

    else if (schemaType === 'object' && objType === 'object') {
        let props = Object.keys(data);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];

            if (!(prop in schema.properties)) {
                raiseError(
                    errorsOf(errors, prop),
                    isStrict,
                    Observer.ERROR_UNEXPECTED,
                    prop
                );

                isValid = false;
            }
        }

        props = Object.keys(schema.properties);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];
            let propSchema = schema.properties[prop];

            if (propSchema.required) {
                isValid = isValid && validate(
                    data[prop],
                    propSchema,
                    errors
                );
            }
        }
    }

    else {
        let validator = schema.validator || function() { return true; };

        if (schema.required && typeof data === 'undefined') {
            raiseError(
                errors,
                isStrict,
                Observer.ERROR_REQUIRED,
                schema.name ? ' \'' + schema.name + '\'' : ''
            );

            isValid = false;
        }

        else if (!validator(data)) {
            raiseError(
                errors,
                isStrict,
                Observer.ERROR_INVALID
            );

            isValid = false;
        }

        else if (objType !== schemaType) {
            raiseError(
                errors,
                isStrict,
                Observer.ERROR_REQUIRED,
                schemaType,
                objType
            );

            isValid = false;
        }
    }

    return isValid;
}

/**
 * Returns true if a given type is a primitive type, false otherwise
 *
 * @param {string} type
 * @returns {boolean}
 * @access private
 */
function isPrimitive(type) {
    return !(type === 'object' || type === 'array');
}

/**
 * Constructs children error containers for a given errors container and
 * returns the last container in the chain.
 *
 * @param {object} errors
 * @param {...string|number} names
 * @returns {object}
 * @access private
 */
function errorsOf(errors, ...names) {
    for (let i = 0, s = names.length; i < s; i++) {
        let name = names[i];

        errors = (errors[name] || (errors[name] = {}));
    }

    return errors;
}

/**
 * @class Observer
 * @classdesc Creates and manipulates observable data objects
 */
class Observer {

    /**
     * This function returns proxy to a given data object (expected to be either
     * object or array type).
     * It upsets automatic data check listeners, so on each data modification
     * of the object it generates validation errors. Validation is done using
     * definition of the given schema, which should be assosiated with given
     * object.
     * Throws type error if given schema is invalid.
     *
     * @throws {TypeError}
     * @param {*} data
     * @param {Schema} schema
     * @param {object} errors
     * @param {object} listeners
     * @returns {Proxy|*}
     */
    static observe(data, schema, errors, listeners) {
        if ((data && data.__isObserved__) || !data) {
            return data;
        }

        validate(data, schema, errors);

        let objType = schema.typeOf(data);
        let schemaType = schema.type;
        let isArray = schemaType === 'array';
        let isObject = schemaType === 'object';
        let isStrict = schema.options.strict;

        if (objType !== schemaType) {
            data = schema.cast(data);
        }

        if (isArray) {
            for (let i = 0, s = data.length; i < s; i++) {
                if (data[i].__isObserved__) {
                    continue;
                }

                data[i] = Observer.observe(
                    data[i],
                    schema.items,
                    errorsOf(errors, i),
                    listeners
                );
            }
        }

        else if (isObject) {
            let props = Object.keys(data);

            for (let i = 0, s = props.length; i < s; i++) {
                let prop = props[i];
                let propSchema = schema.properties[prop];

                if (!propSchema || data[prop].__isObserved__) {
                    continue;
                }

                data[prop] = Observer.observe(
                    data[prop],
                    propSchema,
                    errorsOf(errors, prop),
                    listeners
                );
            }
        }

        let handler = {
            get(target, property) {
                if (typeof target[property] !== 'function') {
                    return target[property];
                }

                if (!(data instanceof Array)) {
                    return target[property].bind(target);
                }

                return function() {
                    let args = [...arguments];
                    let shift = property === 'splice' ? 2 : 0;

                    for (let i = shift, s = args.length; i < s; i++) {
                        args[i] = Observer.observe(
                            args[i],
                            schema.items,
                            errorsOf(errors, property),
                            listeners
                        );
                    }

                    return target[property].apply(target, args);
                };

            },
            set(target, property, value) {
                if (isArray) {
                    if (!isNumeric(property)) {
                        return target[property] = value;
                    }

                    return (target[property] = Observer.observe(
                        value,
                        schema.items,
                        errors,
                        listeners
                    ));
                }

                if (isObject) {
                    if (property in schema.properties) {
                        return (target[property] = Observer.observe(
                            value,
                            schema.properties[property],
                            errors,
                            listeners
                        ));
                    }

                    raiseError(
                        errorsOf(errors, property),
                        isStrict,
                        Observer.ERROR_UNEXPECTED,
                        property
                    );
                }

                return (target[property] = value);
            }
        };

        return isPrimitive(schema.type) ? data :
            Object.defineProperty(new Proxy(data, handler), '__isObserved__', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: true
            }
        );
    }

}

Observer.ERROR_UNEXPECTED = 0;
Observer.ERROR_REQUIRED = 1;
Observer.ERROR_INVALID = 2;
Observer.ERROR_TYPE = 3;
Observer.ERROR_SCHEMA = 4;

module.exports = Observer;
