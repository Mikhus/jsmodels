const uuid = require('./uuid');

function redefine(context, schema, value, index) {
    Object.defineProperty(context, index, {
        configurable: true,
        enumerable: true,
        get() {
            return value;
        },
        set(value) {
            if (schema.validate(value)) {
                Object.defineProperty(context, index, {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: value
                });

                redefine(context, schema, value, index);
            }
        }
    });
}

class ValueArray extends Array {

    constructor() {
        let args = Array.prototype.slice.call(arguments);
        let schema = args.shift();

        super(...args);

        Object.defineProperty(this, '@uuid', {
            value: uuid(),
            configurable: false,
            enumerable: false,
            writable: false
        });

        for (let i = 0, s = this.length; i < s; i++) {
            redefine(this, schema, this[i], i);
        }
    }

    push() {
        // TODO: validate items
        super.push(...arguments);
    }

    unshift() {
        // TODO: validate items
        super.unshift(...arguments);
    }

    splice() {
        // TODO: validate items
        super.splice(...arguments);
    }
}

module.exports = ValueArray;
