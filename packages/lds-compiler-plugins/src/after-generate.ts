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
    metadata?: unknown;
    ldsAdapter?: unknown;
    imperativeGetBind?: unknown;
    bind: string;
    import: string;
};

const CREATE_WIRE_ADAPTER_CONSTRUCTOR = 'createWireAdapterConstructor';
const CREATE_INSTRUMENTED_ADAPTER = 'createInstrumentedAdapter';
const CREATE_LDS_ADAPTER = 'createLDSAdapter';
const CREATE_IMPERATIVE_ADAPTER = 'createImperativeAdapter';
const LDS_BINDINGS = '@salesforce/lds-bindings';

function generateNpmModule(outputDir: string, adapters: AdapterInfo[]) {
    const code = adapters.map((adapter) => {
        const { name } = adapter;
        const factoryIdentifier = `${name}AdapterFactory`;

        return `export { ${factoryIdentifier} } from '../adapters/${name}';`;
    });

    const source = code.join('\n');

    fs.writeFileSync(path.join(outputDir, 'main.ts'), source);
}

function generateCoreAdapterModule(outputDir: string, adapters: AdapterInfo[]) {
    const adapterCode = adapters.reduce((_adapterCode, adapter) => {
        const { apiFamily, name, method, ttl } = adapter;
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterNameIdentifier = `${name}__adapterName`;
        const adapterMetadataIdentifier = `${name}Metadata`;
        const ldsAdapterIdentifier = `${name}_ldsAdapter`;
        const imperativeAdapterNameIdentifier = `${name}_imperative`;
        let bind;
        let imperativeGetBind;
        let ldsAdapter;

        const metadata =
            ttl === undefined
                ? `{ apiFamily: '${apiFamily}', name: '${name}' }`
                : `{ apiFamily: '${apiFamily}', name: '${name}', ttl: ${ttl} }`;

        if (method === 'get') {
            ldsAdapter = `const ${ldsAdapterIdentifier} = ${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier})`;
            bind = `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}(luvio, ${CREATE_INSTRUMENTED_ADAPTER}(${ldsAdapterIdentifier}, ${adapterMetadataIdentifier}), ${adapterMetadataIdentifier})`;
            imperativeGetBind = `${imperativeAdapterNameIdentifier}: ${CREATE_IMPERATIVE_ADAPTER}(luvio, ${ldsAdapterIdentifier}, ${adapterMetadataIdentifier})`;
        } else if (method === 'delete') {
            bind = `${name}: ${CREATE_LDS_ADAPTER}(luvio, ${adapterNameIdentifier}, ${factoryIdentifier})`;
        } else {
            bind = `${name}: unwrapSnapshotData(${factoryIdentifier})`;
        }

        _adapterCode[name] = {
            metadata: `const ${adapterMetadataIdentifier} = ${metadata};`,
            bind,
            ldsAdapter,
            imperativeGetBind,
            import: `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`,
        };

        if (adapter.refreshable) {
            const notifyChangeNameIdentifier = `${name}NotifyChange`;
            const notifyChangeFactoryIdentifier = `${name}__notifyChangeFactory`;

            _adapterCode[notifyChangeNameIdentifier] = {
                bind: `${notifyChangeNameIdentifier}: ${CREATE_LDS_ADAPTER}(luvio, '${notifyChangeNameIdentifier}', ${notifyChangeFactoryIdentifier})`,
                import: `import { notifyChangeFactory as ${notifyChangeFactoryIdentifier} } from '../adapters/${name}';`,
            };
        }

        return _adapterCode;
    }, {} as { [key: string]: ProcessedAdapter });

    const adapterNames = Object.keys(adapterCode).sort();
    const imperativeGetAdapterNames = adapterNames
        .filter((name) => adapterCode[name].imperativeGetBind !== undefined)
        .map((name) => `${name}_imperative`);

    const source = dedent`
        import { AdapterFactory, Luvio, Snapshot } from '@luvio/engine';
        import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}, ${CREATE_INSTRUMENTED_ADAPTER}, ${CREATE_LDS_ADAPTER}, ${CREATE_IMPERATIVE_ADAPTER} } from '${LDS_BINDINGS}';
        import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
        ${adapterNames.map((name) => adapterCode[name].import).join('\n')}

        ${adapterNames.map((name) => 'let ' + name + ': any;').join('\n    ')}

        // Imperative GET Adapters
        ${imperativeGetAdapterNames.map((name) => `let ${name}`).join('\n    ')}

        // Adapter Metadata
        ${adapterNames
            .filter((name) => adapterCode[name].metadata !== undefined)
            .map((name) => `${adapterCode[name].metadata}`)
            .join('\n    ')}

        function bindExportsTo(luvio: Luvio): { [key: string]: any } {
            // LDS Adapters
            ${adapterNames
                .filter((name) => adapterCode[name].ldsAdapter !== undefined)
                .map((name) => adapterCode[name].ldsAdapter)
                .join(';\n            ')};

            function unwrapSnapshotData<Config,DataType>(factory: AdapterFactory<Config,DataType>) {
                const adapter = factory(luvio);
                return (config: Config) => (adapter(config) as Promise<Snapshot<DataType>>).then(snapshot => snapshot.data);
            }

            return {
                ${adapterNames.map((name) => adapterCode[name].bind).join(',\n                ')},
                // Imperative GET Adapters
                ${adapterNames
                    .filter((name) => adapterCode[name].imperativeGetBind !== undefined)
                    .map((name) => adapterCode[name].imperativeGetBind)
                    .join(',\n                ')}
            };
        }

        withDefaultLuvio((luvio: Luvio) => {
            ({
                ${adapterNames.join(',\n        ')},
                ${imperativeGetAdapterNames.join(',\n                ')}
            } = bindExportsTo(luvio));
        });

        export { ${adapterNames.join(', ')}, ${imperativeGetAdapterNames.join(', ')} };
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

    generateCoreAdapterModule(outputDur, adapters);
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
