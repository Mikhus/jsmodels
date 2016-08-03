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
     * This event fired each time model data sent for synchronization
     *
     * @event BaseModel#publish
     */

    /**
     * This event fired each time model data is changed
     *
     * @event BaseModel#change
     */

    /**
     * This event fired each time when the model data gets renew from
     * a remote source
     *
     * @event BaseModel#renew
     */

    /**
     * This event fired each time model error is occured
     *
     * @event BaseModel#error
     */

    /**
     * Model's data
     *
     * @property {*} BaseModel.data
     */

    /**
     * Unified unique identifier of the model object
     *
     * @property {string} BaseModel.uuid
     */

    /**
     * @constructor
     * @param {*} schema
     * @param {*} [data]
     * @param {string} [uuid]
     * @access public
     */
    constructor(schema, data, uuid) {
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
            data === void 0 ? this.defaults() : data,
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
                    //noinspection JSUnusedAssignment
                    dataProxy = Observer.observe(
                        value,
                        self.schema,
                        self.errors,
                        self
                    );
                }

                else {
                    //noinspection JSUnusedAssignment
                    dataProxy = Observer.merge(
                        dataProxy,
                        value,
                        self.schema,
                        self.errors,
                        self
                    );
                }

                self.emit('change', 'data', self, value);

                return true;
            }
        });

        Object.defineProperty(this, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: uuid || UUID()
        });

        this.isPrimitive = core.isPrimitive(this.schema.type);
        this.channels = [];
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
     * Serializes this model object to JSON-compatible plain object
     *
     * @returns {{uuid, data: object}}
     */
    toJSON() {
        return {
            uuid: this.uuid,
            data: this.data,
            schema: this.schema.toJSON()
        };
    }

    /**
     * Sets given value to the given property name of model's data object
     *
     * @param {*} name
     * @param {*} value
     * @returns {BaseModel}
     */
    set(name, value) {
        this.data[name] = value;

        return this;
    }

    /**
     * Returns a value of the given model's property name
     *
     * @param {*} name
     */
    get(name) {
        return this.data[name];
    }

    /**
     * Defines a new model, based on a given schema,
     * provides a functional way of model definitions
     *
     * @param {object|Schema} schema
     * @param {*} [data]
     * @param {string} [uuid]
     * @returns {Model}
     */
    static create(schema, data, uuid) {
        return new Model(schema, data, uuid);
    }

    /**
     * Adds a new communication channel for this model for
     * synchronization with the remote locations of this model
     *
     * @param {BaseChannel} channel
     */
    connect(channel) {
        this.channels.push(channel);

        return this;
    }

    /**
     * Sync this model through a given channel or through an existing
     * connected channels if no channel is bypassed
     *
     * @param {BaseChannel} [channel]
     */
    sync(channel = null) {

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
