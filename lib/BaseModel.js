/**
 * jsmodels abstract BaseModel implementation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const Schema = require('./Schema');
const EventEmitter = require('./EventEmitter');
const Observer = require('./Observer');
const UUID = require('./UUID');
const core = require('./core');

/**
 * Constructs and returns default data based on a given schema
 *
 * @param {Schema} schema
 * @returns {*}
 */
function defaultData(schema) {
    let data;

    if (schema.type === 'object') {
        data = {};

        let properties = schema.properties;
        let props = Object.keys(properties);
        let i = 0;
        let s = props.length;

        for (; i < s; i++) {
            let prop = props[i];
            data[prop] = defaultData(properties[prop]);
        }
    }

    else {
        data = schema.type === 'array' ?
            Array.prototype.slice.call(schema.default) :
            schema.default;
    }

    return data;
}

function update(target, source, type) {
}    // todo: implement


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
     * @property {*} BaseModel.data
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
        this.errors = [];

        Object.defineProperty(this, 'data', {
            configurable: false,
            enumerable: true,
            writable: core.isPrimitive(this.schema.type),
            value: Observer.observe(
                defaultData(this.schema),
                this.schema,
                this.errors,
                this
            )
        });

        Object.defineProperty(this, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: UUID()
        });

        this.isPrimitive = core.isPrimitive(this.schema.type);
    }

    set() {
        if (this.isPrimitive) {
            this.data = Observer.observe(
                arguments[0],
                this.schema,
                this.errors,
                this
            );

            return this;
        }

        this.data[arguments[0]] = arguments[1];
    }

    get() {
        if (!arguments.length) {
            return this.data;
        }

        return this.data[arguments[0]];
    }

    update(data) {
        if (this.isPrimitive) {
            this.data = data;

            return this;
        }

        update(this.data, data, this.schema.type);

        return this;
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
