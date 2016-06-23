/**
 * jsmodels Data observer proxy
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const Schema = require('./Schema');
const EventEmitter = require('./EventEmitter');
const core = require('./core');

const isPrimitive = core.isPrimitive;
const isNumeric = core.isNumeric;

/**
 * Looking up for a given substring in a given trace
 * and returns line number index. if nothing found will return false
 *
 * @param {Array} trace
 * @param {string} what
 * @returns {number|false}
 * @access private
 */
function lookup(trace, what) {
    let i = 0;
    let s = trace.length;

    for (; i < s; i++) {
        let matched = ~trace[i].indexOf('at ' + callTrace.name);

        if (matched) {
            for (i += 1; i < s; i++) {
                matched = ~trace[i].indexOf(what);

                if (matched) {
                    return ++i;
                }
            }
        }
    }

    return false;
}

/**
 * Returns call stack path to the [file, line, column] of the
 * object modifier call, which caused validation error
 *
 * @returns {[string, number, number]}
 * @access private
 */
function callTrace() {
    Error.stackTraceLimit = Infinity;

    let trace = new Error().stack.split(/\r?\n/);
    let index = lookup(trace, '.set [as data]');
    
    if (index === false) {
        index = lookup(trace, 'at Object.set ');
    }

    if (index === false) {
        index = lookup(trace, 'at Proxy.');
    }

    if (index === false) {
        return Array(4);
    }

    return trace[index]
        .replace(/^.*?\((.*?)\)/, '$1')
        .split(':')
        .map((val, i) => i > 0 ? parseInt(val, 10) : val)
        .concat([trace.slice(1).map(line => line.trim())]);

    return new Array(4);
}

/**
 * Raises new validation error in a given errors container with the
 * given error code, generating corresponding error message from
 * error template using given template variables.
 * If shouldThrow is set to true will explicitly throw TypeError with
 * the corresponding error message.
 *
 * @param {Array} errors
 * @param {EventEmitter} subscriber
 * @param {Schema} schema
 * @param {string|null} propPath
 * @param {*} value
 * @param {boolean} shouldThrow
 * @param {number} code
 * @param {...string} vars
 * @access private
 */
function raiseError(errors, subscriber, schema, propPath, value, shouldThrow,
                    code, ...vars)
{
    let message = compile(code, ...vars);
    let error = {
        code: code,
        message: message,
        varName: schema.name || (schema.parent && schema.parent.type === 'array'
            ? schema.parent.name : ''),
        varValue: value,
        varPath: propPath
    };

    if (shouldThrow) {
        throw new TypeError(message);
    }

    if (Observer.options.traceErrors) {
        let [file, line, column, trace] = callTrace();

        Object.assign(error, {
            fileName: file,
            lineNumber: line,
            columnNumber: column
        });

        if (Observer.options.fullTrace) {
            error.stack = trace;
        }
    }

    errors.push(error);
    subscriber.emit('invalidate', error);
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
    'Data validation error: Given schema is invalid! Expected schema to be ' +
        'instance of Schema.',
    'Data validation error: Given listeners object is invalid! Expected ' +
        'listeners to be instance of EventEmitter.'
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
    let i = 0;
    let s = args.length;

    for (; i < s; i++) {
        tpl = tpl.replace(new RegExp('\\$' + i, 'g'), args[i]);
    }

    return tpl;
}

/**
 * Checks if a given data value is observed or not
 *
 * @param {*} data
 * @returns {boolean}
 * @access private
 */
function isObserved(data) {
    return (data !== void 0 &&
        data !== null &&
        typeof data['__isObserved__'] !== 'undefined' &&
        data['__isObserved__']);
}

/**
 * Marks given data as observed
 *
 * @param {*} data
 * @returns {*}
 * @access private
 */
function markObserved(data) {
    if (isObserved(data) || isPrimitive(typeof data)) {
        return data;
    }

    return Object.defineProperty(data, '__isObserved__', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: true
    });
}

/**
 * Checks if a given data value has been validated already or not
 *
 * @param {*} data
 * @returns {boolean}
 * @access private
 */
function isValidated(data) {
    return (data !== void 0 &&
        data !== null &&
        typeof data['__isValidated__'] !== 'undefined' &&
        data['__isValidated__']);
}

/**
 * Marks given data as being validated
 *
 * @param {*} data
 * @returns {*}
 * @access private
 */
