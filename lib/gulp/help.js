/**
 * Implements self-documented gulp-file
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const fs = require('fs');
const chalk = require('chalk');

let reflection = {};
let gulpfile = 'gulpfile.js';

// terminal printing config
const LINE_MAXLEN = 80;
const KEYS_MAXLEN = 20;
const PADDING = 4;

/**
 * Analyzes given gulp instance and build internal cache
 * for further printing
 *
 * @param {Gulp} gulp
 * @access private
 */
function build(gulp) {
    let source = fs.readFileSync('./' + gulpfile).toString();
    let rxDoc = '\\/\\*\\*\\r?\n(((?!\\*\\/)[\\s\\S])*?)' +
        '@task\\s+\\{(.*)?\\}((?!\\*\\/)[\\s\\S])*?\\*\\/';
    let rxArgs = '@arg\\s+\\{(.*?)\\}(.*?)\\r?\\n';
    let globalRxDoc = new RegExp(rxDoc, 'g');
    let localRxDoc = new RegExp(rxDoc);
    let globalRxArgs = new RegExp(rxArgs, 'g');
    let localRxArgs = new RegExp(rxArgs);
    let jsDoc  = source.match(globalRxDoc);

    Object.keys(gulp.tasks).forEach(task => {
        reflection[task] = {
            name: gulp.tasks[task].name,
            desc: '',
            dep: gulp.tasks[task].dep
        };
    });

    jsDoc.map(block => {
        let parts = block.match(localRxDoc);

        let name  = parts[3].trim();
        let desc = parts[1].replace(/\s*\*/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        if (!reflection[name]) {
            return;
        }

        reflection[name].desc = desc;
        reflection[name].public = true;
        reflection[name].args = (block.match(globalRxArgs) || []).map(def => {
            let argsParts = def.match(localRxArgs);

            return {
                name: argsParts[1],
                desc: argsParts[2].replace(/\s*\*/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .trim()
            };
        });
    });
}

/**
 * Chunks given string into pieces making each chunk less or equal to
 * LINE_MAXLEN, taking into account safe word-break
 *
 * @param {string} str
 * @param {number} maxLen
 * @returns {Array}
 * @access private
 */
function chunk(str, maxLen) {
    let len  = maxLen || LINE_MAXLEN;
    let curr = len;
    let prev = 0;
    let out  = [];

    while (str[curr]) {
        if (str[curr++] == ' ') {
            out.push(str.substring(prev, curr));
            prev = curr;
            curr += len;
        }
    }

    out.push(str.substr(prev));

    return out;
}

/**
 * Performs usage strings output
 *
 * @access private
 */
function print() {
    console.log(chalk.bold('Usage: gulp [task] [options]'));
    console.log(chalk.bold('Tasks:'));

    Object.keys(reflection).filter(name => {
        return reflection[name].public;
    })
        .sort()
        .forEach(name => {
            let task = reflection[name];
            let deps = task.dep.filter(dep => {
                return reflection[dep] && reflection[dep].public;
            });
            let text = ' '.repeat(PADDING) +
                chalk.bold.green(task.name) +
                ' '.repeat(KEYS_MAXLEN - PADDING - task.name.length);
            let chunks = chunk(task.desc, LINE_MAXLEN - KEYS_MAXLEN);
            let i = 0;

            console.log(text + chalk.bold(chunks[i]));

            if (chunks.length > 1) {
                while (chunks.length > ++i) {
                    (chunks[i].trim()) && (console.log(
                        ' '.repeat(KEYS_MAXLEN) +
                        chalk.bold(chunks[i])
                    ));
                }
            }

            task.args.forEach(arg => {
                let chunks = arg.desc ?
                    chunk(arg.desc, LINE_MAXLEN - KEYS_MAXLEN) :
                    ['[boolean]'];
                let i = 0;

                console.log(
                    ' '.repeat(PADDING + 1) +
                    chalk.bold.cyan('--' + arg.name) +
                    ' '.repeat(KEYS_MAXLEN - PADDING - arg.name.length - 3) +
                    chunks[i]
                );

                while (chunks.length > ++i) {
                    (chunks[i].trim()) && (console.log(
                        ' '.repeat(KEYS_MAXLEN) +
                        chunks[i]
                    ));
                }
            });

            (deps.length) && (console.log(
                ' '.repeat(KEYS_MAXLEN) +
                chalk.bold.gray('Depends: ') +
                chalk.grey(JSON.stringify(deps))
            ));

            console.log('');
        });
}


/**
 * Prints usage help information for the given gulp
 * instance.
 * Usually it is used as a task within gulpfile.js in your project
 * Please, make sure all your comments are properly annotated
 *
 * @example
 * <caption>Typical usage:</caption>
 *  const gulp = require('gulp');
 *
 *  gulp.task('help', => require('./path/to/gulp-help')(gulp));
 *
 * @param {Gulp} gulp - gulp instance to analyze
 * @returns {Promise}
 * @access public
 */
function usage(gulp) {
    return new Promise(resolve => {
        build(gulp);
        print();
        resolve();
    });
}

module.exports = usage;
