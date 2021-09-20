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
const CREATE_INSTRUMENTED_ADAPTER = 'createInstrumentedAdapter';
const CREATE_SINGLE_INVOCATION_ADAPTER = 'createSingleInvocationAdapter';
const IMPERATIVE_ADAPTERS_ACCESSOR = 'imperativeAdapters';

const { RAML_ARTIFACTS } = require('./raml-artifacts');

/**
 * @param {string} artifactsDir
 * @param {AdapterInfo[]} generatedAdapterInfos
 * @param {AdapterInfo[]} imperativeAdapterInfos
 * @returns {void}
 */
function generateWireBindingsExport(artifactsDir, generatedAdapterInfos, imperativeAdapterInfos) {
    const adapterCode = {};

    generatedAdapterInfos.forEach(({ apiFamily, name, method, ttl }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterNameIdentifier = `${name}__adapterName`;
        const adapterMetadataIdentifier = `${name}Metadata`;
        let metadata;
        let bind;
        let imperative;

        if (method === 'get') {
            metadata =
                ttl !== undefined
                    ? `{ apiFamily: '${apiFamily}', name: '${adapterNameIdentifier}', ttl: ${ttl} }`
                    : `{ apiFamily: '${apiFamily}', name: '${adapterNameIdentifier}' }`;
            bind = `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(luvio, ${factoryIdentifier}, ${adapterMetadataIdentifier})`;
            imperative = `${name}: ${CREATE_SINGLE_INVOCATION_ADAPTER}(${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier}), ${adapterMetadataIdentifier})`;
        } else {
            bind = `${name}: ${CREATE_LDS_ADAPTER}(luvio, ${adapterNameIdentifier}, ${factoryIdentifier})`;
        }

        adapterCode[name] = {
            bind,
            imperative,
            metadata:
                metadata === undefined
                    ? undefined
                    : `const ${adapterMetadataIdentifier} = ${metadata}`,
            import: `import { ${factoryIdentifier}, adapterName as ${adapterNameIdentifier} } from '../adapters/${name}';`,
        };
    });

    imperativeAdapterInfos.forEach(({ apiFamily, name, method, ttl }) => {
        const factoryIdentifier = `${name}AdapterFactory`;
        const adapterMetadataIdentifier = `${name}Metadata`;
        let metadata;
        let bind;
        let imperative;

        if (method === 'get') {
            metadata =
                ttl !== undefined
                    ? `{ apiFamily: '${apiFamily}', name: '${name}', ttl: ${ttl} }`
                    : `{ apiFamily: '${apiFamily}', name: '${name}' }`;
            bind = `${name}: ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}(luvio, ${factoryIdentifier}, ${adapterMetadataIdentifier})`;
            imperative = `${name}: ${CREATE_SINGLE_INVOCATION_ADAPTER}(${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier}), ${adapterMetadataIdentifier})`;
        } else if (method === 'post' || method === 'patch') {
            bind = `${name}: unwrapSnapshotData(${factoryIdentifier})`;
        } else {
            bind = `${name}: ${CREATE_LDS_ADAPTER}(luvio, '${name}', ${factoryIdentifier})`;
        }

        adapterCode[name] = {
            bind,
            imperative,
            metadata:
                metadata === undefined
                    ? undefined
                    : `const ${adapterMetadataIdentifier} = ${metadata}`,
            import: `import { factory as ${factoryIdentifier} } from '../../wire/${name}';`,
        };
    });

    const adapterNames = Object.keys(adapterCode).sort();

    const code = dedent`
        import { Luvio, Snapshot } from '@luvio/engine';
        import { ${CREATE_WIRE_ADAPTER_CONSTRUCTOR_IDENTIFIER}, ${CREATE_LDS_ADAPTER}, ${CREATE_INSTRUMENTED_ADAPTER}, ${CREATE_SINGLE_INVOCATION_ADAPTER} } from '@salesforce/lds-bindings';
        import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

        ${adapterNames.map((name) => adapterCode[name].import).join('\n')}

        type AdapterFactoryish<DataType> = (luvio: Luvio) => (...config: unknown[]) => Promise<Snapshot<DataType>>;

        ${adapterNames.map((name) => 'let ' + name + ': any;').join('\n')}
        let ${IMPERATIVE_ADAPTERS_ACCESSOR} = {
            ${adapterNames
                .filter((name) => adapterCode[name].imperative !== undefined)
                .join(',\n            ')}
        };

        // Adapter Metadata
        ${adapterNames
            .filter((name) => adapterCode[name].metadata !== undefined)
            .map((name) => adapterCode[name].metadata)
            .join('\n')}

        function bindExportsTo(luvio: Luvio): { [key: string]: any } {
            function unwrapSnapshotData<DataType>(factory: AdapterFactoryish<DataType>) {
                const adapter = factory(luvio);
                return (...config: unknown[]) => (adapter(...config) as Promise<Snapshot<DataType>>).then(snapshot => snapshot.data);
            }

            return {
                ${adapterNames.map((name) => adapterCode[name].bind).join(',\n                ')},
                ${IMPERATIVE_ADAPTERS_ACCESSOR}: {
                    ${adapterNames
                        .filter((name) => adapterCode[name].imperative !== undefined)
                        .map((name) => adapterCode[name].imperative)
                        .join(',\n                    ')},
                }
            }
        }

        withDefaultLuvio((luvio: Luvio) => {
            ({
                ${adapterNames.join(',\n                ')},
                ${IMPERATIVE_ADAPTERS_ACCESSOR}
            } = bindExportsTo(luvio));
        });

        export { ${adapterNames.join(', ')}, ${IMPERATIVE_ADAPTERS_ACCESSOR} };
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
    validate: (modelInfo) => {
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
            .filter((resource) => resource.adapter !== undefined)
            .map((resource) => {
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
