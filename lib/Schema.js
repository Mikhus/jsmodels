/**
 * jsmodels Schema
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const core = require('./core');

const isPlainObject = core.isPlainObject;
const isEmptyObject = core.isEmptyObject;

/**
 * Known schema types
 *
 * @type {{
 *  string: String,
 *  integer: Number,
 *  float: Number,
 *  number: Number,
 *  boolean: Boolean,
 *  array: Array,
 *  function: Function,
 *  object: Object
 * }}
 * @access private
 */
const types = {
    string: String,
    integer: Number,
    float: Number,
    number: Number,
    boolean: Boolean,
    array: Array,
    function: Function,
    object: Object
};

/**
 * List of known schema type names
 *
 * @type {Array}
 * @access private
 */
const typeNames = Object.keys(types);

/**
 * List of know type constructors
 *
 * @type {Array}
 */
const typeConstructors = [...new Set(typeNames.map((name) => types[name]))];

/**
 * Controversial way to get type name from constructor
 *
 * @type {Map}
 */
let typeConstructorNames = new Map();
typeConstructors.forEach(Type =>
    typeConstructorNames.set(Type, Type.name.toLowerCase()));

/**
 * Keywords validators
 *
 * @access private
 */
const keywordValidators = {

    /**
     * Checks if a given 'type' schema's property value is a valid type
     * definition
     *
     * @param {*} value
     * @param {object} options
     * @returns {boolean}
     * @access private
     */
    type(value, options = Schema.options) {
        let valid = value in types;

        if (!options.strictNumbers && ~['integer', 'float'].indexOf(value)) {
            valid = false;
        }

        return valid;
    },

    /**
     * Checks if a given 'items' schema's property value is a valid definition
     *
     * @param {*} value
     * @returns {boolean}
     * @access private
     */
    items(value) {
        if (isPlainObject(value)) {
            return isValidSchema(value);
        }

        return false;
    },

    /**
     * Checks if a given 'properties' schema's property value is a valid
     * definition
     *
     * @param {*} value
     * @returns {boolean}
     * @access private
     */
    properties(value) {
        if (!isPlainObject(value)) {
            return false;
        }

        let keys = Object.keys(value);
        let s = keys.length;

        for (let i = 0; i < s; i++) {
            if (!isValidSchema(value[keys[i]])) {
                return false;
            }
        }

        return true;
    },

    /**
     * Checks if a given 'required' schema's property value is a valid
     * definition
     *
     * @param {*} value
     * @returns {boolean}
     * @access private
     */
    required(value) {
        return typeof value === 'boolean';
    },


    /**
     * Checks if a given 'validate' schema's property value is a valid
     * definition
     *
     * @param {*} value
     * @returns {boolean}
     * @access private
     */
    validate(value) {
        let type = typeof value;

        return type === 'function' || type === 'string';
    },

    /**
     * Checks if a given 'name' schema's property value is a valid
     * definition
     *
     * @param value
     * @returns {boolean}
     */
    name(value) {
        let type = typeof value;

        return type === 'undefined' || type === 'string';
    },

    /**
     * Checks if a given 'default' schema's property value is a valid definition
     *
     * @returns {boolean}
     * @access private
     */
    default() {
        return true;
    }
};

const keywords = Object.keys(keywordValidators);

/**
 * Checks if a given definition is a valid JSON schema
 *
 * @param {*} definition
 * @param {object} options
 * @returns {boolean}
 * @access private
 */
function isValidSchema(definition, options = Schema.options) {
    if (definition instanceof Schema) {
        return true;
    }

    if (!isPlainObject(definition) || isEmptyObject(definition)) {
        return false;
    }

    let keys = Object.keys(definition);
    let s = keys.length;

    for (let i = 0; i < s; i++) {
        let property = keys[i];
        let validator = keywordValidators[property];

        if (!(
            typeof validator === 'function' &&
            validator(definition[property], options)
        )) {
            return false;
        }
    }

    return true;
}

/**
 * Transforms given schema definition to a valid JSON schema
 *
 * @param {object} definition
 * @param {object} options
 * @returns {object}
 * @access private
 */
