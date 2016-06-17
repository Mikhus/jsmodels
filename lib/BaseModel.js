const Schema = require('./Schema');
const EventEmitter = require('./EventEmitter');
const Observer = require('./Observer');
const Errors = require('./Errors');
const UUID = require('./UUID');
const core = require('./core');

function defaultData(schema) {
    let data;

    if (schema.type === 'object') {
        data = {};

        let props = Object.keys(schema.properties);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];
            data[prop] = defaultData(schema.properties[prop]);
        }
    }

    else {
        data = schema.default;
    }

    return data;
}

/**
 * @class BaseModel
 * @extends EventEmitter
 * @abstract
 */
class BaseModel extends EventEmitter {

    /**
     * This event fired each time model data has been failed validation
     * conditions
     *
     * @event BaseModel#invalidate
     */

    /**
     * This event fired each time model data has got sync request from
     * remote source
     *
     * @event BaseModel#sync
     */

    /**
     * This even fired each time model data has been saved to remote source
     *
     * @event BaseModel#save
     */

    /**
     * This event fired each time model error is occured
     *
     * @event BaseModel#error
     */

    /**
     * @constructor
     * @param {*} schema
     */
    constructor(schema) {
        super();

        if (this.constructor.name === 'BaseModel') {
            throw new SyntaxError(
                'Unable to instantiate abstract class \'BaseModel\'!');
        }

        if (schema === void 0) {
            throw new TypeError(
                'Unable to instantiate model with undefined schema!');
        }

        this.schema = schema instanceof Schema ? schema : new Schema(schema);
        this.errors = new Errors();

        Object.defineProperty(this, 'data', {
            configurable: true,
            enumerable: true,
            writable: core.isPrimitive(this.schema.type),
            value: Observer.observe(
                defaultData(this.schema),
                this.schema,
                this.errors.data,
                this
            )
        });
    }

    update(data) {

    }

    link(driver) {
        this.driver = driver;
    }

    save(driver = this.driver) {
        driver && driver.save && driver.save(this);
    }

    static create(schema, data) {
        let model = new Model(schema);

        if (data !== void 0) {
            model.update(data);
        }

        return model;
    }

}

class Model extends BaseModel {
    constructor() {
        super(...arguments);
    }
}

module.exports = BaseModel;
