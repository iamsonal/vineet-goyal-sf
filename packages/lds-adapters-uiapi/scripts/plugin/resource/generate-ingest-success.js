function generateResourceIngestSuccess(resource, state) {
    const { returnShape } = resource;
    const { generationContext, importsMap } = state;
    const { importContext, deindent } = generationContext;
    const { namedImport } = importContext;
    const {
        RECORD_INGEST,
        FIELD_MAP_REPRESENTATION_IMPORT,
        RESOLVE_RECORD_CONFLICT_MAP,
        FIELD_MAP_REPRESENTATION_NORMALIZED_IMPORT,
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
      serverRequestCount?: number;
    }
  `;

    const resourceIngestFunction = deindent`
    return (
      data: ${FIELD_MAP_REPRESENTATION_IMPORT},
      path: ${INGEST_PATH_IMPORT},
      luvio: ${LUVIO_IMPORT},
      store: ${STORE_IMPORT},
      timestamp: number
    ) => {
      const link = ingest(data, path, luvio, store, timestamp);
      ${RESOLVE_RECORD_CONFLICT_MAP}(luvio, recordConflictMap);
      const recordNode = luvio.getNode<
          ${FIELD_MAP_REPRESENTATION_NORMALIZED_IMPORT},
          ${FIELD_MAP_REPRESENTATION_IMPORT}
      >(link.__ref!);
      ${MARK_MISSING_OPTIONAL_FIELDS_IMPORT}(recordNode, ${CONVERT_TRIE_TO_FIELDS_IMPORT}(trackedFields));
      return link;
    };
  `;

    if (returnShape.name === 'RecordRepresentation') {
        return deindent`
      ${inputsInterface}

      export function createFieldsIngestSuccess(params: Inputs): ${RESOURCE_INGEST_INTERFACE} {
          const { fields, optionalFields, trackedFields, serverRequestCount = 1 } = params;
          const recordConflictMap: ${RESOLVE_RECORD_MAP_INTERFACE} = {
              conflicts: {},
              serverRequestCount,
          };
          const ingest = ${RECORD_INGEST}(fields, optionalFields, recordConflictMap);
          ${resourceIngestFunction}
      }
    `;
    }

    return deindent`
    ${inputsInterface}

    export function createFieldsIngestSuccess(params: Inputs): ${RESOURCE_INGEST_INTERFACE} {
      const { trackedFields } = params;
      const recordConflictMap: ${RESOLVE_RECORD_MAP_INTERFACE} = {
         conflicts: {},
         serverRequestCount: 1,
      };
      const ingest = ${resourceIngest}({
        ...params,
        recordConflictMap,
      });

      ${resourceIngestFunction}
    }
  `;
}

module.exports = {
    generateResourceIngestSuccess,
};
