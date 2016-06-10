const model = require('./model');

let Log = model.Log;

class BaseModel {
    constructor(data = {}) {
        if (this.constructor.name === 'BaseModel') {
            throw new TypeError('Abstract class can not be instantiated directly!');
        }

        Object.defineProperty(this, 'data', {
            enumerable: true,
            configurable: false,
            writable: false,
            value: new model.ValueObject(data, this.constructor.schema())
        });
    }

    get uuid() {
        return this.data['@uuid'];
    }

    get log() {
        return BaseModel.log;
    }
    set log(logger) {
        BaseModel.log = logger;
    }

    static get log() {
        return Log;
    }
    static set log(logger) {
        Log = logger;
    }

    static get schema() {
        throw new TypeError('schema() must be implemented in child class!')
    }

    toJSON(pretty = false) {
        if (pretty) {
            return JSON.stringify(this.data, null, 2);
        }

        return JSON.stringify(this.data);
    }
}

module.exports = BaseModel;
