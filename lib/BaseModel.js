const Schema = require('./Schema');
const EventEmitter = require('./EventEmitter');
const Observer = require('./Observer');
const Errors = require('./Errors');
const UUID = require('./UUID');
const core = require('./core');

const isPrimitive = core.isPrimitive;

function initialData(schema) {
    let data = schema.default;
    // 

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
        
        Object.defineProperty(this, 'data', {
            configurable: false,
            enumerable: true,
            get: this.getData,
            set: this.setData
        });

        this.data = initialData(this.schema);
    }

    getData() {

    }

    setData() {

    }

}

class Model extends BaseModel {
    constructor() {
        super(...arguments);
    }
}

module.exports = BaseModel;
