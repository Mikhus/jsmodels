const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const KarmaServer = require('karma').Server;
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('utils-merge');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const chalk = require('chalk');
const gutil = require('gulp-util');

function error(err) {
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

    this.end();
}

function bundle(bundler) {
    return bundler.bundle()
        .on('error', error)
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(gulp.dest('dist'))
        .pipe(rename('index.min.js'))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

gulp.task('eslint', () =>
    gulp.src(['lib/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

gulp.task('pre:test', ['eslint'], () =>
    gulp.src(['lib/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
);

gulp.task('test:browser', (done) => {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('test', ['pre:test'], () =>
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

// TODO: fix problems with testing in browser
gulp.task('test:all', ['test', 'test:browser']);

gulp.task('build', () => {
    return bundle(
        browserify('./index.js', { debug: true })
            .transform(babelify, { presets: ["es2015"] })
    );
});
