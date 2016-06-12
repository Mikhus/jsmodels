const Schema = require('./Schema');
const Log = require('./Log');

class Validator {
    static validate(value, definition, strict = false) {
        let type = Schema.typeOf(value);

        if (definition && type !== definition.type) {
            let error = new TypeError(
                'Expected value of type "' + definition.type +
                '" but "' + type + '" type given!'
            );

            if (strict) {
                throw error;
            }

            Log.error(error);

            return false;
        }

        return true;
    }
}

module.exports = Validator;
