import { localConfiguration } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';

const entry = path.join(__dirname, 'src', 'main.ts');

const config = {
    cwd: __dirname,
    entry,
    fileName: 'graphql-service',
    bundleName: 'graphqlService',
};

export default args => {
    const localConfigurations = localConfiguration(args, config);

    return localConfigurations;
};
