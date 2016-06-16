const Schema = require('./Schema');
const EventEmitter = require('./EventEmitter');
const Observer = require('./Observer');
const Errors = require('./Errors');
const UUID = require('./UUID');

function initialData(schema) {
    let data = schema.default;

    return data;
}

/**
 * @class BaseModel
 * @extends EventEmitter
 * @abstract
 */
class BaseModel extends EventEmitter {

    constructor(schema) {
        if (this.constructor.name === 'BaseModel') {
            throw new SyntaxError(
                'Unable to instantiate abstract class "BaseModel"!');
        }

        if (schema === void 0) {
            throw new TypeError(
                'Unable to instantiate model with undefined schema!');
        }

        this.schema = schema instanceof Schema ? schema : new Schema(schema);
        this.data = initialData(this.schema);
    }

}

class Model extends BaseModel {
    constructor() {
        super(...arguments);
    }
}

module.exports = BaseModel;
