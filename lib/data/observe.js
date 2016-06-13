function validate(property, value, schema, va) {
    // TODO: validate value of given property
}

function validateArgs(property, args, schema) {
    args = [...args];
    // TODO: validate arguments (mostly for array modification methods)
}

function observe(obj, schema) {
    let handler = {
        get(target, property) {
            if (typeof target[property] === 'function') {
                return function() {
                    validateArgs(property, arguments, schema);

                    return target[property].bind(target);
                };
            }

            return target[property];
        },
        set(target, property, value) {
            validate(property, value, schema);

            target[property] = value;
        }
    };

    return new Proxy(obj, handler);
}

module.exports = observe;
