const Validator = require('./Validator');

function redefine(value, index) {
    Validator.validate(value, this.schema.definition.items, this.schema.strict);

    Object.defineProperty(this, index, {
        configurable: true,
        enumerable: true,
        get() {
            return value;
        },
        set(value) {
            if (Validator.validate(value, this.schema.definition.items, this.schema.strict)) {
                Object.defineProperty(this, index, {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: value
                });

                this.configureItem(value, index);
            }
        }
    });
}

class ValueArray extends Array {

    constructor() {
        let args = Aray.prototype.slice.call(arguments);
        let schema = args.shift();

        super(...args);

        Object.defineProperty(this, 'schema', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: schema
        });

        this.forEach(redefine.bind(this));
    }

    push() {
        for (let arg of arguments) {
            if (!Validator.validate(arg, this.schema)) {
                return ;
            }
        }

        super.push(...arguments);
    }

    unshift() {
        super.unshift(...arguments);
    }

    splice() {
        super.splice(...arguments);
    }
}

module.exports = ValueArray;
