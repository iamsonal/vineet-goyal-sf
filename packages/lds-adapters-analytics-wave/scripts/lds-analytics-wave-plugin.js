/**
 * Luvio compiler plugin to handle injecting partial custom adapter raml artifacts
 *
 * @typedef { { identifier: string, absolutePath: string } } ResolveRamlArtifactResult
 */

const path = require('path');
const basePlugin = require('../../lds-compiler-plugins');

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: build support for raml-artifacts/ partial overrides into the base plugin

// the custom adapter partial files
const RAML_ARTIFACTS = {
    '/adapters/getDataset': [
        'buildInMemorySnapshot',
        'onResourceResponseSuccess',
        'onResourceResponseError',
    ],
    '/adapters/deleteDataset': ['buildNetworkSnapshot'],
};

// extend the basePlugin to add the logic for the partial raml artifacts
module.exports = Object.assign({}, basePlugin, {
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
                const match = artifacts.find((item) => item === identifier);

                if (match) {
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
});
