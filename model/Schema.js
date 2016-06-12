const ValueObject = require('./ValueObject');

let schemaTypes;

class Schema {
    constructor(definition, canonical = false, strict = true) {
        this.strict = strict;
        this.define(definition || {}, canonical);
    }

    cast(property, value) {
        let definition = this.getDefinition(property);

        if (!definition) {
            return value;
        }

        return Schema.cast(value, definition.type, definition);
    }

    getDefinition(property) {
        let definition = this.definition;

        if (definition.type === 'object' &&
            definition.properties &&
            property in definition.properties
        ) {
            return definition.properties[property];
        }

        if (definition.type === 'array' &&
            definition.items &&
            definition.items.properties &&
            property in definition.items.properties
        ) {
            return definition.items.properties[property];
        }

        return {};
    }

    defaultValue(property) {
        let definition = this.getDefinition(property);

        return Schema.cast(definition.default, definition.type);
    }

    define(definition, canonical = false) {
        this.definition = canonical ? definition : Schema.normilize(definition);
    }

    typeOf(value) {
        return Schema.typeOf(value);
    }

    setStrict(strict) {
        this.strict = !!strict;
        return this;
    }

    static normilize(definition) {
        return Schema.parseMandatory(Schema.parse(definition));
    }

    /**
     * @param {object} definition
     */
    static parse(definition) {
        let type = Schema.typeOf(definition);

        if (type === 'undefined') {
            return Schema.parse({});
        }

        if (definition in Schema.types && !(definition instanceof Array)) {
            // type is described with as string name
            type = definition;
        }

        if (definition === null) {
            definition = {
                type: 'object',
                default: null,
                nullable: true
            };
        }

        else if (type === 'array') {
            definition = {
                type: 'array',
                items: Schema.parse(definition[0])
            };
        }

        else if (type === 'function') {
            // sounds like constructor function
            definition = {
                type: definition
            };
        }

        else if (type !== 'object') {
            definition = {
                type: type,
                default: Schema.cast(definition, type)
            };
        }

        else if (type === 'object') {
            if (Schema.isPlainObject(definition)) {
                return {
                    type: 'object',
                    default: {}
                };
            }

            if (definition.properties) {
                if (!definition.type) {
                    definition.type = 'object';
                }

                Object.keys(definition.properties).forEach((property) => {
                    definition.properties[property] =
                        Schema.parse(definition.properties[property]);
                });
            }

            else {
                let props = {};

                Object.keys(definition).forEach((property) =>
                    props[property] = Schema.parse(definition[property]));

                definition = {
                    type: 'object',
                    properties: props
                }
            }
        }

        return definition;
    }

    static parseMandatory(definition) {
        let properties = {};
        let finalProperties = {}; // using temp var because we don't want to loose properties order defined by a user

        if (definition.type === 'object') {
            properties = definition.properties;
        }

        else if (definition.type === 'array') {
            properties = definition.items.properties;
        }

        properties && Object.keys(properties).forEach((property) => {
            if (properties[property].properties) {
                properties[property].properties =
                    Schema.parseMandatory(properties[property].properties);
            }

            if (properties[property].items && properties[property].items.properties) {
                properties[property].items.properties =
                    Schema.parseMandatory(properties[property].items.properties);
            }

            let propertyDefinition = properties[property];
            let required = true;

            if (property[0] === '?') {
                property = property.substr(1);
                required = false;
            }

            if (propertyDefinition.required === undefined) {
                propertyDefinition.required = required;
            }

            finalProperties[property] = propertyDefinition;
        });

        if (definition.type === 'object' && definition.properties) {
            definition.properties = finalProperties;
        }

        else if (definition.type === 'array' && definition.items.properties) {
            definition.items.properties = finalProperties;
        }

        return definition;
    }

    static isPlainObject(definition) {
        return definition === Object || (Object.keys(definition).length === 0 && definition.constructor === Object);
    }

    static cast(value, type, definition) {
        if (~Object.keys(Schema.types).indexOf(type)) {
            return Schema['cast' + Schema.types[type]](value, definition);
        }

        return value;
    }

    static castArray(value) {
        if (value === Array) {
            return [];
        }

        return Array.prototype.slice.call(value || []);
    }

    static castString(value) {
        if (value === String) {
            return '';
        }

        return String(value);
    }

    static castInteger(value) {
        if (value === Number) {
            return 0;
        }

        value = parseInt(value, 10);

        if (isNaN(value) || !Number.isFinite(value)) {
            value = 0;
        }

        return value;
    }

    static castFloat(value) {
        if (value === Number) {
            return 0;
        }

        value = parseFloat(value);

        if (isNaN(value) || !Number.isFinite(value)) {
            value = 0;
        }

        return value;
    }

    static castNumber(value) {
        if (value === Number) {
            return 0;
        }

        value = Number(value);

        if (isNaN(value) || !Number.isFinite(value)) {
            value = 0;
        }

        return value;
    }

    static castBoolean(value) {
        if (value === Boolean) {
            return false;
        }

        return Boolean(value);
    }

    static castFunction(value) {
        return value;
    }

    static castObject(value, definition) {
        if (value === Object) {
            return new ValueObject({}, new Schema({}, true), true);
        }

        return definition ?
            new ValueObject(value, new Schema(definition, canonical), true) :
            value;
    }

    static typeOf(value) {
        let type = typeof value;

        [Number, Boolean, String, Array, Function, Object].some((builtIn) => {
            if (builtIn === value || value instanceof builtIn) {
                if (builtIn === Function && value === Object) {
                    return false;
                }

                type = builtIn.name.toLowerCase();

                return true;
            }
        });

        if (type === 'number' && Schema.strictNumbers) {
            type = Number.isInteger(value) ?
                'integer' : 'float';
        }

        return type;
    }

    static get types() {
        if (!schemaTypes) {
            schemaTypes = {};
            Object.getOwnPropertyNames(Schema)
                .filter((prop) => /^cast[A-Z]/.test(prop))
                .forEach((prop) => {
                    let type = prop.replace(/^cast/, '');
                    schemaTypes[type.toLowerCase()] = type;
                })
        }

        return schemaTypes;
    }
    static set types(types) {}
    static resetTypes() {
        schemaTypes = null;
    }

    static create() {
        return new Schema(...arguments);
    }
}

module.exports = Schema;
