module.exports = Object.assign(require('./lib/BaseModel'), {
    Schema: require('./lib/Schema'),
    Observer: require('./lib/Observer'),
    EventEmitter: require('./lib/EventEmitter'),
    Log: require('./lib/Log'),
    UUID: require('./lib/UUID'),
    Errors: require('./lib/Errors')
}, require('./lib/core'));
