const path = require('path');

const { createImportsMap } = require('./create-import-context');
const { parse } = require('./parse-fields');

function generateFieldsClosure(shape, state) {
    const { generationContext, importsMap } = state;
    const { importContext, deindent } = generationContext;
    const { importRamlArtifact } = importContext;

    const {
        INGEST_PATH_IMPORT,
        LUVIO_IMPORT,
        STORE_IMPORT,
        RECORD_REPRESENTATION_LIKE_IMPORT,
        RECORD_REPRESENTATION_LIKE_NORMALIZED_IMPORT,
        CONVERT_TRIE_TO_FIELDS_IMPORT,
        MARK_MISSING_OPTIONAL_FIELDS_IMPORT,
    } = importsMap;

    const dynamicIngestImport = importRamlArtifact(shape.id, 'dynamicIngest');

    return deindent`
        const { fields, optionalFields, trackedFields, recordConflictMap } = params;
        const ingest = ${dynamicIngestImport}(${generateShapeFieldsIngest(shape, state)});

        return (
            data: ${RECORD_REPRESENTATION_LIKE_IMPORT},
            path: ${INGEST_PATH_IMPORT},
            luvio: ${LUVIO_IMPORT},
            store: ${STORE_IMPORT},
            timestamp: number
        ) => {
            const link = ingest(data, path, luvio, store, timestamp);
            const recordNode = luvio.getNode<
                ${RECORD_REPRESENTATION_LIKE_NORMALIZED_IMPORT},
                ${RECORD_REPRESENTATION_LIKE_IMPORT}
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

function generateResourceIngestSuccess(resource, state) {
    const { returnShape } = resource;
    const { generationContext, importsMap } = state;
    const { importContext, deindent } = generationContext;
    const { namedImport } = importContext;
    const {
        RECORD_INGEST,
        RECORD_REPRESENTATION_LIKE_IMPORT,
        RESOLVE_RECORD_CONFLICT_MAP,
        RECORD_REPRESENTATION_LIKE_NORMALIZED_IMPORT,
        MARK_MISSING_OPTIONAL_FIELDS_IMPORT,
        CONVERT_TRIE_TO_FIELDS_IMPORT,
        RECORD_FIELD_TRIE,
        RESOURCE_INGEST_INTERFACE,
        RESOLVE_RECORD_MAP_INTERFACE,
        INGEST_PATH_IMPORT,
        LUVIO_IMPORT,
        STORE_IMPORT,
    } = importsMap;

    const resourceIngest = namedImport(`../types/${returnShape.name}`, 'createFieldsIngest');
    const inputsInterface = deindent`
    interface Inputs {
      trackedFields: ${RECORD_FIELD_TRIE};
      fields: ${RECORD_FIELD_TRIE};
      optionalFields: ${RECORD_FIELD_TRIE};
    }
  `;

    const resourceIngestFunction = deindent`
    return (
      data: ${RECORD_REPRESENTATION_LIKE_IMPORT},
      path: ${INGEST_PATH_IMPORT},
      luvio: ${LUVIO_IMPORT},
      store: ${STORE_IMPORT},
      timestamp: number
    ) => {
      const link = ingest(data, path, luvio, store, timestamp);
      ${RESOLVE_RECORD_CONFLICT_MAP}(luvio, recordConflictMap);
      const recordNode = luvio.getNode<
          ${RECORD_REPRESENTATION_LIKE_NORMALIZED_IMPORT},
          ${RECORD_REPRESENTATION_LIKE_IMPORT}
      >(link.__ref!);
      ${MARK_MISSING_OPTIONAL_FIELDS_IMPORT}(recordNode, ${CONVERT_TRIE_TO_FIELDS_IMPORT}(trackedFields));
      return link;
    };
  `;

    if (returnShape.name === 'RecordRepresentation') {
        return deindent`
      ${inputsInterface}

      export function createFieldsIngestSuccess(params: Inputs): ${RESOURCE_INGEST_INTERFACE} {
          const { fields, optionalFields, trackedFields } = params;
          const recordConflictMap: ${RESOLVE_RECORD_MAP_INTERFACE} = {};
          const ingest = ${RECORD_INGEST}(fields, optionalFields, recordConflictMap);
          ${resourceIngestFunction}
      }
    `;
    }

    return deindent`
    ${inputsInterface}

    export function createFieldsIngestSuccess(params: Inputs): ${RESOURCE_INGEST_INTERFACE} {
      const { trackedFields } = params;
      const recordConflictMap: ${RESOLVE_RECORD_MAP_INTERFACE} = {};
      const ingest = ${resourceIngest}({
        ...params,
        recordConflictMap,
      });

      ${resourceIngestFunction}
    }
  `;
}

let fieldsAst;

module.exports = {
    validate: modelInfo => {
        fieldsAst = parse(modelInfo);
    },

    afterGenerate: (compilerConfig, modelInfo, createGenerationContext) => {
        const generatedFieldsDir = path.join(compilerConfig.outputDir, 'fields');
        const { shapesWithFields, resourcesWithFields } = fieldsAst;
        Object.keys(shapesWithFields).forEach(shapeId => {
            const shape = shapesWithFields[shapeId];
            const generatedResourcesDir = path.join(
                generatedFieldsDir,
                'types',
                `${shape.name}.ts`
            );

            const context = createGenerationContext(generatedResourcesDir);
            const importsMap = createImportsMap(context.importContext);
            const code = generateFieldsIngest(shape, {
                modelInfo,
                generationContext: context,
                propertyName: null,
                importsMap,
                fieldsAst,
            });
            context.write(code);
        });

        Object.keys(resourcesWithFields).forEach(resourceId => {
            const resource = resourcesWithFields[resourceId];
            const generatedResourcesDir = path.join(
                generatedFieldsDir,
                'resources',
                `${resource.name}.ts`
            );

            const context = createGenerationContext(generatedResourcesDir);
            const importsMap = createImportsMap(context.importContext);
            const code = generateResourceIngestSuccess(resource, {
                modelInfo,
                generationContext: context,
                propertyName: null,
                importsMap,
                fieldsAst,
            });
            context.write(code);
        });
    },
};