function jsonify(definition, options = Schema.options) {
    if (isValidSchema(definition, options)) {
        return definition;
    }

    let type = Schema.typeOf(definition, options);

    if (type === 'undefined') {
        return jsonify({}, options);
    }

    if (definition in types && !(definition instanceof Array)) {
        // type is described with as string name
        type = definition;
    }

    if (definition === null) {
        return {
            type: 'object',
            default: null
        };
    }

    if (type === 'array') {
        definition = {
            type: 'array',
            items: jsonify(definition[0], options)
        };
    }

    else if (type === 'function') {
        // sounds like constructor function
        definition = {
            type: definition
        };
    }

    else if (type === 'object') {
        if (isEmptyObject(definition)) {
            return {
                type: 'object',
                default: {}
            };
        }

        if (definition.properties) {
            if (!definition.type) {
                definition.type = 'object';
            }

            let keys = Object.keys(definition.properties);
            let i = keys.length;

            while (i--) {
                let property = keys[i];

                definition.properties[property] =
                    jsonify(definition.properties[property], options);
            }
        }

        else {
            let props = {};
            let keys = Object.keys(definition);
            let s = keys.length;
            let i = 0;

            for (; i < s; i++) {
                let property = keys[i];

                props[property] = jsonify(definition[property], options);
            }

            definition = {
                type: 'object',
                properties: props
            };
        }
    }

    else {
        definition = {
            type: type,
            default: cast(definition, type)
        };
    }

    return definition;
}

/**
 * Fixes missing required schema properties
 *
 * @param {object} definition
 * @param {object} options
 * @returns {object}
 * @access private
 */
function fix(definition, options = Schema.options) {
    if (definition.validate === void 0) {
        definition.validate = () => true;
    }

    if (definition.type === 'array') {
        definition.items = fix(definition.items, options);

        return definition;
    }

    if (definition.type !== 'object') {
        return definition;
    }

    // will be using temp var because we don't want to loose
    // properties order defined by a user
    let finalProperties = {};
    let i = 0;
    let keys = Object.keys(definition.properties || finalProperties);
    let s = keys.length;

    for (; i < s; i++) {
        let property = keys[i];
        let propertyDefinition = definition.properties[property];
        let required = true;

        if (propertyDefinition.type === 'array' ||
            propertyDefinition.type === 'object'
        ) {
            propertyDefinition = fix(propertyDefinition, options);
        }

        if (property[0] === '?') {
            property = property.substring(1);
            required = false;
        }

        if (propertyDefinition.required === void 0) {
            propertyDefinition.required = required;
        }

        if (propertyDefinition.default === void 0) {
            propertyDefinition.default = cast(
                void 0, propertyDefinition.type);
        }

        finalProperties[property] = propertyDefinition;
    }

    definition.properties = finalProperties;

    return definition;
}

/**
 * Casts given value to a given type
 *
 * @param {*} value
 * @param {string} type
 * @returns {*}
 * @access private
 */
function cast(value, type) {
    if (type in types) {
        return cast[type](value);
    }

    return value;
}

/**
 * Casts given value to array type
 *
 * @param {*} value
 * @returns {Array}
 * @access private
 */
cast.array = value => {
    if (value === Array) {
        return [];
    }

    return Array.prototype.slice.call(value || []);
};

/**
 * Casts given value to string type
 *
 * @param {*} value
 * @returns {string}
 * @access private
 */
cast.string = value => {
    if (value === String || !value) {
        return '';
    }

    return String(value);
};

/**
 * Casts given value to integer number type
 *
 * @param {*} value
 * @returns {number}
 * @access private
 */
cast.integer = value => {
    if (value === Number) {
        return 0;
    }

    value = parseInt(value, 10);

    if (isNaN(value) || !Number.isFinite(value)) {
        value = 0;
    }

    return value;
};

/**
 * Casts given value to float number type
 *
 * @param {*} value
 * @returns {number}
 * @access private
 */
cast.float = value => {
    if (value === Number) {
        return 0;
    }

    value = parseFloat(value);

    if (isNaN(value) || !Number.isFinite(value)) {
        value = 0;
    }

    return value;
};

