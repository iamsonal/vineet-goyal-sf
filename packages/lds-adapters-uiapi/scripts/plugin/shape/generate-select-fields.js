const SELECT_FIELDS = 'selectFields';

function generateShapeFieldsSelect(shape, state) {
    const { generationContext, importsMap } = state;
    const { importContext, deindent } = generationContext;
    const { namedImport, importRamlArtifact } = importContext;

    const { RECORD_FIELD_TRIE, FRAGMENT_IMPORT, CREATE_FIELDS_SELECTION } = importsMap;
    const dynamicSelectImport = importRamlArtifact(shape.id, 'dynamicSelect');
    const statements = shape.properties
        .filter((prop) => {
            return prop.containsFields === true || prop.isFieldsProperty === true;
        })
        .map((prop) => {
            const { shapeName, name: propName } = prop;
            if (prop.containsFields === true) {
                const childSelectFieldsImport = namedImport(`./${shapeName}`, SELECT_FIELDS);
                return deindent`
                ${propName}: {
                    kind: 'Link',
                    name: '${propName}',
                    fragment: ${childSelectFieldsImport}(fields),
                }
            `;
            }

            return deindent`
            ${propName}: ${CREATE_FIELDS_SELECTION}('${propName}', fields)
        `;
        });

    return deindent`
        export function ${SELECT_FIELDS}(fields: ${RECORD_FIELD_TRIE}): ${FRAGMENT_IMPORT} {
            return ${dynamicSelectImport}({
                ${statements.join(',\n')}
            })
        }
    `;
}

module.exports = {
    generateShapeFieldsSelect,
    SELECT_FIELDS,
};
