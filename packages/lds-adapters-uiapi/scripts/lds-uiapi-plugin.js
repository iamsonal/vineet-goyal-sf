/**
 * @typedef {import("@luvio/compiler").CompilerConfig} CompilerConfig
 * @typedef {import("@luvio/compiler").ModelInfo} ModelInfo
 * @typedef { { apiFamily: string, name: string, method: string, ttl?: number } } AdapterInfo
 */

const plugin = require('@salesforce/lds-compiler-plugins');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const dedent = require('dedent');
const fieldsPlugin = require('./plugin/fields-support');
const recordCollectionPlugin = require('./plugin/record-collection-plugin');

const SFDC_PRIVATE_ADAPTERS = require('./sfdc-private-adapters');

const { RAML_ARTIFACTS } = require('./raml-artifacts');

const ADAPTERS_NOT_DEFINED_IN_OVERLAY = [
    {
        name: 'getListUi',
        method: 'get',
        ttl: 900000,
    },
];

const CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER = 'createWireAdapterConstructor';
const CREATE_LDS_ADAPTER = 'createLDSAdapter';
const CREATE_INSTRUMENTED_ADAPTER = 'createInstrumentedAdapter';
const CREATE_IMPERATIVE_ADAPTER = 'createImperativeAdapter';
const API_FAMILY_IDENTIFIER = 'apiFamily';

/**
 * @param {string} artifactsDir
 * @param {AdapterInfo[]} generatedAdapterInfos
 * @param {AdapterInfo[]} imperativeAdapterInfos
 * @returns {void}
 */
