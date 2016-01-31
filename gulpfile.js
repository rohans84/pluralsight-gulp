/**
 * Created by rns.mac on 1/14/16.
 */
var gulp = require('gulp');
var args = require('yargs').argv;
var $ = require('gulp-load-plugins')({lazy: true});
var config = require('./gulp.config')();
var del = require('del');
var port = process.env.PORT || config.defaultPort;

gulp.task('vet', function () {
    log('Analyzing source with jshint and jscs');
    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print() ))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('styles', ['clean-styles'], function () {
    log('Compiling less --> css');
    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.temp));
});

gulp.task('clean-styles', function(done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
});

gulp.task('less-watcher', function () {
    gulp.watch([config.less], ['styles']);
});

gulp.task('wiredep', function () {
    log('wire up bower js css and our app js into html');
    var options = config.getWireDepDefaultOptions();
    var wiredep = require('wiredep').stream;
    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles'], function () {
    log('wire up app css into html and call wirdep');

    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function() {
    var isDev = true;
    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            'PORT' : port,
            'NODE_ENV': isDev ? 'dev' : 'build'
        },
        watch: [config.server]  // TODO define the files to restart on
    };
    return $.nodemon(nodeOptions)
        .on('restart', ['vet'], function(ev) {
            log('*** Nodemon restarted');
            log('files changed on restart:\n' + ev);
        })
        .on('start', function() {
            log('*** Nodemon started');
        })
        .on('crash', function() {
            log('*** Nodemon crashed due to some reason');
        })
        .on('exit', function() {
            log('*** Nodemon exited cleanly');
        });

});

function clean(path, done) {
    log('Cleaning '  + $.util.colors.red(path));
    del(path);
    done();
}



function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.log($.util.colors.red(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.red(msg));
    }
}
