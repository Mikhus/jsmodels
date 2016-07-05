const expect = require('chai').expect;
const sinon = require('sinon');
const Channel = require('../../lib/Channel');
const BaseModel = require('../../lib/BaseModel');

if (typeof WebSocket === 'undefined') {
    var WebSocket = require('ws');
}

function startWss(fn, port) {
    let clients = {};
    let wss = new WebSocket.Server({
        port: port
    });

    wss.on('connection', ws => {
        let id = new Date().getTime() + Math.random();

        clients[id] = ws;

        ws.on('message', message => {
            let keys = Object.keys(clients);
            let i = 0, s = keys.length;

            for (; i < s; i++) {
                clients[keys[i]].send(message);
            }
        });

        ws.on('close', () => delete clients[id]);
    });

    setTimeout(fn, 500);

    return wss;
}

function stopWss(wss) {
    setTimeout(() => wss && wss.close && wss.close(), 500);
}

describe('Channel', () => {
    let model = BaseModel.create({});
    let url = 'ws://localhost:';

    it('should have options defined', () => {
        expect(Channel).to.have.property('options');
        expect(Channel.options).to.be.an('object');
    });
    it('should automatically merge options on assign', () => {
        sinon.spy(Object, 'assign');

        Channel.options = {};

        expect(Object.assign.called).to.be.true;
        expect(Channel.options).to.have.all.keys([
            'allowSelfRenewal'
        ]);
        Object.assign.restore();
    });

    describe('Channel.create()', () => {
        it('should create a proper channel', () => {

        });

        it('should throw if invalid channel driver given', () => {
            let port = 8899;

            expect(() => Channel.create(model, 'Unknown', url + port))
                .to.throw(Error);

            expect(() => Channel.create(model, () => {}, url + port))
                .to.throw(TypeError);

            expect(() => Channel.create(model, {}, url + port))
                .to.throw(TypeError);
        });

        it('should return existing channel got the given url', (done) => {
            let port = 8899;
            let wss = startWss(() => {
                let channel = Channel.create(model, 'WebSocket', url + port);

                expect(Channel.create(model, 'WebSocket', url + port))
                    .to.be.equal(channel);

                stopWss(wss);
                done();
            }, port);
        }).timeout(5000);
    });
});
