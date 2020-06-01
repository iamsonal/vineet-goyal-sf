import typescript from 'rollup-plugin-typescript2';

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

export function init(entry, dist) {
    return function(args) {
        const { configTarget, configFormat } = args;

        return defaultConfigs
            .filter(config => configTarget === undefined || configTarget === config.target)
            .map(config => {
                const output = config.formats
                    .filter(format => configFormat === undefined || configFormat === format)
                    .map(format => ({
                        file: `${dist}/${format}/${config.target}/adapters.js`,
                        format,
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
    };
}
