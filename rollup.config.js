'use strict';
const path = require('path');
const typescript = require('rollup-plugin-typescript2');
const sourceMaps = require('rollup-plugin-sourcemaps');
const globby = require('globby');

const buildDir = path.resolve(__dirname, 'dist');

function generateClientConfig() {
    const input = {};
    globby.sync([
        path.join('src/', '/**/*.ts'),
        `!${path.join('src/', '/**/*.d.ts')}`,
        `!${path.join('src/', '/**/types.ts')}`,
    ]).forEach(file => {
        const parsed = path.parse(file);
        input[path.join(parsed.dir.substr('src/'.length), parsed.name)] = file;
    });

    return {
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
}

module.exports = function generator() {
    const config = [];
    config.push(generateClientConfig());

    return config;
};
