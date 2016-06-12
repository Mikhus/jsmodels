const DEBUG = 16;
const INFO = 8;
const WARN = 4;
const ERROR = 2;
const NONE = 0;

class Log {

    static get DEBUG() { return DEBUG; }
    static get INFO() { return INFO; }
    static get WARN() { return WARN; }
    static get ERROR() { return ERROR; }
    static get NONE() { return NONE; }

    static get logger() {
        if (typeof console !== 'undefined') {
            return console;
        }

        return { // no system logger availabele, mock it with fake logger
            log() {},
            warn() {},
            error() {}
        };
    }

    static debug() {
        (
            Log.LEVEL === (Log.LEVEL | DEBUG)
        ) &&

        Log.logger.log('DEBUG:', ...arguments);
    }

    static log() {
        (
            Log.LEVEL === (Log.LEVEL | INFO) ||
            Log.LEVEL === (Log.LEVEL | DEBUG)
        ) &&

        Log.logger.log('INFO:', ...arguments);
    }

    static warn() {
        (
            Log.LEVEL === (Log.LEVEL | WARN)  ||
            Log.LEVEL === (Log.LEVEL | DEBUG)
        ) &&

        Log.logger.warn('WARN:', ...arguments);
    }

    static error() {
        (
            Log.LEVEL === (Log.LEVEL | ERROR)  ||
            Log.LEVEL === (Log.LEVEL | DEBUG)
        ) &&

        Log.logger.error('ERROR:', ...arguments);
    }
}

Log.LEVEL = (INFO | WARN | ERROR);

module.exports = Log;