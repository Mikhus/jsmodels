const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');

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

gulp.task('test', ['pre:test'], () =>
    gulp.src(['test/**/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .pipe(istanbul.enforceThresholds({
            thresholds: {
                global: {
                    statements: 100,
                    branches: 90,
                    functions: 80,
                    lines: 100
                },
                each: {
                    statements: 100,
                    branches: 90,
                    functions: 80,
                    lines: 100
                }
            }
        }))
);
