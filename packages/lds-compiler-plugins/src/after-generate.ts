import { CompilerConfig, ModelInfo } from '@luvio/compiler';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import dedent from 'dedent';

type AdapterInfo = {
    apiFamily: string;
    name: string;
    method: string;
    refreshable: boolean;
    ttl?: number;
};

type ProcessedAdapter = {
    bind: string;
    import: string;
};

const CREATE_WIRE_ADAPTER_CONSTRUCTOR = 'createWireAdapterConstructor';
const CREATE_LDS_ADAPTER = 'createLDSAdapter';
const LDS_BINDINGS = '@salesforce/lds-bindings';

// Adapter modules that need a nested .data included in the result when snapshots are
// unwrapped for imperative calls. This is a stopgap measure until W-9232436 is fully
// resolved.
const NESTED_DATA_ADAPTER_MODULES = [
    'lds-adapters-analytics-wave',
    'lds-adapters-cms-authoring',
    'lds-adapters-industries-rule-builder',
    'lds-adapters-platform-admin-success-guidance',
    'lds-adapters-platform-interaction-orchestrator',
    'lds-adapters-revenue-billing-batch',
];

function generateNpmModule(outputDir: string, adapters: AdapterInfo[]) {
    const code = adapters.map((adapter) => {
        const { name } = adapter;
        const factoryIdentifier = `${name}AdapterFactory`;

        return `export { ${factoryIdentifier} } from '../adapters/${name}';`;
    });

    const source = code.join('\n');

    fs.writeFileSync(path.join(outputDir, 'main.ts'), source);
}

function generateCoreAdapterModule(
    outputDir: string,
    adapters: AdapterInfo[],
    includeNestedData: boolean
) {
    const adapterCode = adapters.reduce((_adapterCode, adapter) => {
        const { apiFamily, name, method, ttl } = adapter;
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterNameIdentifier = `${name}__adapterName`;

        _adapterCode[name] = {
            bind:
                method === 'get'
                    ? `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}(luvio, ${factoryIdentifier}, {apiFamily: '${apiFamily}', name: ${adapterNameIdentifier}, ttl: ${ttl}}),`
                    : method === 'delete'
                    ? `${name}: ${CREATE_LDS_ADAPTER}(luvio, ${adapterNameIdentifier}, ${factoryIdentifier}),`
                    : `${name}: unwrapSnapshotData(${factoryIdentifier}),`,
            import: `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`,
        };

        if (adapter.refreshable) {
            const notifyChangeNameIdentifier = `${name}NotifyChange`;
            const notifyChangeFactoryIdentifier = `${name}__notifyChangeFactory`;

            _adapterCode[notifyChangeNameIdentifier] = {
                bind: `${notifyChangeNameIdentifier}: ${CREATE_LDS_ADAPTER}(luvio, '${notifyChangeNameIdentifier}', ${notifyChangeFactoryIdentifier}),`,
                import: `import { notifyChangeFactory as ${notifyChangeFactoryIdentifier} } from '../adapters/${name}';`,
            };
        }

        return _adapterCode;
    }, {} as { [key: string]: ProcessedAdapter });

    const adapterNames = Object.keys(adapterCode).sort();

    const unwrapper = includeNestedData
        ? // temporary hack for consumers that are still expecting a Snapshot; note that this
          // has the side effect of unfreezing the top level of data
          `return (config: Config) => (adapter(config) as Promise<Snapshot<DataType>>).then(snapshot => ({ ...snapshot.data, data: snapshot.data }));`
        : `return (config: Config) => (adapter(config) as Promise<Snapshot<DataType>>).then(snapshot => snapshot.data);`;

    const source = dedent`
        import { AdapterFactory, Luvio, Snapshot } from '@luvio/engine';
        import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}, ${CREATE_LDS_ADAPTER} } from '${LDS_BINDINGS}';
        import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
        ${adapterNames.map((name) => adapterCode[name].import).join('\n')}

        ${adapterNames.map((name) => 'let ' + name + ': any;').join('\n    ')}

        function bindExportsTo(luvio: Luvio): { [key: string]: any } {
            function unwrapSnapshotData<Config,DataType>(factory: AdapterFactory<Config,DataType>) {
                const adapter = factory(luvio);
                ${unwrapper}
            }

            return {
                ${adapterNames.map((name) => adapterCode[name].bind).join('\n')}
            };
        }

        withDefaultLuvio((luvio: Luvio) => {
            ({
                ${adapterNames.join(',\n        ')}
            } = bindExportsTo(luvio));
        });

        export { ${adapterNames.join(', ')} };
    `;

    fs.writeFileSync(path.join(outputDir, 'sfdc.ts'), source);
}

export function afterGenerate(config: CompilerConfig, modelInfo: ModelInfo) {
    const apiFamily = buildApiFamilyFromKeyPrefix(modelInfo.keyPrefix);
    const adapters = modelInfo.resources
        .filter((resource) => resource.adapter !== undefined)
        .map((resource) => {
            const adapterInfo = {
                apiFamily,
                name: resource.adapter!.name,
                // using (lds.method) annotation if defined
                method: resource.alternativeMethod || resource.method,
                refreshable: resource.refresheable === true && resource.returnShape !== undefined,
            } as AdapterInfo;

            const { returnShape } = resource;
            if (returnShape !== undefined) {
                const { id: returnShapeId } = returnShape;
                const shapeTtlValue = modelInfo.shapeTtls[returnShapeId];
                if (shapeTtlValue !== undefined) {
                    adapterInfo.ttl = shapeTtlValue;
                }
            }

            return adapterInfo;
        });

    const outputDur = path.join(config.outputDir, 'artifacts');
    mkdirp.sync(outputDur);

    generateCoreAdapterModule(
        outputDur,
        adapters,
        !!NESTED_DATA_ADAPTER_MODULES.find((mod) => outputDur.indexOf(mod) > -1)
    );
    generateNpmModule(outputDur, adapters);
}

/**
 * Utilizes the keyPrefix string to supply the API family for the adapters.
 * Stripping any non-word characters to be used by our instrumentation.
 * For example, `UiApi::` => `UiApi`.
 *
 * @param keyPrefix string used to supply the namespace of the adapters
 */
function buildApiFamilyFromKeyPrefix(keyPrefix: string): string {
    return keyPrefix.replace(/\W+/, '');
}
