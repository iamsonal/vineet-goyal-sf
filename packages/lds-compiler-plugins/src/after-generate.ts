import { CompilerConfig, ModelInfo } from '@luvio/compiler';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

type AdapterInfo = {
    name: string;
    method: string;
    refreshable: boolean;
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
            const { name, method } = adapter;
            const factoryIdentifier = `${name}AdapterFactory`;
            const adapterNameIdentifier = `${name}__adapterName`;

            seed.imports.push(
                `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`
            );

            const adapterExport =
                method === 'get'
                    ? `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}(${adapterNameIdentifier}, ${factoryIdentifier});`
                    : `export const ${name} = ${CREATE_LDS_ADAPTER}(${adapterNameIdentifier}, ${factoryIdentifier});`;
            seed.exports.push(adapterExport);

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
            return {
                name: resource.adapter!.name,
                // using (lds.method) annotation if defined
                method: resource.alternativeMethod || resource.method,
                refreshable: resource.refresheable === true && resource.returnShape !== undefined,
            };
        });

    const outputDur = path.join(config.outputDir, 'artifacts');
    mkdirp.sync(outputDur);

    generateCoreAdapterModule(outputDur, adapters);
    generateNpmModule(outputDur, adapters);
}