/**
 * Casts given value to number type
 *
 * @param {*} value
 * @returns {number}
 * @access private
 */
cast.number = value => {
    if (value === Number) {
        return 0;
    }

    value = Number(value);

    if (isNaN(value) || !Number.isFinite(value)) {
        value = 0;
    }

    return value;
};

/**
 * Casts given value to a boolean type
 *
 * @param {*} value
 * @returns {boolean}
 * @access private
 */
cast.boolean = value => {
    if (value === Boolean) {
        return false;
    }

    return Boolean(value);
};

/**
 * Casts given value to a function type
 * Actually it is not possible and usually we do not need this, so we simply
 * return the given value. Normally it can not happen on the objects which are
 * not function type, because them should not be allowed in JSON schema, but in
 * JS schema them ARE DEFINED AS constructor functions.
 *
 * @param {Function} value
 * @returns {Function}
 * @access private
 */
cast.function = value => {
    return value;
};

/**
 * Casts given value to JavaSctipt object
 *
 * @param {*} value
 * @returns {object}
 * @access private
 */
cast.object = value => {
    if (value === Object || !value || !isPlainObject(value)) {
        return {};
    }

    return Object(value);
};

/**
 * Global schema options
 *
 * @property {{
 *  strict: boolean,
 *  strictNumbers: boolean
 * }}
 * @access public
 * @static
 * @memberof Schema
 */
const options = {
    /**
     * Defines if schema should be of strict rules
     * When schema is strict it will throw errors instead of logging and
     * will apply more strict rules on validation checks.
     * Good idea to use strict mode in development
     */
    strict: false,

    /**
     * Turns on/off numeric 'integer' and 'float' types on schema,
     * providing in addition more strict checks on numbers
     * Use it whenever you need to control numeric types on your models
     */
    strictNumbers: false
};

const optionKeys = Object.keys(options);
const optionsCount = optionKeys.length;

/**
 * Expanding user defined options with missing default options values
 *
 * @param {object} userOptions
 * @returns {object}
 * @access private
 */
function opts(userOptions) {
    let merged = {};
    let i = optionsCount;

    while (i--) {
        let key = optionKeys[i];
        merged[key] = options[key];
        merged[key] = userOptions[key];
    }

    return merged;
}

/**
 * Class Schema
 *
 * @classname Schema
 * @classdesc provides common functionality to manipulate schema definitions
 * @access public
 */
class Schema {

    /**
     * @property {object|undefined} Schema.properties
     * @access public
     */

    /**
     * @property {Schema|undefined} Schema.items
     * @access public
     */

    /**
     * @property {Function} Schema.validate
     * @access public
     */

    /**
     * @property {*} Schema.default
     * @access public
     */

    /**
     * @property {boolean} Schema.required
     * @access public
     */

    /**
     * @property {string|Function} Schema.type
     * @access public
     */

    /**
     * @property {undefined|object} Schema.definition
     * @access private
     */

    /**
     * @property {Schema|null} Schema.parent
     * @access public
     */

    /**
     * @property {string} Schema.name
     * @access public
     */

    /**
     * @property {{
     *  strict: boolean,
     *  strictNumbers: boolean
     * }} Schema.options
     * @access public
     */

    /**
     * @constructor
     * @param definition
     * @param {{
     *  strict: boolean,
     *  strictNumbers: boolean
     * }} [options]
     * @param {boolean} [canonical]
     * @param {Schema} [parent]
     * @param {string} [name]
     * @access public
     */
    constructor(definition, options = Schema.options, canonical = false,
                parent = null, name = '')
    {
        options = opts(options);

        if (!canonical) {
            definition = Schema.parse(definition, options);
        }

        if (definition.type === 'array') {
            definition.items = new Schema(definition.items, options, true, this,
               '');
        }

        else if (definition.type === 'object') {
            let properties = definition.properties;

            let keys = Object.keys(properties || {});
            let i = keys.length;

            while (i--) {
                let property = keys[i];

                properties[property] =
                    new Schema(properties[property], options, true, this,
                        property);
            }
        }

        this.name = name;

        let i = keywords.length;

        while (i--) {
            let property = keywords[i];

            if (property in definition) {
                this[property] = definition[property];
            }
        }

        //noinspection JSAnnotator
        this.options = options;
        this.parent = parent;
    }

