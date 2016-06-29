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

        // initialize debugger for invalidate events
        this.on('invalidate', (error) => {
            Log.debug(
                this.constructor.name +
                ' validation error:',
                JSON.stringify(error, null, 2)
            );
        });

        this.schema = schema instanceof Schema ? schema : new Schema(schema);
        this.errors = [];

        let dataProxy = Observer.observe(
            data === void 0 ? defaultData(this.schema) : data,
            this.schema,
            this.errors,
            this
        );

        let self = this;

        Object.defineProperty(this, 'data', {
            configurable: false,
            enumerable: true,
            get() { return dataProxy; },
            set(value) {
                if (self.isPrimitive) {
                    dataProxy = Observer.observe(
                        value,
                        self.schema,
                        self.errors,
                        self
                    );

                    return true;
                }

                dataProxy = Observer.merge(
                    dataProxy,
                    value,
                    self.schema,
                    self.errors,
                    self
                );

                return true;
            }
        });

        Object.defineProperty(this, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: UUID()
        });

        this.isPrimitive = core.isPrimitive(this.schema.type);
    }

    /**
     * Returns default data representation of the current model
     *
     * @returns {*}
     * @access public
     */
    defaults() {
        return defaultData(this.schema);
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
        return new Model(schema, data);
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
