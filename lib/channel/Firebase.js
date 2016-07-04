const BaseChannel = require('./Base');

class FirebaseChannel extends BaseChannel {
    connect() {

    }

    register(model) {

    }

    publish(model) {
        // serialize model and send
    }

    subscribe(data, model) {
        // update model with given data
    }
}

module.exports = FirebaseChannel;
