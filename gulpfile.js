'use strict';

const gulp = require('gulp');
const connect = require('gulp-connect');
const babel = require('gulp-babel');
const watch = require('gulp-watch');
const autoprefixer = require('gulp-autoprefixer');
const stylus = require('gulp-stylus');
const nib = require('nib');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const minifyCss = require('gulp-minify-css');

const config = require('./package.json');

let handlers = {
    server() {
        connect.server({
            port: 8089
        });
    },

    babel() {
        gulp.src('./src/*.js')
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(gulp.dest('./dist'))
    },

    stylus() {
        gulp.src('./src/*.styl')
            .pipe(stylus({
                use: [nib()]
            }))
            .pipe(autoprefixer({
                browsers: ['last 2 versions']
            }))
            .pipe(gulp.dest('./dist'))
    },

    minJs() {
        gulp.src(`./dist/${config.name}.js`)
            .pipe(uglify())
            .pipe(rename(`${config.name}.min.js`))
            .pipe(gulp.dest('./dist'));
    },

    minCSS() {
        gulp.src(`./dist/${config.name}.css`)
            .pipe(minifyCss())
            .pipe(rename(`${config.name}.min.css`))
            .pipe(gulp.dest('./dist'));
    },

    build() {
        handlers.minJs();
        handlers.minCSS();
    },

    watch() {
        watch('./src/*.js', () => {
            handlers.babel();
        });

        watch('./src/*.styl', () => {
            handlers.stylus();
        });
    }
};

gulp
    .task('server', handlers.server)
    .task('babel', handlers.babel)
    .task('stylus', handlers.stylus)
    .task('build', handlers.build)
    .task('watch', handlers.watch)
    .task('default', ['server', 'watch', 'babel', 'stylus']);
