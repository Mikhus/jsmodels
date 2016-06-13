let argsValidators = {
    fill() {

    },
    push() {

    },
    splice() {

    },
    unshift() {

    }
};

function validate(target, property, value, schema, va) {
    // TODO: validate value of given property
}

function validateArgs(target, property, args, schema) {
    args = [...args];

    if (!property in argsValidators) {
        return ;
    }

    if (typeof argsValidators[property] !== 'function') {
        return ;
    }
    
    
}

function observe(obj, schema) {
    let handler = {
        get(target, property) {
            if (typeof target[property] === 'function') {
                return obj instanceof Array ? function() {
                    validateArgs(obj, property, arguments, schema);

                    return target[property].bind(target);
                } : target[property].bind(target);
            }

            return target[property];
        },
        set(target, property, value) {
            validate(obj, property, value, schema);

            target[property] = value;
        }
    };

    return new Proxy(obj, handler);
}

module.exports = observe;
