module.exports = Object.assign(require('./lib/BaseModel'), {
    Schema: require('./lib/Schema'),
    Observer: require('./lib/Observer'),
    EventEmitter: require('./lib/EventEmitter'),
    Log: require('./lib/Log'),
    UUID: require('./lib/UUID'),
    Channel: require('./lib/Channel'),
    BaseChannel: require('./lib/channel/Base'),
    WebSocketChannel: require('./lib/channel/WebSocket'),
    FirebaseChannel: require('./lib/channel/Firebase')
}, require('./lib/core'));