function generateWireBindingsExport(artifactsDir, generatedAdapterInfos, imperativeAdapterInfos) {
    const adapterCode = {};

    generatedAdapterInfos.forEach(({ name, method, ttl }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterNameIdentifier = `${name}__adapterName`;
        const adapterMetadataIdentifier = `${name}Metadata`;
        const ldsAdapterIdentifier = `${name}_ldsAdapter`;
        const imperativeAdapterNameIdentifier = `${name}_imperative`;
        let metadata;
        let bind;
        let imperativeGetBind;
        let ldsAdapter;

        if (method === 'get') {
            const metadataInfo = [
                `${API_FAMILY_IDENTIFIER}`,
                `name: ${adapterNameIdentifier}`,
                ttl !== undefined && `ttl: ${ttl}`,
            ].filter(Boolean);
            metadata = `const ${adapterMetadataIdentifier} = { ${metadataInfo.join(', ')} };`;

            ldsAdapter = `const ${ldsAdapterIdentifier} = ${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier})`;
            bind = `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(luvio, ${CREATE_INSTRUMENTED_ADAPTER}(${ldsAdapterIdentifier}, ${adapterMetadataIdentifier}), ${adapterMetadataIdentifier})`;
            imperativeGetBind = `${imperativeAdapterNameIdentifier}: ${CREATE_IMPERATIVE_ADAPTER}(luvio, ${ldsAdapterIdentifier}, ${adapterMetadataIdentifier})`;
        } else {
            bind = `${name}: ${CREATE_LDS_ADAPTER}(luvio, ${adapterNameIdentifier}, ${factoryIdentifier})`;
        }

        adapterCode[name] = {
            ldsAdapter,
            bind,
            imperativeGetBind,
            metadata,
            import: `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`,
        };
    });

    imperativeAdapterInfos.forEach(({ name, method, ttl }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterMetadataIdentifier = `${name}Metadata`;
        const ldsAdapterIdentifier = `${name}_ldsAdapter`;
        const imperativeAdapterNameIdentifier = `${name}_imperative`;
        let metadata;
        let bind;
        let imperativeGetBind;
        let ldsAdapter;

        if (method === 'get') {
            const metadataInfo = [
                `${API_FAMILY_IDENTIFIER}`,
                `name: '${name}'`,
                ttl !== undefined && `ttl: ${ttl}`,
            ].filter(Boolean);
            metadata = `const ${adapterMetadataIdentifier} = { ${metadataInfo.join(', ')} };`;

            ldsAdapter = `const ${ldsAdapterIdentifier} = ${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier})`;
            bind = `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(luvio, ${CREATE_INSTRUMENTED_ADAPTER}(${ldsAdapterIdentifier}, ${adapterMetadataIdentifier}), ${adapterMetadataIdentifier})`;
            imperativeGetBind = `${imperativeAdapterNameIdentifier}: ${CREATE_IMPERATIVE_ADAPTER}(luvio, ${ldsAdapterIdentifier}, ${adapterMetadataIdentifier})`;
        } else if (method === 'post' || method === 'patch') {
            bind = `${name}: unwrapSnapshotData(${factoryIdentifier})`;
        } else {
            bind = `${name}: ${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier})`;
        }

        adapterCode[name] = {
            ldsAdapter,
            bind,
            imperativeGetBind,
            metadata,
            import: `import { factory as ${factoryIdentifier} } from '../../wire/${name}';`,
        };
    });

    const adapterNames = Object.keys(adapterCode).sort();
    const imperativeGetAdapterNames = adapterNames
        .filter((name) => adapterCode[name].imperativeGetBind !== undefined)
        .map((name) => `${name}_imperative`);

    const code = dedent`
        import { Luvio, Snapshot } from '@luvio/engine';
        import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}, ${CREATE_LDS_ADAPTER}, ${CREATE_INSTRUMENTED_ADAPTER}, ${CREATE_IMPERATIVE_ADAPTER} } from '@salesforce/lds-bindings';
        import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

        import { keyPrefix as ${API_FAMILY_IDENTIFIER} } from '../adapters/adapter-utils';

        ${adapterNames.map((name) => adapterCode[name].import).join('\n')}

        type AdapterFactoryish<DataType> = (luvio: Luvio) => (...config: unknown[]) => Promise<Snapshot<DataType>>;

        ${adapterNames.map((name) => 'let ' + name + ': any;').join('\n')}

        // Imperative GET Adapters
        ${adapterNames
            .filter((name) => adapterCode[name].imperativeGetBind !== undefined)
            .map((name) => `let ${name}_imperative`)
            .join(';\n        ')};

        // Adapter Metadata
        ${adapterNames
            .filter((name) => adapterCode[name].metadata !== undefined)
            .map((name) => adapterCode[name].metadata)
            .join('\n')}

        function bindExportsTo(luvio: Luvio): { [key: string]: any } {
            // LDS adapters
            ${adapterNames
                .filter((name) => adapterCode[name].ldsAdapter !== undefined)
                .map((name) => adapterCode[name].ldsAdapter)
                .join(';\n            ')};

            function unwrapSnapshotData<DataType>(factory: AdapterFactoryish<DataType>) {
                const adapter = factory(luvio);
                return (...config: unknown[]) => (adapter(...config) as Promise<Snapshot<DataType>>).then(snapshot => snapshot.data);
            }

            return {
                // Wire Adapters
                ${adapterNames.map((name) => adapterCode[name].bind).join(',\n                ')},

                // Imperative Adapters
                ${adapterNames
                    .filter((name) => adapterCode[name].imperativeGetBind !== undefined)
                    .map((name) => adapterCode[name].imperativeGetBind)
                    .join(',\n                ')},
            }
        }

        withDefaultLuvio((luvio: Luvio) => {
            ({
                ${adapterNames.join(',\n                ')},
                ${imperativeGetAdapterNames.join(',\n                ')},

            } = bindExportsTo(luvio));
        });

        export { ${adapterNames.join(', ')}, ${imperativeGetAdapterNames.join(', ')} };
        `;

    fs.writeFileSync(path.join(artifactsDir, 'sfdc.ts'), code);
}

/**
 * @param {string} artifactsDir
 * @param {AdapterInfo[]} generatedAdapterInfos
 * @param {AdapterInfo[]} imperativeAdapterInfos
 * @returns {void}
 */
function generateAdapterFactoryExport(artifactsDir, generatedAdapterInfos, imperativeAdapterInfos) {
    const exports = [];

    generatedAdapterInfos.forEach(({ name }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        exports.push(`export { ${factoryIdentifier} } from '../adapters/${name}';`);
    });

    exports.push('');
    imperativeAdapterInfos.forEach(({ name }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        exports.push(`export { factory as ${factoryIdentifier} } from '../../wire/${name}';`);
    });

    fs.writeFileSync(path.join(artifactsDir, 'main.ts'), exports.join('\n'));
}

/**
 * @param {string} artifactsDir
 * @param {AdapterInfo[]} generatedAdapterInfos
 * @param {AdapterInfo[]} imperativeAdapterInfos
 * @returns {void}
 */
function generateAdapterInfoExport(artifactsDir, generatedAdapterInfos, imperativeAdapterInfos) {
    fs.writeFileSync(
        path.join(artifactsDir, 'adapter-info.json'),
        JSON.stringify(
            {
                generated: generatedAdapterInfos,
                imperative: imperativeAdapterInfos,
                private: SFDC_PRIVATE_ADAPTERS,
            },
            null,
            2
        )
    );
}

