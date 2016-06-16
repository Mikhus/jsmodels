/**
 * jsmodels Errors
 * Errors storage manipulation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */

/**
 * @class Errors
 * @classdesc Wrapping given errors data, providing simple interface to
 *            data access and manipulation
 */
class Errors {
    /**
     * @constructor
     * @param {object} data
     * @access public
     */
    constructor(data) {
        Object.defineProperty(this, 'data', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: data
        });
    }

    /**
     * Returns error structure for a given path
     *
     * @param {string} path
     * @returns {object}
     * @access public
     */
    get(path) {

    }

    /**
     * Returns error count. If a path argument specified, will return errors
     * count for a given path.
     *
     * @param {string} [path]
     * @returns {number}
     * @access public
     */
    count(path) {

    }

    *[Symbol.iterator]() {

    }

    keys() {

    }
}

module.exports = Errors;