function markValidated(data) {
    if (isObserved(data) || isPrimitive(typeof data)) {
        return data;
    }

    return Object.defineProperty(data, '__isValidated__', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: true
    });
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
 * @param {Array} errors
 * @param {EventEmitter} subscriber
 * @param {string|null} [propPath]
 * @returns {boolean}
 * @access private
 */
function validate(data, schema, errors, subscriber, propPath = null) {
    markValidated(data);

    let objType = schema.typeOf(data);
    let schemaType = schema.type;
    let isStrict = schema.options.strict;
    let isValid = true;
    let validator = schema.validate || function() { return true; };

    if (schema.required && data === void 0) {
        raiseError(errors, subscriber, schema, propPath, data, isStrict,
            Observer.ERROR_REQUIRED, schema.name ?
                ' \'' + schema.name + '\'' : '');

        isValid = false;
    }

    else if (objType !== schemaType) {
        raiseError(errors, subscriber, schema, propPath, data, isStrict,
            Observer.ERROR_TYPE, schemaType, objType);

        isValid = false;
    }

    else if (!validator(data)) {
        raiseError(errors, subscriber, schema, propPath, data, isStrict,
            Observer.ERROR_INVALID);

        isValid = false;
    }

    else if (schemaType === 'array') {
        let i = 0;
        let s = data.length;
        let path = (propPath ? propPath + '.' : '');

        for (; i < s; i++) {
            if (!validate(data[i], schema.items, errors, subscriber,
                    path + i))
            {
                isValid = false;
            }
        }
    }

    else if (schemaType === 'object') {
        let props = Object.keys(data);
        let path = (propPath ? propPath + '.' : '');

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];

            if (!(prop in schema.properties)) {
                raiseError(errors, subscriber, schema, path + prop, data[prop],
                    isStrict, Observer.ERROR_UNEXPECTED, prop);

                isValid = false;
            }
        }

        props = Object.keys(schema.properties);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];
            let propSchema = schema.properties[prop];

            if (propSchema.required) {
                if (!validate(data[prop], propSchema, errors, subscriber,
                        path + prop)) {
                    isValid = false;
                }
            }
        }
    }

    return isValid;
}

/**
 * Observer global options
 *
 * @property {{
 *  traceErrors: boolean,
 *  fullTrace: boolean
 * }} Observer.options
 * @static
 * @access public
 */
const options = {
    /**
     * Turns on/off trace information in errors. It defines whenever
     * 'fileName', 'lineNumber' and 'columnNumber' property will appear
     * in errors or not. It is good idea to turn it on in development
     * or testing environments to collect information about errors and the
     * actual place in code causing them.
     * On production environment it is recommended to turn it off for
     * performance and turn it on for debugging purposes only.
     *
     * @property {boolean} Observer.options.traceErrors
     * @static
     * @access public
     */
    traceErrors: true,

    /**
     * Turns on/off full trace information in errors. It defines whenever
     * 'stack' property should appear on error objects or not.
     * It is good idea to turn it on in development
     * or testing environments to collect information about errors and the
     * actual place in code causing them.
     * On production environment it is recommended to turn it off for
     * performance and turn it on for debugging purposes only.
     *
     * @property {boolean} Observer.options.fullTrace
     * @static
     * @access public
     */
    fullTrace: false,

    /**
     * This options enables/disables upsetting of invalid values, when the
     * given value is set to the target. By default it is allowed, so
     * observer will just generate an invalid value error and proceed
     * modifying data.
     *
     * @property {boolean} Observer.options.allowInvalid
     * @static
     * @access public
     */
    allowInvalid: true
};

/**
 * @class Observer
 * @classdesc Creates and manipulates observable data objects
 */
class Observer {

