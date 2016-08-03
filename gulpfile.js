const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const KarmaServer = require('karma').Server;
const browserify = require('browserify');
const babelify = require('babelify');
const help = require('gulp-help-doc');

const helpers = require('./lib/gulp/helpers');

/**
 * Displays usage information for this gulpfile
 */
gulp.task('help', () => help(gulp));

/**
 * Performs linting checks on a project's JavaScript code
 *
 * @task {eslint}
 */
gulp.task('eslint', () =>
    gulp.src(['lib/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

/**
 * Initializes test coverage utility
 *
 * @task {pre:test}
 */
gulp.task('pre:test', ['eslint'], () =>
    gulp.src(['lib/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
);

/**
 * Runs tests in browser environment
 *
 * @task {test:browser}
 */
gulp.task('test:browser', (done) => {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

/**
 * Runs tests in NodeJS environment
 *
 * @task {test:node}
 */
gulp.task('test:node', ['pre:test'], () =>
    gulp.src(['test/specs/**/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .pipe(istanbul.enforceThresholds({
            thresholds: {
                global: {
                    statements: 80,
                    branches: 80,
                    functions: 80,
                    lines: 80
                }/*,
                each: {
                    statements: 80,
                    branches: 80,
                    functions: 80,
                    lines: 80
                }*/
            }
        }))
);

/**
 * Runs tests in NodeJS and browser at-once
 *
 * @task {test:all}
 */
gulp.task('test:all', ['test:node', 'test:browser']);

/**
 * Runs JS code bundling build for browser use
 *
 * @task {build}
 */
gulp.task('build', () => {
    return helpers.bundle(
        browserify('./index.js', { debug: true })
            .transform(babelify, { presets: ["es2015"] }),
        gulp
    );
});

gulp.task('default', ['help']);
