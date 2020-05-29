import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

const { buildOverridesMap, resolveModulesWithOverrides } = require('./scripts/ldsModuleOverride');

const entry = path.join(__dirname, 'src', 'index.ts');
const dist = path.join(__dirname, 'dist');

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

function ldsOverrides({ generatedDir, overridesDir }) {
    const overrides = buildOverridesMap({ generatedDir, overridesDir });

    return {
        resolveId(source, importer) {
            return resolveModulesWithOverrides(source, importer, overrides);
        },
    };
}

export default function(args) {
    const { configTarget, configFormat } = args;

    return defaultConfigs
        .filter(config => configTarget === undefined || configTarget === config.target)
        .map(config => {
            const output = config.formats
                .filter(format => configFormat === undefined || configFormat === format)
                .map(format => ({
                    file: `${dist}/${format}/${config.target}/uiapi-records-service.js`,
                    format,
                    name: 'uiapiRecordsService',
                }));

            return {
                input: entry,
                output,
                plugins: [
                    ldsOverrides({
                        generatedDir: path.resolve(__dirname, './src/generated'),
                        overridesDir: path.resolve(__dirname, './src/overrides'),
                    }),
                    resolve(),
                    typescript({
                        clean: true,
                        tsconfigOverride: {
                            compilerOptions: {
                                target: config.target,
                            },
                        },
                    }),
                ],
            };
        });
}
