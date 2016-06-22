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
const Log = require('./Log');

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

function merge(target, source) {
    // todo: implement data merge
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
     * @property {*} BaseModel.data
     */

    /**
     * @constructor
     * @param {*} schema
     * @param {*} [data]
     * @access public
     */
    constructor(schema, data) {
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

        let dataProxy = Observer.observe(
            data === void 0 ? defaultData(this.schema) : data,
            this.schema,
            this.errors,
            this
        );

        Object.defineProperty(this, 'data', {
            configurable: false,
            enumerable: true,
            get() { return dataProxy; },
            set(value) { merge(dataProxy, value); }
        });

        Object.defineProperty(this, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: UUID()
        });

        this.isPrimitive = core.isPrimitive(this.schema.type);

        this.removeAllListeners('invalidate');
    }

    /**
     * Overrides base method to always re-initialize invalidate
     * data events with logging
     *
     * @returns {BaseModel}
     * @access public
     */
    removeAllListeners() {
        super.removeAllListeners(...arguments);

        if (arguments[0] === 'invalidate') {
            // re-initialize default handler for invalidate events
            this.on('invalidate', (error) => {
                Log.warn(
                    this.constructor.name +
                    ' validation error:',
                    JSON.stringify(error, null, 2)
                );
            });
        }

        return this;
    }

    /**
     * Updates current model data
     *
     * @param {*} data
     * @returns {BaseModel}
     * @access public
     */
    update(data) {
        this.data = data;

        return this;
    }

    /**
     * Defines a new model, based on a given schema,
     * provides a functionaly-way of model definitions
     *
     * @param schema
     * @param data
     * @returns {Model}
     */
    static create(schema, data) {
        let model = new Model(schema, data);

        return model;
    }

}

/**
 * @classdesc Generic model class for functional style of model definitions
 * @class Model
 * @access private
 */
class Model extends BaseModel {
    constructor() {
        super(...arguments);
    }
}

module.exports = BaseModel;
