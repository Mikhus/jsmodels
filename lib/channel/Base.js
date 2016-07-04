const EventEmitter = require('../EventEmitter');

class BaseChannel extends EventEmitter {
    constructor(url, options) {
        super();

        this.options = options;
        this.url = url;
        this.models = new WeakMap();
    }
}

module.exports = BaseChannel;
