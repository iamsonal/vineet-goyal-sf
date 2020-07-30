import { CompilerConfig, ModelInfo } from '@ldsjs/compiler';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

type ADAPTER = Required<ModelInfo['resources'][0]>['adapter'];

const CREATE_WIRE_ADAPTER_CONSTRUCTOR = 'createWireAdapterConstructor';
const LDS_BINDINGS = '@salesforce/lds-bindings';

function generateNpmModule(outputDir: string, adapters: ADAPTER[]) {
    const code = adapters.map(adapter => {
        const { name } = adapter;
        const factoryIdentifier = `${name}AdapterFactory`;

        return `export { ${factoryIdentifier} } from '../adapters/${name}';`;
    });

    const source = code.join('\n');

    fs.writeFileSync(path.join(outputDir, 'main.ts'), source);
}

function generateCoreAdapterModule(outputDir: string, adapters: ADAPTER[]) {
    const code: { imports: string[]; exports: string[] } = adapters.reduce(
        (seed: { imports: string[]; exports: string[] }, adapter) => {
            const { name } = adapter;
            const factoryIdentifier = `${name}AdapterFactory`;
            const adapterNameIdentifier = `${name}__adapterName`;

            seed.imports.push(
                `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`
            );
            seed.exports.push(
                `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR}(${adapterNameIdentifier}, ${factoryIdentifier});`
            );
            return seed;
        },
        {
            imports: [],
            exports: [],
        }
    );

    const source = [
        `import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR} } from '${LDS_BINDINGS}';`,
        `${code.imports.join('\n')}`,
        `${code.exports.join('\n')}`,
    ].join('\n\n');

    fs.writeFileSync(path.join(outputDir, 'sfdc.ts'), source);
}

export function afterGenerate(config: CompilerConfig, modelInfo: ModelInfo) {
    const { resources } = modelInfo;

    const adapters = resources
        .filter(resource => resource.adapter !== undefined)
        .map(resource => {
            return resource.adapter!;
        });

    const outputDur = path.join(config.outputDir, 'artifacts');
    mkdirp.sync(outputDur);

    generateCoreAdapterModule(outputDur, adapters);
    generateNpmModule(outputDur, adapters);
}
