/**
 * Generates and returns UUID
 *
 * @static
 * @returns {string}
 */
module.exports = () => {
    let d = new Date().getTime();

    if (typeof window !== 'undefined' &&
        window && window.performance &&
        typeof window.performance.now === 'function'
    ) {
        //use high-precision timer if available
        d += performance.now();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = (d + Math.random() * 16) % 16 | 0;

        d = Math.floor(d / 16);

        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};
