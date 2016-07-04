const WebSocket = require('ws');
const BaseChannel = require('./Base');

class WebSocketChannel extends BaseChannel {

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

    register(model) {
        if (this.models.has(model)) {
            return this;
        }

        this.models.set(model, true);

        model.on('publish', this.publish.bind(this, model));

        this.connect().then(socket =>
            socket.on('message', message =>
                this.subscribe(model, JSON.parse(message))));

        return this;
    }

    publish(model) {
        this.connect().then(socket => {
            try {
                socket.send(JSON.stringify(model));
            }

            catch (err) {
                console.error(err);
            }
        });

        return this;
    }

    subscribe(model, jsonModel) {
        if (jsonModel.uuid === model.uuid) {
            return ;
        }

        // TODO: subscribe only corresponding model, don't touch others!!!
        model.data = jsonModel.data;
    }
}

module.exports = WebSocketChannel;