    /**
     * Returns root schema of the current schema
     *
     * @returns {Schema}
     */
    root() {
        let schema = this;

        while (schema.parent) {
            schema = schema.parent;
        }

        return schema;
    }

    /**
     * Casts a given value to current schema type
     *
     * @see Schema.cast
     * @param {*} value
     * @param {string} type
     * @returns {*}
     * @access public
     */
    cast(value, type = this.type) {
        return cast(value, type);
    }

    /**
     * Converts current schema to JSON representation
     *
     * @param {number} [prettyPrint] - spaces to use for pretty output
     * @return {string}
     * @access public
     */
    toJSON(prettyPrint) {
        prettyPrint = parseInt(prettyPrint || 0, 10);
        isNaN(prettyPrint) && (prettyPrint = 0);

        return JSON.stringify(Schema.definitionOf(this), null, prettyPrint);
    }

    /**
     * Shortcut for static Schema.typeOf()
     *
     * @see Schema.typeOf
     * @param {*} value
     * @returns {string}
     * @access public
     */
    typeOf(value) {
        return Schema.typeOf(value, this.options);
    }

    /**
     * Parses given definition to JSON schema
     *
     * @param {*} definition
     * @param {{
     *  strict: boolean,
     *  strictNumbers: boolean
     * }} [options]
     * @returns {Object}
     * @access public
     */
    static parse(definition, options = Schema.options) {
        if (isValidSchema(definition, options)) {
            return definition;
        }

        return fix(jsonify(definition, options), options);
    }

    /**
     * Returns schema-related type for a given value
     *
     * @param {*} value
     * @param {{
     *  strict: boolean,
     *  strictNumbers: boolean
     * }} [options]
     * @returns {string}
     * @access public
     * @static
     */
    static typeOf(value, options = Schema.options) {
        let type = typeof value;
        let s = typeConstructors.length;
        let i = 0;

        for (; i < s; i++) {
            let Type = typeConstructors[i];

            if (Type === Function && value === Object) {
                continue;
            }

            if (Type === value || value instanceof Type) {
                type = typeConstructorNames.get(Type);

                break;
            }
        }

        if (type === 'number' && options.strictNumbers) {
            type = Number.isInteger(value) ?
                'integer' : 'float';
        }

        return type;
    }

    /**
     * Factory method. Actually it is here for those who
     * prefer function-style programming over classes
     *
     * @example
     * const schema = require('./Schema').create;
     *
     * console.log(schema({
     *    name: String,
     *    age: Number,
     *    city: String
     * });
     *
     * @param {*} definition
     * @param {{
     *  strict: boolean,
     *  strictNumbers: boolean
     * }} [options]
     * @returns {Schema}
     * @access public
     * @static
     */
    static create(definition, options = Schema.options) {
        return new Schema(definition, options);
    }

    /**
     * Returns plain definition for a given Schema object
     *
     * @param {Schema} schema
     * @returns {object}
     */
    static definitionOf(schema) {
        if (!(schema instanceof Schema)) {
            throw new TypeError('Given schema object is invalid!');
        }

        if (schema.definition) {
            return schema.definition;
        }

        let definition = {};

        Object.keys(schema).forEach(property => {
            if (property in keywordValidators) {
                definition[property] = schema[property];
            }
        });

        if (schema.type === 'object') {
            schema.properties && Object.keys(schema.properties)
                .forEach(property =>
                    definition.properties[property] =
                        Schema.definitionOf(schema.properties[property])
            );
        }

        else if (schema.type === 'array') {
            if (!definition.items) {
                return definition;
            }

            definition.items = Schema.definitionOf(definition.items);
        }

        // caching the result to hidden property for future calls
        // so, let's assume we have lazy-loading here, because in the
        // most of the cases you will never need this
        Object.defineProperty(schema, 'definition', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: definition
        });

        return definition;
    }
}

Object.defineProperty(Schema, 'options', {
    enumerable: true,
    configurable: true,
    get() { return options; },
    set(value) { opts(value); }
});

module.exports = Schema;
