/**
 * jsmodels Log - logger module
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */

/**
 * Logging levels
 */
const DEBUG = 16;
const INFO = 8;
const WARN = 4;
const ERROR = 2;
const NONE = 0;

// let glob = typeof window !== 'undefined' ? window :
//     typeof global !== 'undefined' ? global : {
//         console: {
//             log() {},
//             warn() {},
//             error() {}
//         }
//     };

/**
 * Logger driver associated with this Log
 */
let logger = console;

/**
 * Constructs and returns prefix for given log level
 * taking into account actual logging options
 *
 * @param {string} level
 * @returns {string}
 */
function prefix(level) {
    level = '[' + level + ']';

    if (Log.showDateTime) {
        level += ' [' +
            new Date().toISOString().replace(/[TZ]/g, ' ').trim() +
        ']';
    }

    level += ':';

    return level;
}

/**
 * Generic logger.
 * It provides an ability to setup different logging levels.
 * it is available to use several different logging methods, like:
 *  - debug()
 *  - info()
 *  - warn()
 *  - error()
 *
 *  And depending on a Log.LEVEL value them will produce or
 *  produce not the output.
 *
 *  Log.LEVEL can be one of:
 *   - Log.DEBUG
 *   - Log.INFO
 *   - Log.WARN
 *   - Log.ERROR
 *   - Log.NONE
 *
 *  or their combination. There is no need to use combination with
 *  Log.DEBUG flag as if it is turned on it will automatically enable
 *  all ouptut.
 *
 *  As far as Log.NONE will supress all output.
 *  All other flags could be combined.
 *
 *  @example
 *  // preserve output for log() and error() only
 *  Log.LEVEL = (Log.INFO | Log.ERROR);
 *  // preserve output for warn() and error() only
 *  Log.LEVEL = (Log.WARN | Log.ERROR);
 *  // this is default settings
 *  Log.LEVEL = (Log.INFO | Log.WARN | Log.ERROR);
 *  // setting debug flag in combination has no meaning
 *  Log.LEVEL = (Log.INFO | Log.WARN | Log.ERROR | Log.DEBUG);
 *  // because it is equal to
 *  Log.LEVEL = log.DEBUG
 *  // but can be useful if you just want to turn it temporally
 *  Log.LEVEL = (Log.INFO | Log.WARN | Log.ERROR);// | Log.DEBUG);
 *
 * @class Log
 */
class Log {

    /**
     * Logging level DEBUG
     * When the level is set to DEBUG it will display all messages
     * triggered by debug(), log(), warn() and error() calls
     *
     * @property {number} DEBUG
     */
    static get DEBUG() { return DEBUG; }

    /**
     * Logging level INFO
     * When the level is set to INFO it will display messages
     * trigerred by log() calls only
     *
     * @property {number} INFO
     */
    static get INFO() { return INFO; }

    /**
     * Logging level WARN
     * When the level is set to WARN it will display messages
     * triggered by warn() calls only
     *
     * @property {number} WARN
     */
    static get WARN() { return WARN; }

    /**
     * Logging level ERROR
     * When the level is set to ERROR it will display messages
     * triggered by warn() calls only
     *
     * @property {number} ERROR
     */
    static get ERROR() { return ERROR; }

    /**
     * Logging level NONE
     *
     * @property {number} NONE
     */
    static get NONE() { return NONE; }

    /**
     * Returns logger driver, for now it is standard console
     *
     * @returns {object}
     */
    static get logger() {
        return logger;
    }

    /**
     * Configures actual logger driver
     *
     * @param {object} driver
     */
    static set logger(driver) {
        if (!driver || ['log', 'warn', 'error'].some(func =>
            typeof driver[func] !== 'function')
        ) {
            throw new TypeError('Given logger is invalid!');
        }

        logger = driver;
    }

    /**
     * Use it whenever it is required to output debugging symbols.
     * It simply stringify and output given arguments
     */
    static debug() {
        if (Log.LEVEL !== (Log.LEVEL | DEBUG)) {
            return ;
        }

        if (Log.prefixed) {
            return Log.logger.log(prefix('DEBUG'), ...arguments);
        }

        Log.logger.log(...arguments);
    }

    /**
     * Use it whenever it is required to output information symbols.
     * It simply stringify and output given arguments
     */
    static log() {
        if (!(
            Log.LEVEL === (Log.LEVEL | INFO) ||
            Log.LEVEL === (Log.LEVEL | DEBUG)
        )) {
            return;
        }

        if (Log.prefixed) {
            return Log.logger.log(prefix('INFO'), ...arguments);
        }

        Log.logger.log(...arguments);
    }

    /**
     * Use it whenever it is required to output warning-level symbols.
     * It simply stringify and output given arguments
     */
    static warn() {
        if (!(
            Log.LEVEL === (Log.LEVEL | WARN)  ||
            Log.LEVEL === (Log.LEVEL | DEBUG)
        ))  {
            return ;
        }

        if (Log.prefixed) {
            return Log.logger.warn(prefix('WARN'), ...arguments);
        }

        Log.logger.warn(...arguments);
    }

    /**
     * Use it whenever it is required to output error-level symbols.
     * It simply stringify and output given arguments
     */
    static error() {
        if (!(
            Log.LEVEL === (Log.LEVEL | ERROR)  ||
            Log.LEVEL === (Log.LEVEL | DEBUG)
        )) {
            return ;
        }

        if (Log.prefixed) {
            return Log.logger.error(prefix('ERROR'), ...arguments);
        }

        Log.logger.error(...arguments);
    }
}

/**
 * Current actual log level
 *
 * @type {number}
 */
Log.LEVEL = (INFO | WARN | ERROR);

/**
 * When it is true will prefix output symbols with the proper prefix
 *
 * @type {boolean}
 */
Log.prefixed = true;

/**
 * When it is true will prefix output symbols with date-time string
 *
 * @type {boolean}
 */
Log.showDateTime = true;

module.exports = Log;
