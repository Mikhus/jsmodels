const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const isBrowser = typeof window !== 'undefined' &&
    typeof navigator !== 'undefined';


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

function driver() {
    return {
        log() {},
        warn() {},
        error() {}
    };
}

let level, prefixed, showDateTime, logger;

describe('Log', () => {
    let Log;

    // turn it off currently until browser testing started
    xdescribe('Load Module', () => {
        it('log driver should be initialized from window console by default ' +
            'if window is defined', () =>
        {
            logger = driver();

            let path = fs.realpathSync(
                fs.realpathSync(__dirname) + '/../../lib/Log.js');

            Log = $require(path, { window: { console: logger } });

            expect(Log.logger).to.be.equal(logger);
        });

        it('log driver should be initialized from global console by default ' +
            'if  global is defined', () =>
        {
            logger = driver();

            let path = fs.realpathSync(
                fs.realpathSync(__dirname) + '/../../lib/Log.js');

            Log = $require(path, { global: { console: logger } });

            expect(Log.logger).to.be.equal(logger);
        });

        it('log driver should be initialized from mocked console by default ' +
            'if neither window nor global are defined', () =>
        {
            logger = driver();

            let path = fs.realpathSync(
                fs.realpathSync(__dirname) + '/../../lib/Log.js');

            Log = $require(path);

            expect(JSON.stringify(Object.keys(Log.logger))).to.be
                .equal(JSON.stringify(Object.keys(logger)));
        });
    });

    describe('API', () => {
        before(() => {
            Log = require('../../lib/Log');

            level = Log.LEVEL;
            prefixed = Log.prefixed;
            showDateTime = Log.showDateTime;
            logger = Log.logger;
        });

        beforeEach(() => {
            Log.logger = driver();
        });

        afterEach(() => {
            Log.LEVEL = level;
            Log.prefixed = prefixed;
            Log.showDateTime = showDateTime;
            Log.logger = logger;

            for (let key in Log) {
                if (typeof Log[key].restore === 'function') {
                    Log[key].restore();
                }
            }
        });

        it('should have debug() method', () => {
            expect(typeof Log.debug).to.equal('function');
        });

        it('should have log() method', () => {
            expect(typeof Log.log).to.equal('function');
        });

        it('should have warn() method', () => {
            expect(typeof Log.warn).to.equal('function');
        });

        it('should have error() method', () => {
            expect(typeof Log.error).to.equal('function');
        });

        describe('Log.DEBUG', () => {
            it('should return valid numeric value', () => {
                expect(Log.DEBUG).to.equal(16);
            });
            it('should be read-only and do not throw error on change', () => {
                if (isBrowser) {
                    expect(() => Log.DEBUG = 1).to.throw(Error);
                }

                else {
                    expect(() => Log.DEBUG = 1).to.not.throw(Error);
                }

                expect(Log.DEBUG).to.equal(16);
            });
        });

        describe('Log.INFO', () => {
            it('should return valid numeric value', () => {
                expect(Log.INFO).to.equal(8);
            });
            it('should be read-only and do not throw error on change', () => {
                if (isBrowser) {
                    expect(() => Log.INFO = 1).to.throw(Error);
                }

                else {
                    expect(() => Log.INFO = 1).to.not.throw(Error);
                }

                expect(Log.INFO).to.equal(8);
            });
        });

        describe('Log.WARN', () => {
            it('should return valid numeric value', () => {
                expect(Log.WARN).to.equal(4);
            });
            it('should be read-only and do not throw error on change', () => {
                Log.LEVEL |= Log.DEBUG;

                if (isBrowser) {
                    expect(() => Log.WARN = 1).to.throw(Error);
                }

                else {
                    expect(() => Log.WARN = 1).to.not.throw(Error);
                }

                expect(Log.WARN).to.equal(4);
            });
        });

        describe('Log.ERROR', () => {
            it('should return valid numeric value', () => {
                expect(Log.ERROR).to.equal(2);
            });
            it('should be read-only and do not throw error on change', () => {
                if (isBrowser) {
                    expect(() => Log.ERROR = 1).to.throw(Error);
                }

                else {
                    expect(() => Log.ERROR = 1).to.not.throw(Error);
                }

                expect(Log.ERROR).to.equal(2);
            });
        });

        describe('Log.NONE', () => {
            it('should return valid numeric value', () => {
                expect(Log.NONE).to.equal(0);
            });
            it('should be read-only and do not throw error on change', () => {
                if (isBrowser) {
                    expect(() => Log.NONE = 1).to.throw(Error);
                }

                else {
                    expect(() => Log.NONE = 1).to.not.throw(Error);
                }

                expect(Log.NONE).to.equal(0);
            });
        });

        describe('Log.logger', () => {
            it('should return a proper logging driver', () => {
                Log.logger = console;
                expect(Log.logger).to.equal(console);
            });
            it('should accept a valid driver on set operation', () => {
                expect(() => Log.logger = driver()).to.not.throw(TypeError);
            });
            it('should throw TypeError on attempt to set invalid driver', () => {
                let drv = driver();
                delete drv['log'];
                expect(() => Log.logger = drv).to.throw(TypeError);
                expect(() => Log.logger = null).to.throw(TypeError);
                expect(() => Log.logger = '').to.throw(TypeError);
                expect(() => Log.logger = undefined).to.throw(TypeError);
                expect(() => Log.logger = true).to.throw(TypeError);
                expect(() => Log.logger = Function).to.throw(TypeError);
            });
        });

        describe('Log.debug()', () => {
            it('should output given arguments through logging driver', () => {
                Log.LEVEL = Log.DEBUG;

                sinon.spy(Log.logger, 'log');

                Log.debug(1, 2, 3);

                expect(Log.logger.log.called).to.equal(true);

                Log.prefixed = false;

                Log.debug(1, 2, 3);

                expect(Log.logger.log.calledWith(1, 2, 3)).to.equal(true);
            });
            it('should not call driver if log level is not DEBUG', () => {
                Log.LEVEL = level;

                sinon.spy(Log.logger, 'log');

                Log.debug(1, 2, 3);

                expect(Log.logger.log.called).to.equal(false);
            });
            it('should not be prefixed with dateTime if showDateTime option is off',
                () => {
                    Log.LEVEL = Log.DEBUG;
                    Log.showDateTime = false;

                    sinon.spy(Log.logger, 'log');

                    Log.debug();

                    expect(typeof Log.logger.log.args[0][0]).to.equal('string');
                    expect(
                        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/.test(
                            Log.logger.log.args[0][0]
                        )
                    ).to.equal(false);
                }
            );
        });

        describe('Log.log()', () => {
            it('should output given arguments through logging driver', () => {
                Log.LEVEL = Log.INFO;

                sinon.spy(Log.logger, 'log');

                Log.log();

                expect(Log.logger.log.called).to.equal(true);

                Log.prefixed = false;

                Log.log(1, 2, 3);

                expect(Log.logger.log.calledWith(1, 2, 3)).to.equal(true);
            });
            it('should not call driver if log level is not INFO', () => {
                Log.LEVEL = Log.WARN | Log.ERROR;

                sinon.spy(Log.logger, 'log');

                Log.log(1, 2, 3);

                expect(Log.logger.log.called).to.equal(false);
            });
            it('should be called if log level is DEBUG', () => {
                Log.LEVEL = Log.DEBUG;

                sinon.spy(Log.logger, 'log');

                Log.log();

                expect(Log.logger.log.called).to.equal(true);
            });
            it('should not be prefixed with dateTime if showDateTime option is off',
                () => {
                    Log.LEVEL = Log.INFO;
                    Log.showDateTime = false;

                    sinon.spy(Log.logger, 'log');

                    Log.log();

                    expect(typeof Log.logger.log.args[0][0]).to.equal('string');
                    expect(
                        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/.test(
                            Log.logger.log.args[0][0]
                        )
                    ).to.equal(false);
                }
            );
        });

        describe('Log.warn()', () => {
            it('should output given arguments through logging driver', () => {
                Log.LEVEL = Log.WARN;

                sinon.spy(Log.logger, 'warn');

                Log.warn();

                expect(Log.logger.warn.called).to.equal(true);

                Log.prefixed = false;

                Log.warn(1, 2, 3);

                expect(Log.logger.warn.calledWith(1, 2, 3)).to.equal(true);
            });
            it('should not call driver if log level is not WARN', () => {
                Log.LEVEL = Log.INFO | Log.ERROR;

                sinon.spy(Log.logger, 'warn');

                Log.warn();

                expect(Log.logger.warn.called).to.equal(false);
            });
            it('should be called if log level is DEBUG', () => {
                Log.LEVEL = Log.DEBUG;

                sinon.spy(Log.logger, 'warn');

                Log.warn();

                expect(Log.logger.warn.called).to.equal(true);
            });
            it('should not be prefixed with dateTime if showDateTime option is off',
                () => {
                    Log.LEVEL = Log.WARN;
                    Log.showDateTime = false;

                    sinon.spy(Log.logger, 'warn');

                    Log.warn();

                    expect(typeof Log.logger.warn.args[0][0]).to.equal('string');
                    expect(
                        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/.test(
                            Log.logger.warn.args[0][0]
                        )
                    ).to.equal(false);
                }
            );
        });

        describe('Log.error()', () => {
            it('should output given arguments through logging driver', () => {
                Log.LEVEL = Log.ERROR;

                sinon.spy(Log.logger, 'error');

                Log.error();

                expect(Log.logger.error.called).to.equal(true);

                Log.prefixed = false;

                Log.error(1, 2, 3);

                expect(Log.logger.error.calledWith(1, 2, 3)).to.equal(true);
            });
            it('should not call driver if log level is not WARN', () => {
                Log.LEVEL = Log.INFO | Log.WARN;

                sinon.spy(Log.logger, 'error');

                Log.error();

                expect(Log.logger.error.called).to.equal(false);
            });
            it('should be called if log level is DEBUG', () => {
                Log.LEVEL = Log.DEBUG;

                sinon.spy(Log.logger, 'error');

                Log.error();

                expect(Log.logger.error.called).to.equal(true);
            });
            it('should not be prefixed with dateTime if showDateTime option is off',
                () => {
                    Log.LEVEL = Log.ERROR;
                    Log.showDateTime = false;

                    sinon.spy(Log.logger, 'error');

                    Log.error();

                    expect(typeof Log.logger.error.args[0][0]).to.equal('string');
                    expect(
                        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/.test(
                            Log.logger.error.args[0][0]
                        )
                    ).to.equal(false);
                }
            );
        });
    });
});
