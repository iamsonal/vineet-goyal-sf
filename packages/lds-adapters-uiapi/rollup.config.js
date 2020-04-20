import path from 'path';
import fs from 'fs';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

const entry = path.join(__dirname, 'src', 'index.ts');
const dist = path.join(__dirname, 'dist');

const TYPESCRIPT_EXTENSION = '.ts';

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

function ldsOverrides({ generatedDir, overridesDir }) {
    const overridesDirAbsPath = path.resolve(overridesDir);
    if (fs.existsSync(overridesDirAbsPath) === false) {
        return;
    }
    const folders = fs.readdirSync(overridesDirAbsPath);

    const overrides = folders.reduce((seed, directoryName) => {
        const overrideFolder = `${overridesDir}/${directoryName}`;
        const generatedFolder = `${generatedDir}/${directoryName}`;
        const overrideItems = fs.readdirSync(path.resolve(overrideFolder));

        overrideItems.forEach(childFileName => {
            const generatedFilePath = path.resolve(
                `${generatedFolder}/${path.basename(childFileName, TYPESCRIPT_EXTENSION)}`
            );
            seed[generatedFilePath] = {
                generatedFilePath,
                manualFilePath: path.resolve(`${overrideFolder}/${childFileName}`),
            };
        });

        return seed;
    });

    return {
        resolveId(source, importer) {
            if (importer === undefined) {
                return null;
            }

            const absPath = path.resolve(path.dirname(importer), source);
            const override = overrides[absPath];
            if (override !== undefined) {
                if (importer === override.manualFilePath) {
                    return path.resolve(`${override.generatedFilePath}.ts`);
                }

                return override.manualFilePath;
            }
            return null;
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
                        generatedDir: './src/generated',
                        overridesDir: './src/overrides',
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
