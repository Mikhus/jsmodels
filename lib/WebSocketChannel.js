/**
 * jsmodels WebSocket-based communication channel implementation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const BaseChannel = require('./BaseChannel');
const Log = require('./Log');

if (typeof WebSocket === 'undefined') {
    var WebSocket = require('ws');
}

/**
 * @class WebSocketChannel
 * @classdesc WebSocket-based communication channel implementation
 */
class WebSocketChannel extends BaseChannel {

}

module.exports = WebSocketChannel;
