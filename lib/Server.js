const WebSocket = require('ws');
const Log = require('./Log');

let options = {
    host: '0.0.0.0',
    port: 8200
};

/**
 * Messages:
 * 1. Handshake
 *   {
 *      type: MSG_HANDSHAKE,
 *      uuid: string
 *   }
 *
 * 2. Subscribe:
 *  {
 *      type: MSG_SUBSCRIBE,
 *      model?: {{
 *          uuid: string,
 *          data: object,
 *          schema: object
 *      }},
 *      namespace?: string
 *  }
 *
*  3. Broadcast:
 *  {
 *      type: MSG_BROADCAST,
 *      model: {{
 *
 *      }}
 *  }
 */

const MSG_HANDSHAKE = 0;
const MSG_SUBSCRIBE = 1;
const MSG_BROADCAST = 2;

class Server {
    constructor(options = {}) {
        this.clients = new Map();
        this.models = new WeakMap();

        this.options = Object.assign({}, Server.options, options);
        this.instance = new WebSocket.Server(this.options);
        this.instance.on('connection', this.listen.bind(this));
    }

    listen(client) {
        this.clients.set(client, false);

        client.on('message', message => this.process(client, message));
        client.on('close', () => this.clients.delete(client));
    }

    process(client, message) {
        Log.debug('Message got:', message);

        let data = this.parse(message);

        if (!data.uuid) {
            // invalid packet, just ignore it
            return ;
        }

        if (data.uuid && !data.model) {
            // upgrade client info - this is handshake message
            this.clients.set(client, data.uuid);

            return ;
        }

        let uuid;

        for ([client, uuid] of this.clients) {
            // prevent message to be sent back
            if (this.clients.get(client) !== uuid) {
                client.send(message);
            }
        }
    }

    parse(message) {
        let data = {};

        try {
            data = JSON.parse(message) || {};
        }

        catch (err) {
            Log.error(err);
            return false;
        }

        return data;
    }

    get url() {
        let host = this.options.host;

        if (host === '0.0.0.0') {
            host = 'localhost';
        }

        return 'ws://' + host + ':' + this.options.port;
    }
}

Object.defineProperty(Server, 'options', {
    enumerable: true,
    configurable: true,
    get() { return options; },
    set(value) { Object.assign(options, value); }
});

module.exports = Server;
