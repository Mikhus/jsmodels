const Validator = require('./Validator');

/**
 * Implementation of in-memory value object unified with read-only UUID field
 */
class ValueObject {

    constructor(data, schema, isChild = false) {
        !isChild && Object.defineProperty(this, '@uuid', {
            value: ValueObject.uuid(),
            configurable: false,
            enumerable: false,
            writable: false
        });

        let properties = schema.definition.properties || schema.definition.items.properties;

        properties && Object.keys(properties).forEach((property) => {
            Object.defineProperty(this, property, {
                get() {
                    if (data[property] === undefined) {
                        data[property] = schema.defaultValue(property);
                    }

                    return data[property];
                },
                set(value) {
                    if (Validator.validate(value, properties[property], schema.strict)) {
                        data[property] = schema.cast(property, value);
                    }
                },
                enumerable: true,
                configurable: !schema.getDefinition(property).required
            });
        });
    }

    /**
     * Returns string representation of the ValueObject as it JavaScript usually does
     *
     * @returns {string}
     */
    toString() {
        return '[object ValueObject]';
    }

    /**
     * Generates and returns UUID
     *
     * @static
     * @returns {string}
     */
    static uuid() {
        let d = new Date().getTime();

        if (typeof window !== 'undefined' &&
            window && window.performance &&
            typeof window.performance.now === 'function'
        ) {
            //use high-precision timer if available
            d += performance.now();
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(c) => {
            let r = (d + Math.random() * 16) % 16 | 0;

            d = Math.floor(d / 16);

            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

}

module.exports = ValueObject;
