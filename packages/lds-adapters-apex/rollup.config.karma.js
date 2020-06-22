import path from 'path';
import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs(
        { adapterModuleName: 'lds-adapters-apex' },
        { entryFile: path.join(__dirname, 'karma', 'lds-adapters-apex.js') }
    ),
    ...adapterTestUtilConfigs({ testUtilName: 'apex-test-util' }),
];
