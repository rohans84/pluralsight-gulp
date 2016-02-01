module.exports = function () {
    var client = './src/client/';
    var clientApp =  client + 'app/';
    var temp = './.tmp/';
    var server = './src/server';

    var config = {
        // all js to vet
        alljs : [
            './src/**/*.js',
            './*.js'
        ],
        client: client,
        css: temp + 'styles.css',
        index: client + 'index.html',
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        less: client + 'styles/styles.less',
        temp: temp,
        server: server,

        /**
         * browser sync
         */

        browserReloadDelay: 1000,

        /**
         * Bower and NPM Locations
         */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components',
            ignorePath: '../..'
        },

        /**
         * Node settings
         */
        defaultPort: 7203,
        nodeServer: './src/server/app.js'
    };

    config.getWireDepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };

        return options;

    };

    return config;
};