    /**
     * Merge observed data target with the data from a given source,
     * using the given schema
     * Errors would be writted to a given errors container, emitting
     * an events for a given subscriber
     *
     * @param {*} target
     * @param {*} source
     * @param {Schema} schema
     * @param {Array} errors
     * @param {EventEmitter} subscriber
     * @param {string|null} [propPath]
     * @access public
     * @static
     */
    static merge(target, source, schema, errors, subscriber, propPath = null) {
        if (!(schema instanceof Schema)) {
            // invalid schema interface provided - throw error!
            raiseError(errors, subscriber, schema, null, source, true,
                Observer.ERROR_SCHEMA);
        }

        if (!(subscriber instanceof EventEmitter)) {
            // invalid subscriber interface provided - throw error
            raiseError(errors, subscriber, schema, null, source, true,
                Observer.ERROR_LISTENERS);
        }

        let sameType = schema.typeOf(source) === schema.type;
        let isStrict = schema.options.strict;

        if (!sameType) {
            // todo: merge different types, really?
            return ;
        }

        // primitives
        if (isPrimitive(schema.type)) {
            throw new TypeError('Trying to merge primitive value!');
        }

        // array
        if (schema.type === 'array') {
            let targetLength = target.length;
            let sourceLength = source.length;
            let primitive = isPrimitive(schema.items.type);
            let path = (propPath ? propPath + '.' : '') +
                schema.name + (schema.name ? '.' : '');
            let i, pos;

            if (sourceLength <= targetLength) {
                // remove obsolete items from the target
                target.splice(sourceLength);
                i = sourceLength;
            }

            else {
                pos = targetLength;
            }

            if (i > 0) {
                for (i = 0; i < targetLength; i++) {
                    if (primitive) {
                        target[i] = source[i];
                    }

                    else {
                        // merge recursively
                        target[i] = Observer.merge(
                            target[i],
                            source[i],
                            schema.items,
                            errors,
                            subscriber,
                            path + i
                        );
                    }
                }
            }

            if (sourceLength - pos > 0) {
                for (; pos < sourceLength; pos++) {
                    target[pos] = Observer.observe(
                        source[i],
                        schema.items,
                        errors,
                        subscriber,
                        path + pos
                    );
                }
            }

            return target;
        }

        // object
        // the rule: if property is not defined on object - keep an old value
        //           if property is defined on object and has value undefined - 
        //           remove it

        let props = Object.keys(source);
        let i = 0;
        let s = props.length;

        for (; i < s; i++) {
            let prop = props[i];
            let path = (propPath ? propPath + '.' : '');

            if (!(prop in schema.properties)) {
                if (Observer.options.allowInvalid) {
                    target[prop] = Observer.observe(
                        source[prop],
                        schema.properties[prop],
                        errors,
                        subscriber,
                        path + prop
                    );
                }
            }

            else if (source[prop] === void 0) {
                delete target[prop];
            }

            if (isPrimitive(schema.properties[prop].type)) {
                target[prop] = source[prop];
            }

            else {
                target[prop] = Observer.merge(
                    target[prop],
                    source[prop],
                    schema.properties[prop],
                    errors,
                    subscriber,
                    path + prop
                );
            }
        }

        return target;
    }

