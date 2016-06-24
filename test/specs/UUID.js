const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');

function $require(fileName, context) {
    let code = fs.readFileSync(fileName);
    let sandbox = Object.assign({
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        require(path) { return $require(path, context); },
        module: module,
        exports: exports,
        process: process,
        Buffer: Buffer
    }, context|| {});

    return vm.runInNewContext(code, sandbox, fileName);
}

describe('UUID', () => {
    let UUID;

    // turn it off currently until browser testing started
    xdescribe('Load Module', () => {
        it('should use modern random function from window if it is ' +
            'defined', () =>
        {
            let path = fs.realpathSync(
                fs.realpathSync(__dirname) + '/../../lib/UUID.js');
            let context = {
                window: {
                    crypto: {
                        getRandomValues: Math.random.bind()
                    }
                }
            };

            sinon.spy(context.window.crypto, 'getRandomValues');

            $require(path, context)();

            expect(context.window.crypto.getRandomValues.called).to.be.true;
        });
    });

    describe('API', () => {
        UUID = require('../../lib/UUID');

        const maxTimeout = 10000;

        it('should be function type', () => {
            expect(UUID).to.be.function;
        });

        it('should return string 36 bytes length each time called', () => {
            for (let i = 0; i < 1000; i++) {
                expect(UUID()).to.be.string;
                expect(UUID().length).to.be.equal(36);
            }
        });

        it('should match RFC4122 spec', () => {
            let regex = new RegExp(
                '^' +
                '[0-9a-f]{8}' +
                 '-' +
                '[0-9a-f]{4}' +
                 '-' +
                '[1-5][0-9a-f]{3}' +
                 '-' +
                '[89ab][0-9a-f]{3}' +
                 '-' +
                '[0-9a-f]{12}' +
                '$',
                'i'
            );

            expect(regex.test(UUID())).to.be.true;
        });

        it('should be unique each time generated (per 100,000 of test ' +
            'calls)', () =>
        {
            let keyStore = {};
            let steps = 100000;

            for (let i = 0; i < steps; i++) {
                keyStore[UUID()] = 1;
            }

            expect(Object.keys(keyStore).length).to.be.equal(steps);
        }).timeout(maxTimeout); // increase to 10 seconds;

        it('should generate 100,000 identifiers in less than a second', () => {
            let steps = 100000;
            let end, uuid;
            let start = new Date().getTime();

            for (let i = 0; i < steps; i++) {
                uuid = UUID();
            }

            end = new Date().getTime();

            expect(end - start).to.be.below(1000);
        }).timeout(maxTimeout);
    });
});