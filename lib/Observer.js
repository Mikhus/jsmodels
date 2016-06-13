/**
 * jsmodels Data observer proxy
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const Schema = require('./Schema');
const UUID = require('./UUID');

/**
 * Store for created supervisor objects
 *
 * @type {Map}
 */
let supervisors = new Map();

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
            pass = false;
            errors[property] || (errors[property] = []);

            errors[property].push({
                target: args,
                property: i + shift,
                value: args[i],
                invalidType: !isValidType,
                invalidValue: !isValid,
                file: callPath[0],
                line: callPath[1],
                column: callPath[2]
            });
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
 * @access private
 */
function validate(supervisor, target, property, value, schema) {
    let callPath = callTrace();
    let method = 'set';
    let type = schema.typeOf(value);
    let isValidType = type === schema.type;
    let isValid = schema.validator(value);
    let valid = isValidType && isValid;
    let pass = true;

    if (!valid) {
        let errors = Observer.errors(supervisor);

        pass = false;
        errors[property] || (errors[property] = []);

        errors[property].push({
            target: target,
            property: property,
            value: value,
            invalidType: !isValidType,
            invalidValue: !isValid,
            file: callPath[0],
            line: callPath[1],
            column: callPath[2]
        });
    }

    return pass;
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
        if (!(schema instanceof Schema)) {
            throw new TypeError('Given schema is invalid!');
        }

        let supervisor;
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

                        let valid = validateArgs(supervisor, property, args,
                            schema.items, shift);

                        if (valid || !schema.options.strict) {
                            return target[property].apply(target, arguments);
                        }

                        return false;
                    } : target[property].bind(target);
                }

                return target[property];
            },
            set(target, property, value) {
                let valid = validate(supervisor, target, property, value,
                    target instanceof Array && isNumeric(value) ?
                        schema.items : schema);


                if (valid || !schema.options.strict) {
                    target[property] = value;
                }
            }
        };

        supervisor = new Proxy(obj, handler);

        supervisors.set(supervisor, {
            listeners: {},
            errors: {}
        });

        if (identifiable) {
            Object.defineProperty(supervisors.get(supervisor), 'uuid', {
                configurable: false,
                enumerable: true,
                writable: false,
                value: UUID()
            });
        }

        return supervisor;
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
        let data = supervisors.get(supervisor);

        if (!data) {
            throw new TypeError('Given object "' + supervisor + '" is ' +
                'not supervised by Observer!');
        }

        return supervisors.get(supervisor);
    }
}

Observer.addListener = Observer.on;
Observer.removeListener = Observer.off;

module.exports = Observer;
