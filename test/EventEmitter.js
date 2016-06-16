const expect = require('chai').expect;
const sinon = require('sinon');
const Emitter = require('events');
const EventEmitter = require('../lib/EventEmitter');

describe('EventEmitter', () => {
    let emitter;

    beforeEach(() => {
        emitter = new EventEmitter();
    });

    it('should inherit Emitter', () => {
        expect(emitter instanceof Emitter).to.be.true;
    });

    describe('EventEmitter.emit()', () => {
        it('should always return Promise', () => {
            expect(emitter.emit() instanceof Promise).to.be.true;
        });

        it('should safely initialize internal events storage', () => {
            emitter._events = void 0;
            emitter.emit();

            expect(emitter._events).not.to.be.undefined;
        });

        it('should throw TypeError if given event type is "error"', () => {
            expect(() => emitter.emit('error')).to.throw(Error);
        });

        it('should throw given error if event type is "error" and error ' +
            'argument provided', () => {
            expect(() =>
                emitter.emit('error', new TypeError)
            ).to.throw(TypeError);
        });

        it('should not throw error if given event type is "error", but at ' +
            'least one proper event listener is defined', () => {
            emitter.on('error', () => {});
            expect(() => emitter.emit('error')).to.not.throw();
        });

        it('should throw error if given event type is "error", proper event ' +
            'listener is defined, but all listeners are removed', () => {
            emitter.on('error', () => {});
            emitter._events.error = [];
            expect(() => emitter.emit('error')).to.throw(Error);
        });

        it('should execute event handlers, with the proper arguments ' +
            'bypassed', () => {
            let handlers = {
                one: () => {},
                another: () => {}
            };

            sinon.spy(handlers, 'one');
            sinon.spy(handlers, 'another');

            emitter.on('myevent', handlers.one);
            emitter.on('myevent', handlers.another);
            emitter.emit('myevent', 1, 2);

            Object.keys(handlers).forEach((name) => {
                expect(handlers[name].calledWith(1, 2)).to.be.true;
            });
        });

        it('should execute nothing, if event handlers are invalid ' +
            'object', () => {
            let handlers = {
                one: () => {},
                another: () => {}
            };

            sinon.spy(handlers, 'one');
            sinon.spy(handlers, 'another');

            emitter.on('myevent', handlers.one);
            emitter.on('myevent', handlers.another);
            emitter._events.myevent = 42;
            emitter.emit('myevent', 1, 2);

            Object.keys(handlers).forEach((name) => {
                expect(handlers[name].calledWith(1, 3)).to.be.false;
            });
        });

        it('should bypass any number of arguments', () => {
            let handlers = {
                one: () => {}
            };

            sinon.spy(handlers, 'one');

            emitter.on('myevent', handlers.one);

            emitter.emit('myevent', 1);
            expect(handlers.one.calledWith(1)).to.be.true;

            emitter.emit('myevent', 1, 2);
            expect(handlers.one.calledWith(1, 2)).to.be.true;

            emitter.emit('myevent', 1, 2, 3);
            expect(handlers.one.calledWith(1, 2, 3)).to.be.true;
        });

        it('should accept hadnlers, which return promises and should await ' +
            'promise resolution', (done) => {
            let handler = () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('done');
                    });
                });
            };

            emitter.on('myevent', handler);

            emitter.emit('myevent').then((result) => {
                expect(result[0]).to.equal('done');
                done();
            });
        });
    });
});
