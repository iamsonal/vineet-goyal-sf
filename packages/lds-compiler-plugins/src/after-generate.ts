import { CompilerConfig, ModelInfo } from '@luvio/compiler';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

type AdapterInfo = {
    name: string;
    method: string;
    refreshable: boolean;
    ttl?: number;
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
    const code: { imports: string[]; exports: string[] } = adapters.reduce(
        (seed: { imports: string[]; exports: string[] }, adapter: AdapterInfo) => {
            const { name, method, ttl } = adapter;
            const factoryIdentifier = `${name}AdapterFactory`;
            const adapterNameIdentifier = `${name}__adapterName`;

            seed.imports.push(
                `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`
            );

            if (method === 'get') {
                seed.exports.push(
                    `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}(${factoryIdentifier}, {name: ${adapterNameIdentifier}, ttl: ${ttl}});`
                );
            } else {
                seed.exports.push(
                    `export const ${name} = ${CREATE_LDS_ADAPTER}(${adapterNameIdentifier}, ${factoryIdentifier});`
                );
            }

            if (adapter.refreshable) {
                const notifyChangeNameIdentifier = `${name}NotifyChange`;
                const notifyChangeFactoryIdentifier = `${name}__notifyChangeFactory`;

                seed.imports.push(
                    `import { notifyChangeFactory as ${notifyChangeFactoryIdentifier} } from '../adapters/${name}';`
                );

                const notifyChangeExport = `export const ${notifyChangeNameIdentifier} = ${CREATE_LDS_ADAPTER}('${notifyChangeNameIdentifier}', ${notifyChangeFactoryIdentifier});`;
                seed.exports.push(notifyChangeExport);
            }

            return seed;
        },
        {
            imports: [],
            exports: [],
        }
    );

    const source = [
        `import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}, ${CREATE_LDS_ADAPTER} } from '${LDS_BINDINGS}';`,
        `${code.imports.join('\n')}`,
        `${code.exports.join('\n')}`,
    ].join('\n\n');

    fs.writeFileSync(path.join(outputDir, 'sfdc.ts'), source);
}

export function afterGenerate(config: CompilerConfig, modelInfo: ModelInfo) {
    const adapters = modelInfo.resources
        .filter(resource => resource.adapter !== undefined)
        .map(resource => {
            const adapterInfo = {
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
