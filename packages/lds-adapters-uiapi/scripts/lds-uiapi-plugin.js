/**
 * @typedef {import("@luvio/compiler").CompilerConfig} CompilerConfig
 * @typedef {import("@luvio/compiler").ModelInfo} ModelInfo
 * @typedef { { apiFamily: string, name: string, method: string, ttl?: number } } AdapterInfo
 */

const plugin = require('@salesforce/lds-compiler-plugins');
const offlineRecordPlugin = require('./lds-uiapi-offline-record-plugin');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const dedent = require('dedent');
const fieldsPlugin = require('./plugin/fields-support');

const SFDC_PRIVATE_ADAPTERS = require('./sfdc-private-adapters');

const ADAPTERS_NOT_DEFINED_IN_OVERLAY = [
    {
        apiFamily: 'UiApi',
        name: 'getListUi',
        method: 'get',
        ttl: 900000,
    },
];

const CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER = 'createWireAdapterConstructor';
const CREATE_LDS_ADAPTER = 'createLDSAdapter';

// TODO: scan raml-artifacts folder and generate this map
const RAML_ARTIFACTS = {
    '/adapters/getRecords': [
        'GetRecordsConfig',
        'getRecords_ConfigPropertyNames',
        'adapterFragment',
        'createResourceParams',
        'onResourceResponseSuccess',
        'typeCheckConfig',
    ],
    '/resources/getUiApiRecordDefaultsTemplateCloneByRecordId': ['select'],
    '/resources/getUiApiRecordsBatchByRecordIds': [
        'selectChildResourceParams',
        'ingestSuccessChildResourceParams',
    ],
    '/resources/getUiApiRecordsByRecordId': ['createResourceRequest'],
    '/types/RecordRepresentation': ['keyBuilderFromType', 'ingest'],
    '/types/RecordAvatarBulkMapRepresentation': ['ingest'],
    '/types/QuickActionDefaultsRepresentation': ['dynamicIngest'],
};

/**
 * @param {string} artifactsDir
 * @param {AdapterInfo[]} generatedAdapterInfos
 * @param {AdapterInfo[]} imperativeAdapterInfos
 * @returns {void}
 */
function generateWireBindingsExport(artifactsDir, generatedAdapterInfos, imperativeAdapterInfos) {
    const imports = [
        `import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}, ${CREATE_LDS_ADAPTER} } from '@salesforce/lds-bindings';`,
    ];

    const exports = [];

    generatedAdapterInfos.forEach(({ apiFamily, name, method, ttl }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterNameIdentifier = `${name}__adapterName`;
        imports.push(
            `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`
        );

        if (method === 'get') {
            if (ttl !== undefined) {
                exports.push(
                    `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(${factoryIdentifier}, {apiFamily: '${apiFamily}', name: ${adapterNameIdentifier}, ttl: ${ttl}});`
                );
            } else {
                exports.push(
                    `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(${factoryIdentifier}, {apiFamily: '${apiFamily}', name: ${adapterNameIdentifier}});`
                );
            }
            return;
        }

        exports.push(
            `export const ${name} = ${CREATE_LDS_ADAPTER}(${adapterNameIdentifier}, ${factoryIdentifier});`
        );
    });

    imports.push('');
    imperativeAdapterInfos.forEach(({ apiFamily, name, method, ttl }) => {
        const factoryIdentifier = `${name}AdapterFactory`;

        imports.push(`import { factory as ${factoryIdentifier} } from '../../wire/${name}';`);

        switch (method) {
            case 'get':
                if (ttl !== undefined) {
                    exports.push(
                        `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(${factoryIdentifier}, {apiFamily: '${apiFamily}', name: '${name}', ttl: ${ttl}});`
                    );
                } else {
                    exports.push(
                        `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(${factoryIdentifier}, {apiFamily: '${apiFamily}', name: '${name}'});`
                    );
                }
                break;
            case 'post':
            case 'patch':
                exports.push(dedent`
                        const _${name} = ${CREATE_LDS_ADAPTER}('${name}', ${factoryIdentifier});
                        export const ${name} = (...config: Parameters<ReturnType<typeof ${factoryIdentifier}>>) => {
                            return _${name}(...config).then(snapshot => snapshot.data);
                        };
                    `);
                break;
            default:
                exports.push(
                    `export const ${name} = ${CREATE_LDS_ADAPTER}('${name}', ${factoryIdentifier});`
                );
        }
    });

    const code = [imports.join('\n'), exports.join('\n')];

    fs.writeFileSync(path.join(artifactsDir, 'sfdc.ts'), code.join('\n\n'));
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
 * Utilizes the keyPrefix string to supply the API family for the adapters.
 * Stripping any non-word characters to be used by our instrumentation.
 * For example, `UiApi::` => `UiApi`.
 *
 * @param keyPrefix string used to supply the namespace of the adapters
 */
function buildApiFamilyFromKeyPrefix(keyPrefix) {
    return keyPrefix.replace(/\W+/, '');
}

module.exports = {
    validate: modelInfo => {
        fieldsPlugin.validate(modelInfo, (artifactSuffix, path, identifier, targetIdentifier) => {
            let entry = RAML_ARTIFACTS[artifactSuffix];
            if (entry === undefined) {
                entry = RAML_ARTIFACTS[artifactSuffix] = [];
            }
            entry.push({
                path,
                identifier,
                targetIdentifier,
            });
        });
        return plugin.validate(modelInfo);
    },
    /**
     * @param {CompilerConfig} compilerConfig
     * @param {ModelInfo} modelInfo
     * @returns {void}
     */
    afterGenerate: (compilerConfig, modelInfo, createGenerationContext) => {
        const apiFamily = buildApiFamilyFromKeyPrefix(modelInfo.keyPrefix);
        const adapters = modelInfo.resources
            .filter(resource => resource.adapter !== undefined)
            .map(resource => {
                const adapterInfo = {
                    apiFamily,
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

                return adapterInfo;
            });
        const imperativeAdapters = [...ADAPTERS_NOT_DEFINED_IN_OVERLAY];
        const generatedAdapters = [];

        adapters.forEach(adapter => {
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

        // right now LDS cli only supports one plugin, so invoke the offline record plugin from this one
        offlineRecordPlugin(compilerConfig, modelInfo);
        fieldsPlugin.afterGenerate(compilerConfig, modelInfo, createGenerationContext);
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
            const [, folder, file] = key.split('/');
            if (ramlId.endsWith(key)) {
                const artifacts = RAML_ARTIFACTS[key];
                const match = artifacts.find(item => {
                    if (typeof item === 'string') {
                        return item === identifier;
                    }
                    return item.identifier === identifier;
                });

                if (match !== undefined) {
                    if (typeof match === 'string') {
                        return {
                            identifier,
                            absolutePath: path.resolve(
                                path.join('src', 'raml-artifacts', folder, file, `${identifier}.ts`)
                            ),
                        };
                    }
                    return {
                        identifier: match.targetIdentifier,
                        absolutePath: match.path,
                    };
                }
            }
        }
    },
};
