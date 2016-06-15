/**
 * jsmodels Data observer proxy
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 *
 * TODO: re-work errors - access and listing on a root supervisor
 * TODO: re-work listeners - emit and subscribe on a root supervisor
 */
const Schema = require('./Schema');
const UUID = require('./UUID');
const ErrorIndex = require('./ErrorIndex');

/**
 * Store for created supervisor objects
 *
 * @type {WeakMap}
 */
let metadata = new WeakMap();

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
            return stackTrace[i]
                .replace(/^.*?\((.*?)\)/, '$1')
                .split(':');
        }

        if (~matched) {
            found = true;
        }
    }

    return Array(3);
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
 * Rases new error storage for a given property. If error provided it will
 * be directly upset to error storage for the given property.
 *
 * @param {object} errors
 * @param {string} prop
 * @param {object} [error]
 * @access private
 */
function raise(errors, prop, error) {
    errors[prop] = errors[prop] || (errors[prop] = {
        direct: [],
        internal: {}
    });

    error && errors[prop].direct.push(error);

    return errors[prop];
}

/**
 * Data validation error template messages
 *
 * @type {{
 *  unexpected: string,
 *  required: string,
 *  invalid: string,
 *  type: string
 * }}
 * @access private
 */
let errorTemplates = {
    unexpected: 'Data validation error: Unexpected property ' +
        '"$0" is present in data, but is not defined ' +
        'in schema!',
    required: 'Data validation error: missing required property$0!',
    invalid: 'Data validation error: Given data value is invalid!',
    type: 'Data validation error: Given object expected to be of ' +
        'type "$0", but "$1" given!'
};

/**
 * Compiles given data validation error template, replacing variables inside
 * it with the given arguments one-by-one
 *
 * @param {string} type
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
 * Performs data validation through given schema.
 * If schema options is strict then it will throw TypeError on data validation
 * fail. It will also throw TypeError if given schema is invalid.
 * Schema expected to be of jsmodels type Schema.
 *
 * @throws TypeError
 * @param {*} obj
 * @param {Schema} schema
 * @param {object} errors
 * @param {null|string} [name]
 * @returns {boolean}
 * @access private
 */
