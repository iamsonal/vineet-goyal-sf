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

function generateNpmModule(outputDir: string, adapters: AdapterInfo[]) {
    const code = adapters.map(adapter => {
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

        _adapterCode[name] = {
            bind:
                method === 'get'
                    ? `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}(luvio, ${factoryIdentifier}, {apiFamily: '${apiFamily}', name: ${adapterNameIdentifier}, ttl: ${ttl}}),`
                    : `${name}: ${CREATE_LDS_ADAPTER}(luvio, ${adapterNameIdentifier}, ${factoryIdentifier}),`,
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

    const source = dedent`
        import { Luvio } from '@luvio/engine';
        import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}, ${CREATE_LDS_ADAPTER} } from '${LDS_BINDINGS}';
        import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
        ${adapterNames.map(name => adapterCode[name].import).join('\n')}

        ${adapterNames.map(name => 'let ' + name + ': any;').join('\n    ')}

        function bindExportsTo(luvio: Luvio): { [key: string]: any } {
            return {
                ${adapterNames.map(name => adapterCode[name].bind).join('\n')}
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
        .filter(resource => resource.adapter !== undefined)
        .map(resource => {
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
