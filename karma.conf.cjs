module.exports = function(config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        basePath: '.',
        files: [
            {
                pattern: 'spec/browser/**/*.js',
                type: 'module',
            },
            {
                pattern: 'spec/base/**/*.js',
                type: 'module',
            },
            {
                pattern: 'spec/workers/**/*.worker.js',
                type: 'module',
            },
            {
                pattern: 'dist/**/*.js',
                type: 'module',
            },
        ],
        reporters: ['mocha'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless'],
        autoWatch: false,
        // singleRun: false, // Karma captures browsers, runs the tests and exits
        concurrency: Infinity
    })
}
