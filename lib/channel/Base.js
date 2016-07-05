/**
 * jsmodels Base communication channel abstract implementation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const EventEmitter = require('../EventEmitter');
const UUID = require('../UUID');

/**
 * @class BaseChannel
 * @classdesc Abstract implementation of basic communication
 *            channel for models synchronization
 */
class BaseChannel extends EventEmitter {

    /**
     * @constructor
     * @param {string} url
     * @param {object} options
     */
    constructor(url, options) {
        super();

        if (this.constructor.name === 'BaseChannel') {
            throw new SyntaxError(
                'Unable to instantiate abstract class \'BaseChannel\'!');
        }

        this.options = options;
        this.url = url;
        this.models = new WeakMap();

        Object.defineProperty(this, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: UUID()
        });
    }

    /**
     * Establishes channel connection link.
     * This is an interface method which is expected to be implemented
     * in a child class.
     *
     * @returns {Promise}
     */
    connect() {
        throw new SyntaxError(this.constructor.name +
            '.connect() not implemented!');
    }

    /**
     * Registers given model instance with this communication channel.
     * This is an interface method which is expected to be implemented
     * in a child class.
     *
     * @params {BaseModel} model
     * @returns {BaseChannel}
     */
    register(model) {
        throw new SyntaxError(this.constructor.name +
            '.register() not implemented!');
    }

    /**
     * Implements a job which has to be done when model is going to be
     * published over this channel.
     * This is an interface method which is expected to be implemented
     * in a child class.
     *
     * @param {BaseModel} model
     * @returns {BaseChannel}
     */
    publish(model) {
        throw new SyntaxError(this.constructor.name +
            '.publish() not implemented!');
    }

    /**
     * Implements a job which has to be done when given model
     * obtain updates from a current communication channel.
     * This is an interface method which is expected to be implemented
     * in a child class.
     *
     * @param {BaseModel} model
     * @param {object} channelData
     * @returns {BaseChannel}
     */
    subscribe(model, channelData) {
        throw new SyntaxError(this.constructor.name +
            '.subscribe() not implemented!');
    }

    /**
     * Registers a given close handler for this channel
     * This is an interface method which is expected to be implemented
     * in a child class.
     *
     * @param {Function} fn
     * @returns {BaseChannel}
     */
    onClose(fn) {
        throw new SyntaxError(this.constructor.name +
            '.onClose() not implemented!');
    }
}

module.exports = BaseChannel;
