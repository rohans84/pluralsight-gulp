/**
 * Created by rns.mac on 1/14/16.
 */
var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var $ = require('gulp-load-plugins')({lazy: true});
var config = require('./gulp.config')();
var del = require('del');
var port = process.env.PORT || config.defaultPort;

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

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

gulp.task('fonts',['clean-fonts'], function() {
    log('copying fonts');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts/'));
});

gulp.task('images',['clean-images'], function() {
    log('copying and compressing the images');

    return gulp
        .src(config.images)
        .pipe($.imagemin({optimizationLevel:4}))
        .pipe(gulp.dest(config.build + 'images/'));
});

gulp.task('clean', function(done) {
    var delconfig = [].concat(config.build, config.temp);
    log('cleaning: ' + $.util.colors.green(delconfig));
    del(delconfig, done);
});

gulp.task('clean-fonts', function(done) {
    clean(config.build + 'fonts/**/*.*', done);
});

gulp.task('clean-images', function(done) {
    clean(config.build + 'images/**/*.*', done);
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
            setTimeout(function () {
                browserSync.notify("reloading now...");
                browserSync.reload({stream: false});
            }, config.browserReloadDelay);
        })
        .on('start', function() {
            log('*** Nodemon started');
            startBrowserSync();
        })
        .on('crash', function() {
            log('*** Nodemon crashed due to some reason');
        })
        .on('exit', function() {
            log('*** Nodemon exited cleanly');
        });

});


///////////////////

function changeEvent(event) {
    //var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    //log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
    log('File ' + event.path + ' ' + event.type);
}

function startBrowserSync() {
    if(args.nosync || browserSync.active) {
        return;
    }

    log('starting browser sync on port ' + port);

    gulp.watch([config.less], ['styles'])
        .on('change', function (event) {
            changeEvent(event);
        });

    var options =  {
        proxy: 'localhost:' + port,
        port: 9000,
        files: [
            config.client + '**/*.*',   // all js, html and css under /src/client folder
            '!' + config.less,          // ignore the less folder
            config.temp + '**/*.*'      // basically css under /temp folder
        ],

        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };
    browserSync(options);
}

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
