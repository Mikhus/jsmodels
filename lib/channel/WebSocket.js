/**
 * jsmodels WebSocket-based communication channel implementation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const BaseChannel = require('./Base');
const Log = require('../Log');

if (typeof WebSocket === 'undefined') {
    var WebSocket = require('ws');
}

/**
 * @class WebSocketChannel
 * @classdesc WebSocket-based communication channel implementation
 */
class WebSocketChannel extends BaseChannel {

    /**
     * Establishes web socket connection link.
     *
     * @returns {Promise}
     */
    connect() {
        if (!this.socket || this.socket.readyState > WebSocket.OPEN) {
            this.socket = new WebSocket(this.url);
        }

        return new Promise((resolve, reject) => {
            if (this.socket.readyState === WebSocket.OPEN) {
                resolve(this.socket);
            }

            else if (this.socket.readyState === WebSocket.CONNECTING) {
                this.socket.on('open', () => resolve(this.socket));
            }

            else {
                return reject('Can not connect socket!');
            }
        });
    }

    /**
     * Registers given model instance with this communication channel.
     *
     * @params {BaseModel} model
     * @returns {BaseChannel}
     */
    register(model) {
        if (this.models.has(model)) {
            //noinspection JSValidateTypes
            return this;
        }

        this.models.set(model, true);

        model.on('publish', this.publish.bind(this, model));

        this.connect().then(socket =>
            socket.on('message', message =>
                this.subscribe(model, JSON.parse(message))));

        //noinspection JSValidateTypes
        return this;
    }

    /**
     * Implements a job which has to be done when model is going to be
     * published over this channel.
     *
     * @param {BaseModel} model
     * @returns {BaseChannel}
     */
    publish(model) {
        this.connect().then(socket => {
            try {
                socket.send(JSON.stringify({
                    uuid: this.uuid,
                    model: model.toJSON()
                }));
            }

            catch (err) {
                Log.error(err);
            }
        });

        //noinspection JSValidateTypes
        return this;
    }

    /**
     * Implements a job which has to be done when given model
     * obtain updates from a current communication channel.
     *
     * @param {BaseModel} model
     * @param {object} channelData
     * @returns {BaseChannel}
     */
    subscribe(model, channelData) {
        if (!this.options.allowSelfRenewal && channelData.uuid === this.uuid) {
            return this;
        }

        if (model.uuid === channelData.model.uuid) {
            let oldData = JSON.parse(JSON.stringify(model.data));

            model.data = channelData.model.data;

            model.emit('renew', oldData, channelData.model.data);
        }

        //noinspection JSValidateTypes
        return this;
    }

    /**
     * Registers a given close handler for this channel
     *
     * @param {Function} fn
     * @returns {BaseChannel}
     */
    onClose(fn) {
        this.socket && this.socket.on('close', fn);

        //noinspection JSValidateTypes
        return this;
    }
}

module.exports = WebSocketChannel;