function addImportOverride(artifactSuffix, path, identifier, targetIdentifier) {
    let entry = RAML_ARTIFACTS[artifactSuffix];
    if (entry === undefined) {
        entry = RAML_ARTIFACTS[artifactSuffix] = [];
    }
    entry.push({
        path,
        identifier,
        targetIdentifier,
    });
}

module.exports = {
    validate: (modelInfo) => {
        fieldsPlugin.validate(modelInfo, addImportOverride);
        recordCollectionPlugin.validate(modelInfo, addImportOverride);
        return plugin.validate(modelInfo);
    },
    /**
     * @param {CompilerConfig} compilerConfig
     * @param {ModelInfo} modelInfo
     * @returns {void}
     */
    afterGenerate: (compilerConfig, modelInfo, createGenerationContext) => {
        // compositeResources map => Record<childEndpointId, resourceEndpointId>
        const compositeChildToResourceEndpointIdMap = {};
        // resources map => Record<resourceEndpointId, adapterName>
        const resourceEndpointIdToNameMap = {};

        Object.entries(modelInfo.compositeResources).forEach(([resourceKey, value]) => {
            compositeChildToResourceEndpointIdMap[value.childEndpoint.id] = resourceKey;
        });

        modelInfo.resources.forEach((resource) => {
            resourceEndpointIdToNameMap[resource.endPointId] =
                resource.adapter && resource.adapter.name;
        });

        const adapters = modelInfo.resources
            .filter((resource) => resource.adapter !== undefined)
            .map((resource) => {
                const adapterInfo = {
                    name: resource.adapter.name,
                    // using (luvio.method) annotation if defined
                    method: resource.alternativeMethod || resource.method,
                };

                const { returnShape } = resource;
                if (returnShape !== undefined) {
                    const { id: returnShapeId } = returnShape;
                    const shapeTtlValue = modelInfo.shapeTtls[returnShapeId];
                    if (shapeTtlValue !== undefined) {
                        adapterInfo.ttl = shapeTtlValue;
                    }
                }
                // batch adapter info
                const batchResourceEndpointId = compositeChildToResourceEndpointIdMap[resource.id];
                if (batchResourceEndpointId !== undefined) {
                    adapterInfo.batch = resourceEndpointIdToNameMap[batchResourceEndpointId];
                }
                return adapterInfo;
            });
        const imperativeAdapters = [...ADAPTERS_NOT_DEFINED_IN_OVERLAY];
        const generatedAdapters = [];

        adapters.forEach((adapter) => {
            const { name } = adapter;
            const fullPath = path.resolve(path.join('src', 'wire', name, 'index.ts'));
            if (fs.existsSync(fullPath)) {
                imperativeAdapters.push(adapter);
                return;
            }
            generatedAdapters.push(adapter);
        });

        const artifactsDir = path.join(compilerConfig.outputDir, 'artifacts');
        mkdirp.sync(artifactsDir);
        generateAdapterFactoryExport(artifactsDir, generatedAdapters, imperativeAdapters);
        generateWireBindingsExport(
            artifactsDir,
            generatedAdapters.filter(({ name }) => !SFDC_PRIVATE_ADAPTERS[name]),
            imperativeAdapters.filter(({ name }) => !SFDC_PRIVATE_ADAPTERS[name])
        );
        generateAdapterInfoExport(artifactsDir, generatedAdapters, imperativeAdapters);

        fieldsPlugin.afterGenerate(compilerConfig, modelInfo, createGenerationContext);
        recordCollectionPlugin.afterGenerate(compilerConfig, modelInfo, createGenerationContext);
    },
    /**
     * @param {string} ramlId
     * @param {string} identifier
     * @returns {void | ResolveRamlArtifactResult}
     */
    resolveRamlArtifact: (ramlId, identifier) => {
        const ramlArtifactsKeys = Object.keys(RAML_ARTIFACTS);
        for (let i = 0, len = ramlArtifactsKeys.length; i < len; i += 1) {
            const key = ramlArtifactsKeys[i];
            if (ramlId.endsWith(key)) {
                const artifacts = RAML_ARTIFACTS[key];
                const match = artifacts.find((artifact) => {
                    return artifact.identifier === identifier;
                });
                if (match !== undefined) {
                    if (match.targetIdentifier !== undefined) {
                        return {
                            identifier: match.targetIdentifier,
                            absolutePath: match.path,
                        };
                    }
                    return {
                        identifier: match.identifier,
                        absolutePath: path.resolve(match.path),
                    };
                }
            }
        }
    },
};