    /**
     * This function returns proxy to a given data object (expected to be either
     * object or array type).
     * It upsets automatic data check subscriber, so on each data modification
     * of the object it generates validation errors. Validation is done using
     * definition of the given schema, which should be assosiated with given
     * object.
     * Throws type error if given schema is invalid.
     *
     * @throws {TypeError}
     * @param {*} data
     * @param {Schema} schema
     * @param {Array} errors
     * @param {EventEmitter} subscriber
     * @param {string|null} propPath
     * @returns {Proxy|*}
     */
    static observe(data, schema, errors, subscriber, propPath = null) {
        if (!(schema instanceof Schema)) {
            // invalid schema interface provided - throw error!
            raiseError(errors, subscriber, schema, null, data, true,
                Observer.ERROR_SCHEMA);
        }

        if (!(subscriber instanceof EventEmitter)) {
            // invalid subscriber interface provided - throw error
            raiseError(errors, subscriber, schema, null, data, true,
                Observer.ERROR_LISTENERS);
        }

        if (isObserved(data)) {
            // smells like an attempt to observe proxy recursively,
            // so break this recursion here
            return data;
        }

        if (!isValidated(data)) {
            validate(data, schema, errors, subscriber, propPath);
        }

        let schemaType = schema.type;
        let isArray = schemaType === 'array';
        let isObject = schemaType === 'object';
        let isStrict = schema.options.strict;

        if (isArray) {
            let i = 0;
            let s = data.length;
            let path = (propPath ? propPath + '.' : '');

            for (; i < s; i++) {
                if (isObserved(data[i])) {
                    continue;
                }

                data[i] = Observer.observe(
                    data[i],
                    schema.items,
                    errors,
                    subscriber,
                    path + i
                );
            }
        }

        else if (isObject) {
            let props = Object.keys(data);
            let i = 0;
            let s = props.length;

            for (; i < s; i++) {
                let prop = props[i];
                let propSchema = schema.properties[prop];
                let path = (propPath ? propPath + '.' : '');

                if (!propSchema || isPrimitive(typeof data[prop]) ||
                    isObserved(data[prop]))
                {
                    continue;
                }

                data[prop] = Observer.observe(
                    data[prop],
                    propSchema,
                    errors,
                    subscriber,
                    path + prop
                );
            }
        }

        let handler = {
            get(target, property) {
                // simple property get request - return data
                if (typeof target[property] !== 'function') {
                    return target[property];
                }

                // it's a function property request - skip if the target
                // is not array or requested function is not adding new elements
                // to the array by its logic
                if (schema.typeOf(target) !== 'array' ||
                    !~['splice', 'push', 'unshift', 'fill'].indexOf(property))
                {
                    return target[property].bind(target);
                }

                // replace called function with our observable method
                return function() {
                    let args = [...arguments];
                    let i = property === 'splice' ? 2 : 0;
                    let s = args.length;
                    let path = (propPath ? propPath + '.' : '');

                    for (; i < s; i++) {
                        if (isObserved(args[i])) {
                            continue;
                        }

                        args[i] = Observer.observe(
                            args[i],
                            schema.items,
                            errors,
                            subscriber,
                            path + property + '.' + i
                        );
                    }

                    if (!Observer.options.allowInvalid) {
                        return ;
                    }

                    return target[property].apply(target, args);
                };

            },
            set(target, property, value) {
                let path = (propPath ? propPath + '.' : '');

                // array
                if (isArray) {
                    if (!isNumeric(property) || isObserved(value)) {
                        target[property] = value;

                        return true;
                    }

                    if (!Observer.options.allowInvalid &&
                        !validate(value, schema.items, errors, subscriber,
                            path + property))
                    {
                        return true;
                    }

                    target[property] = Observer.observe(
                        value,
                        schema.items,
                        errors,
                        subscriber,
                        path + property
                    );

                    return true;
                }

                // object
                if (isObject) {
                    if (property in schema.properties) {
                        if (!Observer.options.allowInvalid &&
                            !validate(value, schema.properties[property],
                                errors, subscriber, path + property))
                        {
                            return true;
                        }

                        target[property] = Observer.observe(
                            value,
                            schema.properties[property],
                            errors,
                            subscriber,
                            path + property
                        );

                        return true;
                    }

                    raiseError(errors, subscriber, schema, path + property,
                        value, isStrict, Observer.ERROR_UNEXPECTED, property);

                    return true;
                }

                // primitives
                target[property] = value;

                return true;
            },
            deleteProperty(target, property) {
                if (schema.type === 'object' &&
                    property in schema.properties &&
                    schema.properties[property].required)
                {
                    raiseError(errors, subscriber, schema.properties[property],
                        propPath, target[property],  isStrict,
                        Observer.ERROR_REQUIRED, schema.name ?
                            ' \'' + schema.name + '\'' : '');

                    if (!Observer.options.allowInvalid) {
                        return ;
                    }
                }

                delete target[property];
            }
        };

        return isPrimitive(typeof data) ? data :
            markObserved(new Proxy(data, handler));
    }
}

/**
 * Error code for properties appeared in data but is not expecting to be there
 * by data schema definition.
 *
 * @property {number} Observer.ERROR_UNEXPECTED
 * @static
 * @access public
 */
Observer.ERROR_UNEXPECTED = 0;

/**
 * Error code for properties which are defined as required in data schema
 * definition but was not found in actual data.
 *
 * @property {number} Observer.ERROR_REQUIRED
 * @static
 * @access public
 */
Observer.ERROR_REQUIRED = 1;

/**
 * Error code for values which has defined validate function in schema and
 * the validation during check was not passed on actual data.
 *
 * @property {number} Observer.ERROR_INVALID
 * @static
 * @access public
 */
Observer.ERROR_INVALID = 2;

/**
 * Error code for values which has incorrect type in actual data in
 * comparison to the type defined in data schema.
 *
 * @property {number} Observer.ERROR_TYPE
 * @static
 * @access public
 */
Observer.ERROR_TYPE = 3;

/**
 * Error code for situations when the schema, bypassed with the data is invalid.
 *
 * @property {number} Observer.ERROR_SCHEMA
 * @static
 * @access public
 */
Observer.ERROR_SCHEMA = 4;

/**
 * Error code for situations when bypassed listeners object is invalid.
 *
 * @property {number} Observer.ERROR_LISTENERS
 * @static
 * @access public
 */
Observer.ERROR_LISTENERS = 5;

Object.defineProperty(Observer, 'options', {
    enumerable: true,
    configurable: true,
    get() { return options; },
    set(value) { Object.assign(options, value); }
});

module.exports = Observer;
