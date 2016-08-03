/**
 * jsmodels Base communication channel abstract implementation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const EventEmitter = require('./EventEmitter');
const UUID = require('./UUID');

/**
 * @class BaseChannel
 * @classdesc Abstract implementation of basic communication
 *            channel for models synchronization
 */
class BaseChannel extends EventEmitter {

    /**
     * Unified unique identifier of the communication channel
     *
     * @property {string} BaseChannel.uuid
     */

    constructor() {
        Object.defineProperty(this, 'uuid', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: UUID()
        });
    }

}

module.exports = BaseChannel;
