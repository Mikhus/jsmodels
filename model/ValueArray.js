const Validator = require('./Validator');

class ValueArray extends Array {

    constructor() {
        let args = 
        super(...arguments);

        Object.defineProperty(this, 'schema', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: null
        });
    }

    configureItem(value, index) {
        Validator.validate(value, this.schema);

        Object.defineProperty(this, index, {
            configurable: true,
            enumerable: true,
            get() {
                return value;
            },
            set(value) {
                if (Validator.validate(value, this.schema)) {
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

    configure(schema) {
        this.schema = schema;

        this.forEach(this.configureItem.bind(this));
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
