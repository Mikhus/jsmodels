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

/**
 * Store for created supervisor objects
 *
 * @type {Map}
 */
let metadata = new Map();

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
 * Constructs and returns default metadata object
 *
 * @param {boolean} identifiable
 * @returns {{
 *  listeners: object,
 *  errors: object,
 *  children: object,
 *  parent: null|object,
 *  uuid: string|undefined
 * }}
 */
function defaultMetadata(identifiable) {
    let data = {
        listeners: {},
        errors: {},
        children: {},
        parent: null
    };

    if (identifiable) {
        Object.defineProperty(data, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: UUID()
        });
    }

    return data;
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
 * Performs data validation through given schema.
 * If schema options is strict then it will throw TypeError on data validation
 * fail. It will also throw TypeError if given schema is invalid.
 * Schema expected to be of jsmodels type Schema.
 *
 * @throws TypeError
 * @param {*} obj
 * @param {Schema} schema
 * @param {null|string} [name]
 * @returns {boolean}
 * @access private
 */
function validate(obj, schema, name = null) {
    if (!(schema instanceof Schema)) {
        throw new TypeError('Given schema is invalid' +
            (name && ('for property ' + name)) + '!');
    }

    let objType = schema.typeOf(obj);
    let schemaType = schema.type;
    let isStrict = schema.options.strict;
    let isValid = true;

    if (schemaType === 'array' && objType === 'array') {
        for (let i = 0, s = obj.length; i < s; i++) {
            isValid = isValid && validate(obj[i], schema.items, i);
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
                        'Data model validation error: Unexpected property ' +
                        '"' + prop + '" given, but it\'s not defined in schema!'
                    );
                }
            }
        }

        props = Object.keys(schema.properties);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];
            let propSchema = schema.properties[prop];

            if (propSchema.required) {
                isValid = isValid && validate(obj[prop], propSchema, prop);
            }
        }
    }

    else {
        let validator = schema.validator || function() { return true; };

        if (schema.required && typeof obj === 'undefined') {
            isValid = false;

            if (isStrict) {
                throw new TypeError(
                    'Data model validation error: missing required property ' +
                    (name && '"' +name+ '"') + '!'
                );
            }
        }

        isValid = isValid && validator(obj);
    }

    if (objType !== schemaType) {
        isValid = false;

        if (isStrict) {
            throw new TypeError(
                'Data model validation error: Given object expected to be of ' +
                'type ' + schemaType + ', but ' + objType + ' given!'
            );
        }
    }

    return isValid;
}

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
     * @returns {*}
     */
    static observe(obj, schema, identifiable) {
        let isValid = validate(obj, schema);
        let objType = schema.typeOf(obj);
        let schemaType = schema.type;
        let isArray = schemaType === 'array';
        let isObject = schemaType === 'object';
        let isStrict = schema.options.strict;

        if (!isValid && isStrict) {
            throw new TypeError('Given data is invalid!');
        }

        if (objType !== schemaType) {
            obj = schema.cast(obj);
        }

        if (isArray) {
            for (let i = 0, s = obj.length; i < s; i++) {
                obj[i] = Observer.observe(
                    obj[i],
                    schema.items,
                    identifiable
                );
            }
        }

        else if (isObject) {
            let props = Object.keys(obj);

            for (let i = 0, s = props.length; i < s; i++) {
                let prop = props[i];
                let propSchema = schema.properties[prop];

                if (!propSchema) {
                    if (isStrict) {
                        throw new TypeError(
                            'Property ' + prop + ' is not defined in ' +
                            'data schema ' + schema + '!'
                        );
                    }

                    continue;
                }

                obj[prop] = Observer.observe(
                    obj[prop],
                    propSchema,
                    identifiable
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
                            identifiable
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
                        identifiable
                    ));
                }

                if (isObject) {
                    if (property in schema.properties[property]) {
                        return (target[property] = Observer.observe(
                            value,
                            schema.properties[property],
                            identifiable
                        ));
                    }

                    else if (schema.options.strict) {
                        throw new TypeError(
                            'Property ' + property + ' is not defined ' +
                                'in current data schema ' + schema +  '!'
                        );
                    }
                }

                return target[property] = value;
            }
        };

        return isPrimitive(schema.type) ? obj : new Proxy(obj, handler);
    }

    /**
     * Emits given event on a given supervisor, bypassing to each called event
     * handler given args
     *If given supervisor is not registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @param {string} event
     * @param {...*} args
     * @returns {Observer}
     * @access public
     */
    static emit(supervisor, event, ...args) {
        let listeners = Observer.listeners(supervisor, event);

        for (let i = 0, s = listeners.length; i < s; i++) {
            listeners[i].apply(supervisor, args);
        }

        return Observer;
    }

    /**
     * Resisters given event handlers for a given supervisor
     * If given supervisor is not registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @param {string} event
     * @param {...Function} handlers
     * @returns {Observer}
     * @access public
     */
    static on(supervisor, event, ...handlers) {
        let listeners = Observer.listeners(supervisor, event);

        listeners.push.apply(listeners, handlers);

        return Observer;
    }

    /**
     * Removes a given handler from a given event listeners on a given
     * supervisor object
     * If given supervisor is not registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @param {string} event
     * @param {...Function} handlers
     * @returns {Observer}
     * @access public
     */
    static off(supervisor, event, ...handlers) {
        let listeners = Observer.listeners(supervisor, event);

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
     * Removes all listeners from a given event on a given supervisor
     * If given supervisor is not registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @param {string} event
     * @returns {Observer}
     * @access public
     */
    static removeAllListeners(supervisor, event) {
        let listeners = Observer.listeners(supervisor);
        
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
     * Returns all errors generated for given supervisor. If supervisor
     * property is specified - it will return all errors registered for a given
     * property;
     * If given supervisor is not registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @param {string} [property]
     * @returns {object|Array}
     * @access public
     */
    static errors(supervisor, property) {
        let errors = Observer.get(supervisor).errors;

        if (errors && property) {
            return errors[property];
        }

        return errors;
    }

    /**
     * Returns all listeners for a given supervisor. If event name is
     * specified it will return only listeners related.
     * If given supervisor is not registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @param {string} [event]
     * @returns {*}
     * @access public
     */
    static listeners(supervisor, event) {
        if (event) {
            let listeners = Observer.get(supervisor).listeners;

            if (typeof listeners[event] === 'function') {
                listeners[event] = [listeners[event]];
            }

            if (!(listeners[event] instanceof Array)) {
                listeners[event] = [];
            }

            return listeners[event];
        }

        return Observer.get(supervisor).listeners;
    }

    /**
     * Returns Unified Unique Identifier of a given supervisor object
     * if supervisor was registered as identifiable object, otherwise it
     * will return undefined.
     * If a given supervisor was never registered with Observer it will throw
     * TypeError.
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @returns {string|undefined}
     * @access public
     */
    static uuid(supervisor) {
        return Observer.get(supervisor).uuid;
    }

    /**
     * Returns metadata associated with a given supervisor object.
     * It will throw TypeError if given supervisor object is not registered
     * with Observer
     *
     * @throws {TypeError}
     * @param {Proxy} supervisor
     * @returns {{
     *  listeners: object
     *  errors: object
     * }}
     */
    static get(supervisor) {
        if (!metadata.has(supervisor)) {
            throw new TypeError('Given object "' + supervisor + '" is ' +
                'not supervised by Observer!');
        }

        return metadata.get(supervisor);
    }

    static root(supervisor) {
        if (!metadata.has(supervisor)) {
            return supervisor;
        }

        let parent;

        while (parent = metadata.get(supervisor).parent) {
            supervisor = parent;

            if (!metadata.has(supervisor)) {
                return supervisor;
            }
        }

        return supervisor;
    }
}

Observer.addListener = Observer.on;
Observer.removeListener = Observer.off;

module.exports = Observer;
