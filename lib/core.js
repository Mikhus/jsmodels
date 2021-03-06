/**
 * Returns true if a given type is a primitive type, false otherwise
 *
 * @param {string} type
 * @returns {boolean}
 * @access public
 */
function isPrimitive(type) {
    return !(type === 'object' || type === 'array' || type === 'function');
}

/**
 * Checks if a given n is a numeric value
 *
 * @param {*} n
 * @returns {boolean}
 * @access public
 */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Checks if a given object is completely plain empty JavaScript object
 *
 * @param {object} obj
 * @returns {boolean}
 * @access public
 */
function isEmptyObject(obj) {
    return obj === Object ||
        (isPlainObject(obj) && Object.keys(obj).length === 0);
}

/**
 * Checks if a given value is JavaScript object
 *
 * @param {*} obj
 * @returns {boolean}
 * @access public
 */
function isPlainObject(obj) {
    return !!(typeof obj === 'object' && obj && obj.constructor === Object);
}

/**
 * Checks if a given object has given property.
 * Property could be a deep path.
 *
 * @param {*} obj
 * @param {string} path
 * @returns {boolean}
 * @access public
 */
function hasProperty(obj, path) {
    if (typeof obj === 'undefined') {
        return false;
    }

    if (path in obj) {
        return true;
    }
    
    let props = (path + '').split('.');

    for (let i = 0, s = props.length; i < s; i++) {
        let prop = props[i];

        if (!(prop in obj)) {
            return false;
        }

        obj = obj[prop];
    }

    return true;
}

/**
 * Look-ups for a proper vendor-specific property and returns its value
 *
 * @example
 * var requestAnimationFrame = vendorize('requestAnimationFrame');
 * // it will refer properly to:
 * //  - window.requestAnimationFrame by default or to
 * //  - window.webkitRequestAnimationFrame or to
 * //  - window.mozRequestAnimationFrame or to
 * //  - window.msRequestAnimationFrame or to
 * //  - window.oRequestAnimationFrame
 * // depending on the current browser vendor
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 * @param {string} prop
 * @param {HTMLElement|Window|object} [from] - default is window
 * @returns {*}
 */
function vendorize(prop, from) {
    /* istanbul ignore else: no reason to cover */
    if (!from) {
        from = typeof window === 'undefined' ? global : window;
    }

    if (typeof from[prop] !== 'undefined') {
        return from[prop];
    }

    let vendors = ['webkit', 'moz', 'ms', 'o'];
    let i = 0;
    let s = vendors.length;
    let capitalized = prop.charAt(0).toUpperCase() + prop.substr(1);

    for (; i < s; i++) {
        let vendorProp = from[vendors[i] + capitalized];

        /* istanbul ignore if: requires very complex environment to test (specific browser version) */
        if (typeof vendorProp !== 'undefined') {
            return vendorProp;
        }
    }

    return null;
}

module.exports = {
    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,
    isNumeric: isNumeric,
    isPrimitive: isPrimitive,
    hasProperty: hasProperty,
    vendorize: vendorize
};
