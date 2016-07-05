/**
 * jsmodels Communication channels factory for models
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const BaseChannel = require('./channel/Base');

/**
 * Default generic channel options
 *
 * @access private
 * @type {{
 *  allowSelfRenewal: boolean
 * }}
 */
const options = {
    allowSelfRenewal: false
};

/**
 *
 * @type {object}
 * @access private
 */
let connections = {};

/**
 * @class ChannelFactory
 * @classdesc Factory of communication channels for jsmodels
 */
class ChannelFactory {

    /**
     * @property {{
     *  allowSelfRenewal: boolean
     * }} ChannelFactory#options
     */

    /**
     * Creates and returns an instance of the proper communication
     * channel due to a given channel data for a given model.
     *
     * @param {*} driver
     * @param {string} url
     * @param {object} [options]
     * @param {BaseModel} [model]
     * @returns {BaseChannel}
     */
    static create(driver, url, options, model) {
        let channel = connections[url];

        if (channel) {
            model && channel.register(model);

            return channel;
        }

        options = Object.assign(options || {}, ChannelFactory.options);

        let driverType = typeof driver;

        if (driverType === 'string') {
            channel = new (require('./channel/' + driver))(url, options);
        }

        else if (driverType === 'function') {
            channel = new driver(url, options);
        }

        if (!(channel instanceof BaseChannel)) {
            throw new TypeError('Invalid model sync driver!');
        }

        connections[url] = channel;
        model && channel.register(model);
        channel.onClose(() => delete connections[url]);

        return channel;
    }
}

Object.defineProperty(ChannelFactory, 'options', {
    enumerable: true,
    configurable: true,
    get() { return options; },
    set(value) { Object.assign(options, value); }
});

module.exports = ChannelFactory;