function validate(obj, schema, errors, name = null) {
    if (!(schema instanceof Schema)) {
        throw new TypeError('Data validation error: Given schema is invalid' +
            (name && ('for property ' + name)) + '!');
    }

    let trace = callTrace();
    let objType = schema.typeOf(obj);
    let schemaType = schema.type;
    let isStrict = schema.options.strict;
    let isValid = true;

    if (schemaType === 'array' &&
        objType === 'array' &&
        schema.items.type !== 'object'
    ) {
        for (let i = 0, s = obj.length; i < s; i++) {
            isValid = isValid && validate(
                obj[i], schema.items, raise(errors.internal, i), i);
        }
    }

    else if (schemaType === 'object' && objType === 'object') {
        let props = Object.keys(obj);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];

            if (!(prop in schema.properties)) {
                isValid = false;

                if (isStrict) {
                    throw new TypeError(
                        compile(Observer.ERROR_UNEXPECTED, prop)
                    );
                }

                raise(errors.internal, prop, {
                    type: Observer.ERROR_UNEXPECTED,
                    file: trace[0],
                    line: trace[1],
                    column: trace[2]
                });
            }
        }

        props = Object.keys(schema.properties);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];
            let propSchema = schema.properties[prop];

            if (propSchema.required) {
                isValid = isValid && validate(
                    obj[prop], propSchema, raise(errors.internal, prop), prop);
            }
        }
    }

    else {
        let validator = schema.validator || function() { return true; };

        if (schema.required && typeof obj === 'undefined') {
            isValid = false;

            if (isStrict) {
                throw new TypeError(
                    compile(Observer.ERROR_REQUIRED,
                        name ? ' "' +name+ '"' : '')
                );
            }

            errors.direct.push({
                type: Observer.ERROR_REQUIRED,
                file: trace[0],
                line: trace[1],
                column: trace[2]
            });
        }

        else if (!validator(obj)) {
            isValid = false;

            if (isStrict) {
                throw new TypeError(compile(Observer.ERROR_INVALID));
            }

            errors.direct.push({
                type: Observer.ERROR_INVALID,
                file: trace[0],
                line: trace[1],
                column: trace[2]
            });
        }

        else if (objType !== schemaType) {
            isValid = false;

            if (isStrict) {
                throw new TypeError(
                    compile(Observer.ERROR_TYPE, schemaType, objType));
            }

            errors.direct.push({
                type: Observer.ERROR_TYPE,
                file: trace[0],
                line: trace[1],
                column: trace[2]
            });
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
     * @param {object|Array} obj
     * @param {Schema} schema
     * @param {boolean} [identifiable]
     * @param {object} [errors]
     * @returns {Proxy|*}
     */
    static observe(obj, schema, identifiable = true, errors) {
        errors = errors || {
            direct: [],
            internal: {}
        };

        validate(obj, schema, errors);

        let trace = callTrace();
        let objType = schema.typeOf(obj);
        let schemaType = schema.type;
        let isArray = schemaType === 'array';
        let isObject = schemaType === 'object';
        let isStrict = schema.options.strict;
        let supervised;

        if (objType !== schemaType) {
            obj = schema.cast(obj);
        }

        if (isArray) {
            for (let i = 0, s = obj.length; i < s; i++) {
                obj[i] = Observer.observe(
                    obj[i],
                    schema.items,
                    identifiable,
                    raise(errors.internal, i)
                );
            }
        }

        else if (isObject) {
            let props = Object.keys(obj);

            for (let i = 0, s = props.length; i < s; i++) {
                let prop = props[i];
                let propSchema = schema.properties[prop];

                if (!propSchema) {
                    continue;
                }

                obj[prop] = Observer.observe(
                    obj[prop],
                    propSchema,
                    identifiable,
                    raise(errors.internal, prop)
                );
            }
        }

        let handler = {
            get(target, property) {
                if (typeof target[property] !== 'function') {
                    return target[property];
                }

                if (!(obj instanceof Array)) {
                    return target[property].bind(target);
                }

                return function() {
                    let args = [...arguments];
                    let shift = property === 'splice' ? 2 : 0;

                    for (let i = shift, s = args.length; i < s; i++) {
                        args[i] = Observer.observe(
                            args[i],
                            schema.items,
                            identifiable,
                            raise(errors.internal, i)
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
                        identifiable,
                        raise(errors.internal, property)
                    ));
                }

                if (isObject) {
                    if (property in schema.properties) {
                        return (target[property] = Observer.observe(
                            value,
                            schema.properties[property],
                            identifiable,
                            raise(errors.internal, property)
                        ));
                    }

                    if (isStrict) {
                        throw new TypeError(
                            compile(Observer.ERROR_UNEXPECTED, property)
                        );
                    }

                    raise(errors.internal, property, {
                        type: Observer.ERROR_UNEXPECTED,
                        file: trace[0],
                        line: trace[1],
                        column: trace[2]
                    });
                }

                return (target[property] = value);
            },
            
        };

        supervised = isPrimitive(schema.type) ? obj : new Proxy(obj, handler);

        if (!schema.parent) {
            let meta = {
                schema: schema,
                errors: errors,
                listeners: {}
            };

            identifiable && Object.defineProperty(meta, 'uuid', {
                configurable: false,
                enumerable: true,
                writable: false,
                value: UUID()
            });

            metadata.set(supervised, meta);
        }

        return supervised;
    }

    /**
     * Emits given event on a given supervised object, bypassing to each
     * called event handler given args
     *
     * @param {Proxy} supervised
     * @param {string} event
     * @param {...*} args
     * @returns {Observer}
     * @access public
     */
    static emit(supervised, event, ...args) {
        let listeners = Observer.listeners(supervised, event);

        for (let i = 0, s = listeners.length; i < s; i++) {
            listeners[i].apply(supervised, args);
        }

        return Observer;
    }

    /**
     * Resisters given event handlers for a given supervised object.
     *
     * @param {Proxy} supervised
     * @param {string} event
     * @param {...Function} handlers
     * @returns {Observer}
     * @access public
     */
    static on(supervised, event, ...handlers) {
        let listeners = Observer.listeners(supervised, event);

        listeners.push.apply(listeners, handlers);

        return Observer;
    }

    /**
     * Removes a given handler from a given event listeners on a given
     * supervised object.
     *
     * @param {Proxy} supervised
     * @param {string} event
     * @param {...Function} handlers
     * @returns {Observer}
     * @access public
     */
    static off(supervised, event, ...handlers) {
        let listeners = Observer.listeners(supervised, event);

        for (let i = 0, s = handlers.length; i < s; i++) {
            let handler = handlers[i];
            let index;

            while (~(index = listeners.indexOf(handler))) {
                listeners.splice(index, 1);
            }
        }

        return Observer;
    }

    /**
     * Removes all listeners from a given event on a given supervised object.
     *
     * @param {Proxy} supervised
     * @param {string} event
     * @returns {Observer}
     * @access public
     */
    static removeAllListeners(supervised, event) {
        let listeners = Observer.listeners(supervised);
        
        if (event) {
            delete listeners[event];
            listeners[event] = [];

            return Observer;
        }

        let events = Object.keys(listeners);
        let s = events.length;

        for (let i = 0; i < s; i++) {
            let event = events[i];

            delete listeners[event];
            listeners[event] = [];
        }

        return Observer;
    }

    /**
     * Returns all errors generated for given supervised object.
     *
     * @param {Proxy} supervised
     * @returns {ErrorIndex}
     * @access public
     */
    static errors(supervised) {
        return new ErrorIndex(Observer.get(supervised).errors);
    }

    /**
     * Returns all listeners for a given supervised object. If event name is
     * specified it will return only listeners related.
     *
     * @param {Proxy} supervised
     * @param {string} [event]
     * @returns {*}
     * @access public
     */
    static listeners(supervised, event) {
        if (event) {
            let listeners = Observer.get(supervised).listeners;

            if (typeof listeners[event] === 'function') {
                listeners[event] = [listeners[event]];
            }

            if (!(listeners[event] instanceof Array)) {
                listeners[event] = [];
            }

            return listeners[event];
        }

        return Observer.get(supervised).listeners;
    }

    /**
     * Returns Unified Unique Identifier of a given supervised object
     * if it was previously registered as identifiable object, otherwise it
     * will return undefined.
     *
     * @param {Proxy} supervised
     * @returns {string|undefined}
     * @access public
     */
    static uuid(supervised) {
        return Observer.get(supervised).uuid;
    }

    /**
     * Returns metadata associated with a given supervised object.
     *
     * @param {Proxy} supervised
     * @returns {{
     *  listeners: object
     *  errors: object
     * }}
     */
    static get(supervised) {
        return metadata.get(supervised) || {};
    }

}

Observer.ERROR_UNEXPECTED = 'unexpected';
Observer.ERROR_REQUIRED = 'required';
Observer.ERROR_INVALID = 'invalid';
Observer.ERROR_TYPE = 'type';

Observer.addListener = Observer.on;
Observer.removeListener = Observer.off;

module.exports = Observer;
