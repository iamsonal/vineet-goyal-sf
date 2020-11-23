/**
 * @typedef {import("@luvio/compiler").CompilerConfig} CompilerConfig
 * @typedef {import("@luvio/compiler").ModelInfo} ModelInfo
 * @typedef { { name: string, method: string } } AdapterInfo
 */

const plugin = require('@salesforce/lds-compiler-plugins');
const offlineRecordPlugin = require('./lds-uiapi-offline-record-plugin');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const dedent = require('dedent');

const SFDC_PRIVATE_ADAPTERS = require('./sfdc-private-adapters');

const ADAPTERS_NOT_DEFINED_IN_OVERLAY = [
    {
        name: 'getListUi',
        method: 'get',
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
    '/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName': ['select'],
    '/resources/getUiApiRecordsBatchByRecordIds': [
        'selectChildResourceParams',
        'ingestSuccessChildResourceParams',
    ],
    '/resources/getUiApiRecordsByRecordId': ['createResourceRequest'],
    '/types/FieldValueRepresentation': ['ingest'],
    '/types/RecordRepresentation': ['keyBuilderFromType', 'ingest'],
    '/types/RecordAvatarBulkMapRepresentation': ['ingest'],
};
const ramlArtifactsKeys = Object.keys(RAML_ARTIFACTS);

/**
 * @param {string} artifactsDir
 * @param {AdapterInfo[]} generatedAdapterNames
 * @param {AdapterInfo[]} imperativeAdapterNames
 * @returns {void}
 */
function generateWireBindingsExport(artifactsDir, generatedAdapterNames, imperativeAdapterNames) {
    const imports = [
        `import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}, ${CREATE_LDS_ADAPTER} } from '@salesforce/lds-bindings';`,
    ];

    const exports = [];

    generatedAdapterNames.forEach(({ name, method }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterNameIdentifier = `${name}__adapterName`;
        imports.push(
            `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`
        );

        if (method === 'get') {
            exports.push(
                `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(${adapterNameIdentifier}, ${factoryIdentifier});`
            );
            return;
        }

        exports.push(
            `export const ${name} = ${CREATE_LDS_ADAPTER}(${adapterNameIdentifier}, ${factoryIdentifier});`
        );
    });

    imports.push('');
    imperativeAdapterNames.forEach(({ name, method }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        imports.push(`import { factory as ${factoryIdentifier} } from '../../wire/${name}';`);

        switch (method) {
            case 'get':
                exports.push(
                    `export const ${name} = ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}('${name}', ${factoryIdentifier});`
                );
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
 * @param {AdapterInfo[]} generatedAdapterNames
 * @param {AdapterInfo[]} imperativeAdapterNames
 * @returns {void}
 */
function generateAdapterFactoryExport(artifactsDir, generatedAdapterNames, imperativeAdapterNames) {
    const exports = [];

    generatedAdapterNames.forEach(({ name }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        exports.push(`export { ${factoryIdentifier} } from '../adapters/${name}';`);
    });

    exports.push('');
    imperativeAdapterNames.forEach(({ name }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        exports.push(`export { factory as ${factoryIdentifier} } from '../../wire/${name}';`);
    });

    fs.writeFileSync(path.join(artifactsDir, 'main.ts'), exports.join('\n'));
}

module.exports = {
    validate: plugin.validate,
    /**
     * @param {CompilerConfig} compilerConfig
     * @param {ModelInfo} modelInfo
     * @returns {void}
     */
    afterGenerate: (compilerConfig, modelInfo) => {
        const adapters = modelInfo.resources
            .filter(resource => resource.adapter !== undefined)
            .map(resource => {
                return {
                    name: resource.adapter.name,
                    // using (lds.method) annotation if defined
                    method: resource.alternativeMethod || resource.method,
                };
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
    },
    /**
     * @param {string} ramlId
     * @param {string} identifier
     * @returns {void | ResolveRamlArtifactResult}
     */
    resolveRamlArtifact: (ramlId, identifier) => {
        for (let i = 0, len = ramlArtifactsKeys.length; i < len; i += 1) {
            const key = ramlArtifactsKeys[i];
            const [, folder, file] = key.split('/');
            if (ramlId.endsWith(key)) {
                const artifacts = RAML_ARTIFACTS[key];
                if (artifacts.indexOf(identifier) > -1) {
                    return {
                        identifier,
                        absolutePath: path.resolve(
                            path.join('src', 'raml-artifacts', folder, file, `${identifier}.ts`)
                        ),
                    };
                }
            }
        }
    },
};
