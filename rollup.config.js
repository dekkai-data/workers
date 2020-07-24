'use strict';
const path = require('path');
const typescript = require('rollup-plugin-typescript2');
const sourceMaps = require('rollup-plugin-sourcemaps');
const globby = require('globby');
const server = require('live-server');

const buildDir = path.resolve(__dirname, 'dist');

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

function liveServer(options = {}) {
    const defaultParams = {
        file: 'index.html',
        host: '0.0.0.0',
        logLevel: 2,
        open: false,
        port: 8080,
        root: '.',
        wait: 200,
    };

    const params = Object.assign({}, defaultParams, options);

    server.start(params);
    return {
        name: 'liveServer',
        generateBundle() {
            console.log(`live-server running on ${params.port}`);
        }
    };
}

function generateClientConfig(startDevServer = false) {
    const input = {};
    globby.sync([
        path.join('src/', '/**/*.ts'),
        `!${path.join('src/', '/**/*.d.ts')}`,
        `!${path.join('src/', '/**/types.ts')}`,
    ]).forEach(file => {
        const parsed = path.parse(file);
        input[path.join(parsed.dir.substr('src/'.length), parsed.name)] = file;
    });

    const config = {
        input: input,
        treeshake: true,
        output: {
            dir: buildDir,
            format: 'esm',
            sourcemap: true,
            chunkFileNames: 'dependencies/[name].js',
        },
        plugins: [
            typescript({
                typescript: require('typescript'),
                cacheRoot: path.resolve(__dirname, '.rts2_cache'),
            }),
        ],
        watch: {
            clearScreen: false
        },
        external: [
            'worker_threads',
        ],
    };

    if (startDevServer) {
        config.plugins.push(sourceMaps());
        config.plugins.push(liveServer({
            port: 8090,
            host: '0.0.0.0',
            root: path.resolve(__dirname, 'src/static'),
            file: 'index.html',
            open: false,
            wait: 500,
            // proxy: [['/api', 'http://127.0.0.1:8080']], // not needed for now
            watch: [path.resolve(__dirname, 'dist/scripts')],
            mount: [
                ['/scripts', path.resolve(__dirname, 'dist/scripts')],
            ],
        }));
    }

    return config;
}

module.exports = function generator(args) {
    const config = [];
    config.push(generateClientConfig(args['config-dev-server']));

    return config;
};
