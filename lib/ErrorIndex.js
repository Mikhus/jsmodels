/**
 * @class ErrorIndex
 * @classdesc Builds user-friendly error index from a given errors
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
class ErrorIndex {

    /**
     * Constructor
     *
     * @param {object} errors
     * @access private
     */
    constructor(errors) {
        this.errors = errors;
        this.index = {};
        this.length = 0;

        this.build();

        Object.defineProperties(this, {
            index: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: this.index
            },
            length: {
                configurable: false,
                enumerable: true,
                writable: false,
                value: this.length
            },
            errors: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: errors
            }
        });
    }

    /**
     * Recursively builds error index
     *
     * @param {object} errors
     * @param {string} path
     */
    build(errors = this.errors, path = '') {
        this.index[path] = errors.direct;
        this.length += errors.direct.length;

        let props = Object.keys(errors.internal);

        for (let i = 0, s = props.length; i < s; i++) {
            let prop = props[i];

            this.build(errors.internal[prop], path + (path ? '.' : '') + prop);
        }
    }

    /**
     * Implementing iterator interface
     */
    *[Symbol.iterator]() {
        let properties = Object.keys(this.index);

        for (let property of properties) {
            if (this.index[property].length) {
                for (let error of this.index[property]) {
                    yield [property, error];
                }
            }
        }
    }

    /**
     * Returns all errors associated with given path
     *
     * @param {string} path
     * @returns {Array}
     */
    get(path) {
        return this.index[path];
    }

}

module.exports = ErrorIndex;
