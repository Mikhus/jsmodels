const uuid = require('./uuid');
/**
 * Implementation of in-memory value object unified with read-only UUID field
 */
class ValueObject {

    constructor(schema, data) {
        Object.defineProperty(this, '@uuid', {
            value: uuid(),
            configurable: false,
            enumerable: false,
            writable: false
        });

        if (schema.properties) {
            let keys = Object.keys(schema.properties);
            let s = keys.length;

            for (let i = 0; i < s; i++) {
                let prop = keys[i];

                Object.defineProperty(this, prop, {
                    get() {
                        if (data[prop] === undefined) {
                            data[prop] = schema.properties[prop].default;
                        }

                        return data[prop];
                    },
                    set(value) {
                        if (schema.properties[prop].validate(value)) {
                            data[prop] = value;
                            return ;
                        }

                        // TODO: validation errors
                    },
                    enumerable: true,
                    configurable: !schema.required
                });
            }
        }
    }

}

module.exports = ValueObject;
