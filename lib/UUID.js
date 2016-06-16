/**
 * Unified Unique ID Generator
 * Based on solution inspired by Jeff Ward and the comments to it:
 * @see http://stackoverflow.com/a/21963136/1511662
 */
let lookupTable = [];

for (let i = 0; i < 256; i++) {
    lookupTable[i] = (i < 16 ? '0' : '') + (i).toString(16);
}

let rand = typeof window !== 'undefined' && window.crypto ?
        window.crypto.getRandomValues : Math.random;

/**
 * Generates Unified Unique Identifier
 *
 * @returns {string}
 */
function uuid() {
    let d0 = rand() * 0x100000000 >>> 0;
    let d1 = rand() * 0x100000000 >>> 0;
    let d2 = rand() * 0x100000000 >>> 0;
    let d3 = rand() * 0x100000000 >>> 0;

    return lookupTable[d0 & 0xff] +
        lookupTable[d0 >> 8 & 0xff] +
        lookupTable[d0 >> 16 & 0xff] +
        lookupTable[d0 >> 24 & 0xff] +
        '-' +
        lookupTable[d1 & 0xff] +
        lookupTable[d1 >> 8 & 0xff] +
        '-' +
        lookupTable[d1 >> 16 & 0x0f | 0x40] +
        lookupTable[d1 >> 24 & 0xff] +
        '-' +
        lookupTable[d2 & 0x3f | 0x80] +
        lookupTable[d2 >> 8 & 0xff] +
        '-' +
        lookupTable[d2 >> 16 & 0xff] +
        lookupTable[d2 >> 24 & 0xff] +
        lookupTable[d3 & 0xff] +
        lookupTable[d3 >> 8 & 0xff] +
        lookupTable[d3 >> 16 & 0xff] +
        lookupTable[d3 >> 24 & 0xff];
}

/**
 * Generates and returns UUID
 *
 * @static
 * @returns {string}
 */
module.exports = uuid;
