import path from 'path';
import typescript from 'rollup-plugin-typescript2';

const entry = path.join(__dirname, 'src', 'index.ts');
const dist = path.join(__dirname, 'dist');

let format = undefined;
let target = undefined;
process.argv.forEach((val, index) => {
    if (val === '--configFormat') {
        format = process.argv[index + 1];
    }

    if (val === '--configTarget') {
        target = process.argv[index + 1];
    }
});

function rollupConfig(config) {
    const { format, target } = config;
    return {
        input: entry,
        output: {
            file: `${dist}/${format}/${target}/community-navigation-menu.js`,
            format,
            name: 'communityNavigationService',
        },
        plugins: [
            typescript({
                clean: true,
                tsconfigOverride: {
                    compilerOptions: {
                        target,
                    },
                },
            }),
        ],
    };
}

const buildFormats = [
    { format: 'es', target: 'es2018' },
    { format: 'cjs', target: 'es2018' },
    { format: 'umd', target: 'es2018' },

    { format: 'umd', target: 'es5' },
];

const buildTargets = buildFormats
    .filter(config => {
        if (format !== undefined) {
            return config.format === format;
        }
        return true;
    })
    .filter(config => {
        if (target !== undefined) {
            return config.target === target;
        }
        return true;
    })
    .map(config => rollupConfig(config));

export default buildTargets;
