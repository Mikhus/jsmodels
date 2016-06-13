const Schema = require('./Schema');
const EventEmitter = require('./EventEmitter');
const Observer = require('./Observer');
const UUID = require('./UUID');

function createData(context) {
    let schema = context.schema;
    let data = observe(schema.default, schema);
    
    // if (schema.type in )
}

createData.object = () => {

};

createData.array = () => {

};

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

        if (schema === undefined) {
            throw new TypeError(
                'Unable to instantiate model with undefined schema!');
        }

        this.schema = new Schema(schema);
        this.data = createData(this);
    }

    static create(schema) {

    }

}

class Model extends BaseModel {
    constructor() {
        super(...arguments);
    }
}

module.exports = BaseModel;
