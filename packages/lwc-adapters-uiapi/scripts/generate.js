const dedent = require('dedent');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const ldsAdaptersJS = require.resolve('@salesforce/lds-adapters-uiapi');
const ldsArtifactsDir = path.join(ldsAdaptersJS, '../../../..', 'src', 'generated', 'artifacts');
const adapterInfoJSON = path.join(ldsArtifactsDir, 'adapter-info.json');
const adapterInfo = JSON.parse(fs.readFileSync(adapterInfoJSON));

const adapters = {};

[...adapterInfo.generated, ...adapterInfo.imperative].forEach(
    ({ _apiFamily, method, name, _ttl }) => {
        if (adapterInfo.private[name]) {
            return;
        }

        const factoryName = `${name}AdapterFactory`;
        const bind =
            `${name}: ` +
            (method === 'get'
                ? `createWireAdapterConstructor(factories.${factoryName}(luvio) as any, "${name}", luvio)`
                : method === 'post' || method === 'patch'
                ? `unwrapSnapshotData(factories.${factoryName})`
                : `factories.${factoryName}(luvio)`);
        adapters[name] = { bind };
    }
);

const adapterNames = Object.keys(adapters).sort();

const code = dedent`
    import { Luvio, Snapshot } from '@luvio/engine';
    import { createWireAdapterConstructor } from '@luvio/lwc-luvio';
    import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
    import * as factories from '@salesforce/lds-adapters-uiapi';

    type AdapterFactoryish<DataType> = (luvio: Luvio) => (...config: unknown[]) => Promise<Snapshot<DataType>>;

    ${adapterNames.map(name => 'let ' + name + ': any;').join('\n    ')}

    function bindExportsTo(luvio: Luvio): { [key: string]: any } {
        function unwrapSnapshotData<DataType>(factory: AdapterFactoryish<DataType>) {
            const adapter = factory(luvio);
            return (...config: unknown[]) => (adapter(...config) as Promise<Snapshot<DataType>>).then(snapshot => snapshot.data);
        }

        return {
            ${adapterNames.map(name => adapters[name].bind).join(',\n            ')}
        }
    }

    withDefaultLuvio((luvio: Luvio) => {
        ({
            ${adapterNames.join(',\n            ')}
        } = bindExportsTo(luvio));
    });

    export { ${adapterNames.join(', ')}};
`;

const artifactsDir = path.join('src', 'generated', 'artifacts');
mkdirp.sync(artifactsDir);
fs.writeFileSync(path.join(artifactsDir, 'bound-adapters.ts'), code);
