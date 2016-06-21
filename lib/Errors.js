/**
 * jsmodels Errors
 * Errors storage manipulation
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */

function buildCache(errors) {
    if (errors.indexCache) {
        return ;
    }

    errors.indexCache = {};

    // console.log(errors.data);
}

/**
 * @class Errors
 * @classdesc Wrapping given errors data, providing simple interface to
 *            data access and manipulation
 */
class Errors {
    /**
     * @constructor
     * @access public
     */
    constructor() {
        Object.defineProperty(this, 'data', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: {}
        });

        Object.defineProperty(this, 'indexCache', {
            configurable: false,
            enumerable: true,
            writable: true,
            value: null
        });
    }

    /**
     * Returns error structure for a given path
     *
     * @param {string} [path]
     * @returns {object}
     * @access public
     */
    get(path) {
        buildCache(this);

        if (!path) {

        }
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
}

module.exports = Errors;
