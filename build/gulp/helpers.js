/**
 * Gulpfile helpers
 *
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
const gutil = require('gulp-util');
const chalk = require('chalk');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');

module.exports = {
    /**
     * Logs given error
     *
     * @param {*} err
     */
    error(err) {
        if (err.fileName) {
            // regular error
            gutil.log(chalk.red(err.name) +
                ': ' + chalk.yellow(err.fileName.replace(__dirname, '')) +
                ': Line ' + chalk.magenta(err.lineNumber) +
                ' &  Column ' + chalk.magenta(err.columnNumber || err.column) +
                ': ' + chalk.blue(err.description));
        }

        else {
            // browserify error..
            gutil.log(chalk.red(err.name) + ': ' + chalk.yellow(err.message));
        }
    },

    /**
     *
     * @param bundler
     * @param gulp
     * @returns {*}
     */
    bundle(bundler, gulp) {
        return bundler.bundle()
            .on('error', function() {
                module.exports.error(...arguments);
                this.end();
            })
            .pipe(source('index.js'))
            .pipe(buffer())
            .pipe(gulp.dest('dist'))
            .pipe(rename('index.min.js'))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('dist'));
    }
};
