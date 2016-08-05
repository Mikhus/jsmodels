/**
 * This file simply contains missing type definitions for some 3d-party modules.
 * This is required for some IDEs like WebStorm to suppress 'method or property
 * not found' warnings.
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */

/**
 * @typedef {{
 *   black:chalk,
 *   red: chalk,
 *   green: chalk,
 *   white: chalk,
 *   yellow: chalk,
 *   magenta: chalk,
 *   blue: chalk,
 *   grey: chalk,
 *   gray: chalk,
 *   cyan: chalk,
 *
 *   bgBlack: chalk,
 *   bgRed: chalk,
 *   bgGreen: chalk,
 *   bgYellow: chalk,
 *   bgBlue: chalk,
 *   bgMagenta: chalk,
 *   bgCyan: chalk,
 *   bgWhite: chalk,
 *
 *   reset: chalk,
 *   bold: chalk,
 *   dim: chalk,
 *   italic: chalk,
 *   underline: chalk,
 *   inverse: chalk,
 *   hidden: chalk,
 *   strikethrough: chalk
 * }} Chalk
 * @typedef {Chalk|function} chalk
 */

/**
 * @typedef {{
 *   task: function,
 *   watch: function,
 *   src: function,
 *   dest: function
 * }} Gulp
 * @typedef {Gulp} gulp
 */

/**
 * @typedef {{ failAfterError: function }} eslint
 */
