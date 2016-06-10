const Schema = require('./Schema');
const Log = require('./Log');

class Validator {
    static validate(value, schema = new Schema) {
        if (!schema.definition || !schema.typeOf) {
            // invalid schema, pass through validation successfully
            return true;
        }

        let type = schema.typeOf(value);
        let definition = schema.definition.properties || schema.definition.items;

        if (definition && type !== definition.type) {
            let error = new TypeError(
                'Expected value of type "' + definition.type +
                '" but "' + type + '" type given!'
            );

            if (schema.strict) {
                throw error;
            }

            Log.error(error);

            return false;
        }

        return true;
    }
}

module.exports = Validator;
