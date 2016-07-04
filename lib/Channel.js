const BaseChannel = require('./channel/Base');

let connections = {};

class ChannelFactory {

    /**
     *
     * @param {BaseModel} model
     * @param {*} driver
     * @param {object} options
     * @
     */
    static create(model, driver, url, options) {
        let channel = connections[url];

        if (!channel) {
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
        }

        connections[url] = channel;

        channel.register(model);

        return channel;
    }
}

module.exports = ChannelFactory;
