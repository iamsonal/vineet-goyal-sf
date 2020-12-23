function generateNodeShapeFieldsIngest(shape, state) {
    const { generationContext, importsMap } = state;
    const { importContext, deindent } = generationContext;
    const { importRamlArtifact, namedImport } = importContext;
    const { CREATE_FIELDS_INGESTION } = importsMap;
    const { properties } = shape;

    const code = properties.map(property => {
        const {
            isFieldsProperty,
            containsFields,
            name: propertyName,
            shapeName: propertyShapeName,
            shapeId: propertyShapeId,
        } = property;
        // This is the fields property, call fields ingestion
        if (isFieldsProperty === true) {
            return `${propertyName}: ${CREATE_FIELDS_INGESTION}(fields, optionalFields, recordConflictMap)`;
        }

        // This shape does not include fields,
        // just import the top level ingest
        if (containsFields === false) {
            const code = importRamlArtifact(propertyShapeId, 'ingest');

            return `${propertyName}: ${code}`;
        }

        // there are fields at this path,
        // import createFieldsIngest
        const fieldsIngestImport = namedImport(`./${propertyShapeName}`, 'createFieldsIngest');

        return deindent`
      ${propertyName}: ${fieldsIngestImport}(params)
    `;
    });

    return deindent`
    {
        ${code.join(',\n')}
    }
  `;
}

function generateFieldsClosure(shape, state) {
    const { generationContext, importsMap } = state;
    const { importContext, deindent } = generationContext;
    const { importRamlArtifact } = importContext;

    const {
        INGEST_PATH_IMPORT,
        LUVIO_IMPORT,
        STORE_IMPORT,
        FIELD_MAP_REPRESENTATION_IMPORT,
        FIELD_MAP_REPRESENTATION_NORMALIZED_IMPORT,
        CONVERT_TRIE_TO_FIELDS_IMPORT,
        MARK_MISSING_OPTIONAL_FIELDS_IMPORT,
    } = importsMap;

    const dynamicIngestImport = importRamlArtifact(shape.id, 'dynamicIngest');

    return deindent`
        const { fields, optionalFields, trackedFields, recordConflictMap } = params;
        const ingest = ${dynamicIngestImport}(${generateShapeFieldsIngest(shape, state)});

        return (
            data: ${FIELD_MAP_REPRESENTATION_IMPORT},
            path: ${INGEST_PATH_IMPORT},
            luvio: ${LUVIO_IMPORT},
            store: ${STORE_IMPORT},
            timestamp: number
        ) => {
            const link = ingest(data, path, luvio, store, timestamp);
            const recordNode = luvio.getNode<
                ${FIELD_MAP_REPRESENTATION_NORMALIZED_IMPORT},
                ${FIELD_MAP_REPRESENTATION_IMPORT}
            >(link.__ref!);
            ${MARK_MISSING_OPTIONAL_FIELDS_IMPORT}(recordNode, ${CONVERT_TRIE_TO_FIELDS_IMPORT}(trackedFields));
            return link;
        }
    `;
}

function generateShapeFieldsIngest(shape, state) {
    switch (shape.shapeType) {
        case 2:
            return generateNodeShapeFieldsIngest(shape, state);
    }

    return '';
}

function generateEntry(shape, state) {
    const { generationContext, fieldsAst } = state;
    const { importContext, deindent } = generationContext;
    const { importRamlArtifact } = importContext;
    const { shapesWithFields } = fieldsAst;

    if (shapesWithFields[shape.id] === undefined) {
        const dynamicIngestImport = importRamlArtifact(shape.id, 'dynamicIngest');
        return deindent`
      return ${dynamicIngestImport}(${generateShapeFieldsIngest(shape, state)})
    `;
    }
    return generateFieldsClosure(shape, state);
}

function generateFieldsIngest(shape, state) {
    const { generationContext, importsMap } = state;
    const { deindent } = generationContext;

    const {
        RESOLVE_RECORD_MAP_INTERFACE,
        RECORD_FIELD_TRIE,
        RESOURCE_INGEST_INTERFACE,
    } = importsMap;

    return deindent`
    interface Inputs {
      trackedFields: ${RECORD_FIELD_TRIE};
      fields: ${RECORD_FIELD_TRIE};
      optionalFields: ${RECORD_FIELD_TRIE};
      recordConflictMap: ${RESOLVE_RECORD_MAP_INTERFACE};
    }

    export function createFieldsIngest(params: Inputs): ${RESOURCE_INGEST_INTERFACE} {
      ${generateEntry(shape, state)};
    }
  `;
}

module.exports = {
    generateFieldsIngest,
};
