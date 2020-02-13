import path from 'path';
import typescript from 'rollup-plugin-typescript2';

const entry = path.join(__dirname, 'src', 'index.ts');
const dist = path.join(__dirname, 'dist');

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

export default function(args) {
    const { configTarget, configFormat } = args;

    return defaultConfigs
        .filter(config => configTarget === undefined || configTarget === config.target)
        .map(config => {
            const output = config.formats
                .filter(format => configFormat === undefined || configFormat === format)
                .map(format => ({
                    file: `${dist}/${format}/${config.target}/apex-service.js`,
                    format,
                    name: 'apexService',
                }));

            return {
                input: entry,
                output,
                plugins: [
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
