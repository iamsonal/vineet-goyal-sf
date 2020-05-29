const path = require('path');
const fs = require('fs');

/**
 * A map of generated modules that have override modules present
 * @typedef {{[generatedFilePath:string]: {generatedFilePath: string, manualFilePath: string}}} OverridesMap
 */

/**
 * Builds a map of any generated modules that have overrides present.
 *
 * Note: assumes .ts files
 *
 * @returns {OverridesMap}
 */
function buildOverridesMap({ generatedDir, overridesDir }) {
    const overridesDirAbsPath = path.resolve(overridesDir);
    if (fs.existsSync(overridesDirAbsPath) === false) {
        return {};
    }
    const folders = fs.readdirSync(overridesDirAbsPath);

    const overrides = folders.reduce((seed, directoryName) => {
        const overrideFolder = `${overridesDir}/${directoryName}`;
        const generatedFolder = `${generatedDir}/${directoryName}`;
        const overrideItems = fs.readdirSync(path.resolve(overrideFolder));

        overrideItems.forEach(childFileName => {
            const generatedFilePath = path.resolve(
                `${generatedFolder}/${path.basename(childFileName, '.ts')}`
            );
            seed[generatedFilePath] = {
                generatedFilePath,
                manualFilePath: path.resolve(`${overrideFolder}/${childFileName}`),
            };
        });

        return seed;
    }, {});

    return overrides;
}

/**
 * Resolves generated modules with their override module path (as an absolute
 * path). If the modulePath is not part of the overridesMap then returns null.
 *
 * Note: This function safely handles overridden modules attempting to import the
 * generated module (ie: an override module will not import itself but instead import
 * the generated module).
 *
 * Note: assumes .ts files
 *
 * @param {string} modulePath The module path. Ex: "../my/module"
 * @param {string} importer The file doing the importing
 * @param {OverridesMap} overridesMap
 * @returns {string | null}
 */
function resolveModulesWithOverrides(modulePath, importer, overridesMap) {
    if (importer === undefined) {
        return null;
    }

    const absPath = path.resolve(path.dirname(importer), modulePath);
    const override = overridesMap[absPath];
    if (override !== undefined) {
        if (importer === override.manualFilePath) {
            return path.resolve(`${override.generatedFilePath}.ts`);
        }

        return override.manualFilePath;
    }
    return null;
}

module.exports = {
    buildOverridesMap,
    resolveModulesWithOverrides,
};
