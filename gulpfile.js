var gulp = require('gulp');

// minify changed images
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
// minify html
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
// minify js
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var minify = require('gulp-minify');
// minify css
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
// sass
var sass = require('gulp-sass');

// var server = '/var/www/html';
var server = '/Library/WebServer/Documents';

gulp.task('imagemin', function () {
    
    gulp.src('./public_html/images/**/*')
            .pipe(changed(server+'/images'))
            .pipe(imagemin())
            .pipe(gulp.dest(server+'/images'));
    
}).task('htmlpage', function () {

    gulp.src('./public_html/index.html')
            .pipe(htmlmin({removeComments: true,collapseBooleanAttributes: true,removeAttributeQuotes: true,removeRedundantAttributes: true,removeEmptyAttributes: true}))
            .pipe(gulp.dest(server));
/*
    // Use this instead of the above in offline dev mode
    gulp.src('./public_html/local_index.html')
            .pipe(rename('index.html'))
            .pipe(htmlmin({removeComments: true, collapseBooleanAttributes: true, removeAttributeQuotes: true, removeRedundantAttributes: true, removeEmptyAttributes: true}))
            .pipe(gulp.dest(server));
*/    
    gulp.src('./public_html/pages/*.html')
            .pipe(htmlmin({removeComments: true, collapseWhitespace: true, collapseBooleanAttributes: true, removeAttributeQuotes: true, removeRedundantAttributes: true, removeEmptyAttributes: true}))
            .pipe(gulp.dest(server+'/pages'));
  
}).task('scripts', function () {

    gulp.src(['./public_html/js/app.js', './public_html/js/config.js', './public_html/js/index.js', './public_html/js/*.js'])
            .pipe(concat('flightclub.js'))
            .pipe(stripDebug())
            .pipe(minify({ext:{src:'.js', min:'.min.js'},mangle: false}))
            .pipe(gulp.dest(server+'/js'));

}).task('styles', function () {

    gulp.src(['./public_html/sass/*.scss'])
            .pipe(concat('flightclub.min.css'))
            .pipe(sass({ outputStyle: 'compressed' }))
            .pipe(gulp.dest(server+'/css'));
    
}).task('static_scripts', function () {
    /*
     * concatenate local angular/flot/cesium source files for offline dev. Should be a once off...
     */
    gulp.src(['./public_html/angular-1.5.8/angular.min.js', './public_html/angular-1.5.8/*.js'])
            .pipe(concat('angular-1.5.8.js'))
            .pipe(stripDebug())
            .pipe(minify({ext:{src:'.js', min:'.min.js'},mangle: false}))
            .pipe(gulp.dest(server+'/angular-1.5.8'));

    gulp.src('./public_html/angular-material-1.1.1/*.js').pipe(gulp.dest(server+'/angular-material'));
    gulp.src('./public_html/flot/*.js').pipe(gulp.dest(server+'/flot'));

}).task('static_styles', function () {
    /*
     * copy local angular/cesium css source files to server for offline dev. Should be a once off...
     */
    gulp.src('./public_html/cesium/*.css').pipe(gulp.dest(server+'/cesium'));
    gulp.src('./public_html/angular-material-1.1.1/*.css').pipe(gulp.dest(server+'/angular-material'));

}).task("default", ["imagemin", "htmlpage", "scripts", "styles", "static_scripts", "static_styles"], function () {

    gulp.watch('./public_html/images/**/*', ["imagemin"]);
    gulp.watch('./public_html/**/*.html', ["htmlpage"]);
    gulp.watch('./public_html/js/*.js', ["scripts"]);
    gulp.watch('./public_html/sass/*.scss', ["styles"]);
    gulp.watch(['./public_html/angular-1.5.8/angular.min.js', './public_html/angular-1.5.8/*.js', './public_html/angular-material-1.1.1/*.js', './public_html/jquery-3.1.1/*.js', './public_html/flot/*.js'], ["static_scripts"]);
    gulp.watch(['./public_html/cesium/*.css', './public_html/angular-material-1.1.1/*.css'], ["static_styles"]);

});
