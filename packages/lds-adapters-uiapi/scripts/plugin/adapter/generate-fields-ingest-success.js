const { adapterConfigInterfaceName } = require('./util');

function generateFieldsIngestSuccess(adapter, resource, def, state) {
    const { generationContext, importsMap } = state;
    const { deindent, importContext } = generationContext;
    const { namedImport, importRamlArtifact } = importContext;
    const adapterConfigImport = importRamlArtifact(adapter.id, adapterConfigInterfaceName(adapter));
    const adapterKeyImport = importRamlArtifact(adapter.id, 'keyBuilder');

    const {
        DISPATCH_RESOURCE_REQUEST_CONTEXT,
        FETCH_RESPONSE,
        FULFILLED_SNAPSHOT,
        BLANK_RECORD_FIELDS_TRIE,
        CONVERT_FIELDS_TO_TRIE_IMPORT,
        GET_TRACKED_FIELDS,
        LUVIO_IMPORT,
        CONFIGURATION_OBJECT,
    } = importsMap;

    const trackedFieldsConfiguration = deindent`
        {
            maxDepth: ${CONFIGURATION_OBJECT}.getTrackedFieldDepthOnCacheMiss(),
            onlyFetchLeafNodeId: ${CONFIGURATION_OBJECT}.getTrackedFieldLeafNodeIdOnly()
        }`;

    const optionalFieldsTrieStatement =
        def.optionalFields === null
            ? BLANK_RECORD_FIELDS_TRIE
            : deindent`
      ${CONVERT_FIELDS_TO_TRIE_IMPORT}(
          ${GET_TRACKED_FIELDS}(
              key,
              luvio.getNode(key),
              trackedFieldsConfig,
              config.${def.optionalFields.configName}
          )
      )
  `;

    const fieldsTrieStatement =
        def.fields === null
            ? BLANK_RECORD_FIELDS_TRIE
            : deindent`
      ${CONVERT_FIELDS_TO_TRIE_IMPORT}(
          config.${def.fields.configName}
      )
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
    const buildCacheKeysIdentifier = importRamlArtifact(resource.id, 'getResponseCacheKeys');
    const onResourceResponseError = importRamlArtifact(adapter.id, 'onResourceResponseError');
    const buildCachedSnapshot = importRamlArtifact(adapter.id, 'buildCachedSnapshot');

    return deindent`
      export function buildNetworkSnapshot(luvio: ${LUVIO_IMPORT}, config: ${adapterConfigImport}, options?: ${DISPATCH_RESOURCE_REQUEST_CONTEXT}) {
          const resourceParams = ${createResourceParamsIdentifier}(config);
          const request = ${createResourceRequestIdentifier}(resourceParams);
          const key = ${adapterKeyImport}(luvio, config);
          const trackedFieldsConfig = ${trackedFieldsConfiguration};
          const optionalFieldsTrie = ${optionalFieldsTrieStatement};
          const fieldsTrie = ${fieldsTrieStatement};
          return luvio.dispatchResourceRequest<${returnTypeInterface}>(request, options)
              .then((response) => {
                  return luvio.handleSuccessResponse(() => {
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
                            const snapshot = ${buildCachedSnapshot}(luvio, config);
                            if (process.env.NODE_ENV !== 'production') {
                                if (snapshot.state !== 'Fulfilled') {
                                    throw new Error(
                                        'Invalid network response. Expected network response to result in Fulfilled snapshot'
                                        );
                                    }
                                }
                                luvio.storeBroadcast();
                                return snapshot as ${FULFILLED_SNAPSHOT}<${returnTypeInterface}, {}>;
                  }, () => ${buildCacheKeysIdentifier}(resourceParams, response.body));
              }, (response: ${FETCH_RESPONSE}<unknown>) => {
                  return luvio.handleErrorResponse(() => {
                      return ${onResourceResponseError}(luvio, config, resourceParams, response);
                  });
              });
      }
  `;
}

module.exports = {
    generateFieldsIngestSuccess,
};
