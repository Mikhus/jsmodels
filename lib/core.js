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
 * Generates and returns incremental numeric key for the given object
 * properties
 *
 * @param {object} obj
 * @returns {number}
 * @access public
 */
function nextKey(obj) {
    let keys = Object.keys(obj);
    let numbers = [];

    for (let i = 0, s = keys.length; i < s; i++) {
        let key = keys[i];

        if (!isNumeric(key)) {
            continue;
        }

        key = parseFloat(key);

        if (!Number.isInteger(key)) {
            continue;
        }

        numbers.push(key);
    }

    let next =  Math.max.apply(null, numbers);

    return isNaN(next) || !isFinite(next) ? 0 : ++next;
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

module.exports = {
    nextKey: nextKey,
    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,
    isNumeric: isNumeric,
    isPrimitive: isPrimitive,
    hasProperty: hasProperty
};
