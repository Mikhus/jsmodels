class Observer {

    static validate(property, value, schema) {
        // TODO: validate value of given property
    }

    static validateArgs(property, args, schema) {
        args = [...args];

        // TODO: validate arguments (mostly for array modification methods)
    }

    static create(obj, schema) {
        let validations = {};
        let handler = {
            get(target, property) {
                if (typeof target[property] === 'function') {
                    return function() {
                        Observer.validateArgs(property, arguments, schema);
                        return target[property].bind(target);
                    };
                }

                if (!validations[property]) {
                    Observer.validate(property, target[property], schema);
                    validations[property] = true;
                }

                return target[property];
            },
            set(target, property, value) {
                Observer.validate(property, value, schema);
                validations[property] = true;

                target[property] = value;
            }
        };

        return new Proxy(obj, handler);
    }

}

module.exports = Observer;
