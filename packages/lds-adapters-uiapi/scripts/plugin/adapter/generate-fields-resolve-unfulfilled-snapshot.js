const { adapterConfigInterfaceName } = require('./util');

function generateResolveUnfulfilledSnapshot(adapter, resource, def, state) {
    const { generationContext, importsMap } = state;
    const { deindent, importContext } = generationContext;
    const { namedImport, importRamlArtifact } = importContext;
    const adapterConfigImport = importRamlArtifact(adapter.id, adapterConfigInterfaceName(adapter));
    const adapterKeyImport = importRamlArtifact(adapter.id, 'keyBuilder');

    const {
        FETCH_RESPONSE,
        UNFULFILLED_SNAPSHOT_IMPORT,
        FULFILLED_SNAPSHOT,
        BLANK_RECORD_FIELDS_TRIE,
        CONVERT_FIELDS_TO_TRIE_IMPORT,
        GET_TRACKED_FIELDS,
        LUVIO_IMPORT,
    } = importsMap;

    const optionalFieldsTrieStatement =
        def.optionalFields === null
            ? BLANK_RECORD_FIELDS_TRIE
            : deindent`
      ${CONVERT_FIELDS_TO_TRIE_IMPORT}(
          ${GET_TRACKED_FIELDS}(
              key,
              luvio.getNode(key),
              config.${def.optionalFields.configName}
          )
      );
  `;

    const fieldsTrieStatement =
        def.fields === null
            ? BLANK_RECORD_FIELDS_TRIE
            : deindent`
      ${CONVERT_FIELDS_TO_TRIE_IMPORT}(
          config.${def.fields.configName}
      );
  `;

    const returnTypeInterface = importRamlArtifact(
        resource.returnShape.id,
        resource.returnShape.name
    );
    const createFieldsIngestSuccessImport = namedImport(
        `../resources/${resource.name}`,
        'createFieldsIngestSuccess'
    );
    const createResourceParamsIdentifier = importRamlArtifact(adapter.id, 'createResourceParams');
    const createResourceRequestIdentifier = importRamlArtifact(
        resource.id,
        'createResourceRequest'
    );
    const onResourceResponseError = importRamlArtifact(adapter.id, 'onResourceResponseError');
    const buildInMemorySnapshot = importRamlArtifact(adapter.id, 'buildInMemorySnapshot');
    const generatedResolveUnfulfilledSnapshot = namedImport(
        `../../adapters/${adapter.name}`,
        'resolveUnfulfilledSnapshot'
    );

    return deindent`
      export const resolveUnfulfilledSnapshot: typeof ${generatedResolveUnfulfilledSnapshot} = (luvio: ${LUVIO_IMPORT}, config: ${adapterConfigImport}, snapshot: ${UNFULFILLED_SNAPSHOT_IMPORT}<${returnTypeInterface}, any>) => {
          const resourceParams = ${createResourceParamsIdentifier}(config);
          const request = ${createResourceRequestIdentifier}(resourceParams);
          const key = ${adapterKeyImport}(luvio, config);
          const optionalFieldsTrie = ${optionalFieldsTrieStatement};
          const fieldsTrie = ${fieldsTrieStatement};
          return luvio.resolveUnfulfilledSnapshot<${returnTypeInterface}>(request, snapshot)
              .then((response) => {
                  const ingest = ${createFieldsIngestSuccessImport}({
                      fields: fieldsTrie,
                      optionalFields: optionalFieldsTrie,
                      trackedFields: optionalFieldsTrie,
                  });
                  luvio.storeIngest<${returnTypeInterface}>(
                      key,
                      ingest,
                      response.body
                  );
                  const snapshot = ${buildInMemorySnapshot}(luvio, config);
                  if (process.env.NODE_ENV !== 'production') {
                      if (snapshot.state !== 'Fulfilled') {
                          throw new Error(
                              'Invalid network response. Expected network response to result in Fulfilled snapshot'
                          );
                      }
                  }
                  return snapshot as ${FULFILLED_SNAPSHOT}<${returnTypeInterface}, {}>;
              }, (response: ${FETCH_RESPONSE}<unknown>) => {
                  return ${onResourceResponseError}(luvio, config, resourceParams, response);
              });
      }
  `;
}

module.exports = {
    generateResolveUnfulfilledSnapshot,
};