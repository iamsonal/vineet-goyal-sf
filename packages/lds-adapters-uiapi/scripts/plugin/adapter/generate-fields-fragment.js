const { adapterConfigInterfaceName } = require('./util');

function generateFieldsAdapterFragment(adapter, resource, def, state) {
    const { generationContext, importsMap } = state;
    const { deindent, importContext } = generationContext;
    const { importRamlArtifact, namedImport } = importContext;

    const { LUVIO_IMPORT, FRAGMENT_IMPORT } = importsMap;

    const adapterConfigImport = importRamlArtifact(adapter.id, adapterConfigInterfaceName(adapter));
    const resourceParams = importRamlArtifact(adapter.id, 'createResourceParams');
    const resourceFieldsSelect = namedImport(`../resources/${resource.name}`, 'selectFields');
    return deindent`
      export function adapterFragment(luvio: ${LUVIO_IMPORT}, config: ${adapterConfigImport}): ${FRAGMENT_IMPORT} {
        const resourceParams = ${resourceParams}(config);
        return ${resourceFieldsSelect}(luvio, resourceParams);
      }
  `;
}

module.exports = {
    generateFieldsAdapterFragment,
};
