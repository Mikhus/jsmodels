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
let lookupTable = new Map();

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
 * @param {Proxy} supervisor
 * @param {string} property
 * @param {Array} args
 * @param {Schema} schema
 * @param {number} shift
 * @returns {boolean}
 * @access private
 */
function validateArgs(supervisor, property, args, schema, shift = 0) {
    let callPath = callTrace();
    let errors = Observer.errors(supervisor);
    let pass = true;

    for (let i = 0, s = args.length; i < s; i++) {
        let item = args[i];
        let type = schema.typeOf(item);
        let isValidType = type === schema.type;
        let isValid = schema.validator(item);
        let valid = isValidType && isValid;

        if (!valid) {
            errors = errors[property] || (errors[property] = []);

            errors.push({
                target: args,
                property: i + shift,
                value: args[i],
                invalidType: !isValidType,
                invalidValue: !isValid,
                file: callPath[0],
                line: callPath[1],
                column: callPath[2]
            });

            pass = false;
        }
    }

    return pass;
}

/**
 * Performs validation of the given value for given property
 * on a given target object using given schema. If validation is not passed
 * it will fill validation errors
 *
 * @param {Proxy} supervisor
 * @param {*} target
 * @param {string} property
 * @param {*} value
 * @param {Schema} schema
 * @returns {boolean}
 * @access private
 */
function validateProperty(supervisor, target, property, value, schema) {
    let callPath = callTrace();
    let type = schema.typeOf(value);
    let isValidType = type === schema.type;
    let isValid = schema.validator(value);
    let valid = isValidType && isValid;

    if (!valid) {
        let errors = Observer.errors(supervisor);

        errors = errors[property] || (errors[property] = []);

        errors.push({
            target: target,
            property: property,
            value: value,
            invalidType: !isValidType,
            invalidValue: !isValid,
            file: callPath[0],
            line: callPath[1],
            column: callPath[2]
        });

        return false;
    }

    return true;
}

/**
 * Ensures given data is supervised and is valid to given schema
 *
 * @param {*} data
 * @param {Schema} schema
 * @param {boolean} [identifiable]
 * @returns {Proxy}
 * @access private
 */
function ensure(data, schema, identifiable) {
    let supervisor = lookupTable.get(data);

    if (!supervisor) {
        supervisor = Observer.observe(supervisor, schema, identifiable);
        lookupTable.set(data, supervisor);
    }

    let meta = metadata.get(supervisor);
    let errors = meta.errors || (meta.errors = {});
    let children = meta.children || (meta.children = []);
    let callPath = callTrace();
    let validator = typeof schema.validator === 'function' ?
        schema.validator : () => true;

    errors = errors.schema || (errors.schema = []);

    if (schema.typeOf(data) !== schema.type) {
        errors.push({
            target: data,
            invalidType: true,
            invalidValue: !validator(data),
            file: callPath[0],
            line: callPath[1],
            column: callPath[2]
        });
    }

    if (schema.type === 'array' && data && data.length) {
        for (let i = 0, s = data.length; i < s; i++) {
            let child = ensure(
                data[i],
                schema.items,
                identifiable
            );

            if (!metadata.has(child)) {
                continue ;
            }

            children.push(child);
            metadata.get(child).parent = supervisor;

            data[i] = child;
        }
    }

    else if (schema.type === 'object') {
        let props = Object.keys(schema.properties || {});

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];
            let child = ensure(
                data[prop],
                schema.properties[prop],
                identifiable
            );

            if (!metadata.has(child)) {
                continue ;
            }

            children.push(child);
            metadata.get(child).parent = supervisor;

            data[prop] = child;
        }
    }

    return supervisor;
}

/**
 * Constructs and returns default metadata object
 *
 * @param {boolean} identifiable
 * @returns {{
 *  listeners: object,
 *  errors: object,
 *  children: Array,
 *  parent: null|object,
 *  uuid: string|undefined
 * }}
 */
function defaultMetadata(identifiable) {
    let data = {
        listeners: {},
        errors: {},
        children: [],
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
     * @returns {Proxy}
     */
    static observe(obj, schema, identifiable = true) {
        obj = schema.cast(obj, schema.type);

        if (typeof obj === 'undefined') {
            throw new TypeError('Given data object is invalid!');
        }

        if (!(schema instanceof Schema)) {
            throw new TypeError('Given schema is invalid!');
        }

        if (!(schema.type === 'object' || schema.type === 'array')) {
            metadata.set(obj, defaultMetadata(identifiable));
            lookupTable.set(obj, obj);

            return obj;
        }

        let supervisor;
        let handler = {
            get(target, property) {
                if (typeof target[property] === 'function') {
                    return obj instanceof Array ? function() {
                        let args = [...arguments];
                        let shift = 0;
                        let isSplice = property === 'splice';

                        if (isSplice) {
                            shift = 2;
                            args = args.slice(shift);
                        }

                        let valid = validateArgs(supervisor, property, args,
                            schema.items, shift);

                        if (valid || !schema.options.strict) {
                            for (let i = 0, s = args.length; i < s; i++) {
                                let arg = args[i];

                                args[i] = Observer.observe(arg, schema.items);
                            }

                            if (isSplice) {
                                args.unshift([...arguments].slice(0, shift));
                            }

                            return target[property].apply(target, args);
                        }

                        return false;
                    } : target[property].bind(target);
                }

                return target[property];
            },
            set(target, property, value) {
                let isArray = target instanceof Array && isNumeric(value);
                let valid = validateProperty(supervisor, target, property,
                    value, isArray ? schema.items : schema);

                if (valid || !schema.options.strict) {
                    target[property] = isArray ?
                        value : Observer.observe(value,
                        schema.properties[property]);
                }
            }
        };

        supervisor = new Proxy(obj, handler);

        metadata.set(supervisor, defaultMetadata(identifiable));
        lookupTable.set(obj, supervisor);

        return ensure(obj, schema, identifiable);
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
     * @param {string} event
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
}

Observer.addListener = Observer.on;
Observer.removeListener = Observer.off;

module.exports = Observer;
