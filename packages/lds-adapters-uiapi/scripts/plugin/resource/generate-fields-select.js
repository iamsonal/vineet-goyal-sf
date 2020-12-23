const { SELECT_FIELDS } = require('../shape/generate-select-fields');

const RESOURCE_SELECT_FIELDS = 'selectFields';

function generateResourceFieldsSelect(resource, state) {
    const { returnShape } = resource;
    const { generationContext, importsMap, def } = state;
    const { importContext, deindent } = generationContext;
    const { namedImport, importRamlArtifact } = importContext;
    const { CREATE_TRIE_FROM_FIELDS, LUVIO_IMPORT } = importsMap;

    const { optionalFields: optionalFieldsDef, fields: fieldsDef } = def;
    const shapeDynamicSelect = namedImport(`../types/${returnShape.name}`, SELECT_FIELDS);
    const resourceParamsInterface = importRamlArtifact(resource.id, 'ResourceRequestConfig');
    const optionalFieldsStatement =
        optionalFieldsDef === null
            ? '[] as string[]'
            : `params.queryParams.${optionalFieldsDef.configName} || []`;
    const fieldsStatement =
        fieldsDef === null ? '[] as string[]' : `params.queryParams.${fieldsDef.configName} || []`;

    return deindent`
        export function ${RESOURCE_SELECT_FIELDS}(luvio: ${LUVIO_IMPORT}, params: ${resourceParamsInterface}) {
            const optionalFields = ${optionalFieldsStatement};
            const fields = ${fieldsStatement};
            const trie = ${CREATE_TRIE_FROM_FIELDS}(fields, optionalFields);
            return ${shapeDynamicSelect}(trie);
        }
    `;
}

module.exports = {
    generateResourceFieldsSelect,
    SELECT_FIELDS,
};
