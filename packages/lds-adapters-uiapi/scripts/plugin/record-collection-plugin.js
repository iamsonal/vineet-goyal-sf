const path = require('path');
const { createImportsMap } = require('./create-import-context');
const { getSuffix } = require('./utils');

const recordCollectionAdapters = require('./record-collection-adapters-config.js');

const MARK_MISSING_OPTIONAL_FIELDS_ON_RECORDS_IDENTIFIER = 'markMissingOptionalFieldsOnRecords';

let recordCollectionResources;

function getRecordCollectionResources(modelInfo) {
    return modelInfo.resources.filter((resource) => {
        const { adapter } = resource;
        return adapter !== undefined && recordCollectionAdapters[adapter.name] !== undefined;
    });
}

function generateResource(resource, def, outputDir, createGenerationContext, modelInfo) {
    const generatedResourcesDir = path.join(outputDir, 'resources', `${resource.name}.ts`);

    const context = createGenerationContext(generatedResourcesDir);
    const importsMap = createImportsMap(context.importContext);
    const state = {
        modelInfo,
        generationContext: context,
        propertyName: null,
        importsMap,
        def,
    };
    const code = [
        generateResourceSelect(resource, state),
        generateResourceIngestSuccess(resource, state),
    ];
    context.write(code.join('\n\n'));
}

function generateResourceIngestSuccess(resource, state) {
    const { generationContext, importsMap, def, modelInfo } = state;

    const {
        LUVIO_IMPORT,
        FULFILLED_SNAPSHOT,
        STALE_SNAPSHOT,
        PENDING_SNAPSHOT,
        RESOURCE_RESPONSE_INTERFACE,
        SNAPSHOT_REFRESH_TYPE,
        MARK_MISSING_OPTIONAL_FIELDS_IMPORT,
    } = importsMap;

    const { importContext, deindent } = generationContext;

    const { returnShape, id: resourceId } = resource;

    const shapePaginated = modelInfo.shapePaginated[returnShape.id];
    const recordsProperty = shapePaginated.items;

    const optionalFieldsConfigName = def.optionalFields.configName;
    const paramsName = getParamsName(resource, optionalFieldsConfigName);

    const resourceRequestConfigType = importContext.importRamlArtifact(
        resourceId,
        'ResourceRequestConfig'
    );
    const resourceKeyBuilder = importContext.importRamlArtifact(resourceId, 'keyBuilder');

    const { id: returnShapeId, name: returnShapeName } = returnShape;
    const returnShapeType = importContext.importRamlArtifact(returnShapeId, returnShapeName);
    const returnShapeNormalizedType = importContext.importRamlArtifact(
        returnShapeId,
        `${returnShapeName}Normalized`
    );
    const returnShapeIngest = importContext.importRamlArtifact(returnShapeId, 'ingest');

    const recordRepShape = getRecordRepShape(returnShape, recordsProperty);
    const { id: recordRepShapeId, name: recordRepShapeName } = recordRepShape;
    const recordRepType = importContext.importRamlArtifact(recordRepShapeId, recordRepShapeName);
    const recordRepNormalizedType = importContext.importRamlArtifact(
        recordRepShapeId,
        `${recordRepShapeName}Normalized`
    );

    return deindent`
        export function ingestSuccess (
            luvio: ${LUVIO_IMPORT},
            resourceParams: ${resourceRequestConfigType},
            response: ${RESOURCE_RESPONSE_INTERFACE}<${returnShapeType}>,
            snapshotRefresh?: ${SNAPSHOT_REFRESH_TYPE}<${returnShapeType}>
        ): ${FULFILLED_SNAPSHOT}<${returnShapeType}, {}> | ${STALE_SNAPSHOT}<${returnShapeType}, {}> | ${PENDING_SNAPSHOT}<${returnShapeType}, any> {
            const { body } = response;
            const key = ${resourceKeyBuilder}(resourceParams);
            luvio.storeIngest<${returnShapeType}>(key, ${returnShapeIngest}, body);

            const optionalFields = resourceParams.${paramsName}.${optionalFieldsConfigName};
            if (optionalFields && optionalFields.length > 0) {
                const normalized = body as ${returnShapeNormalizedType};
                ${MARK_MISSING_OPTIONAL_FIELDS_ON_RECORDS_IDENTIFIER}(luvio, normalized, optionalFields);
            }

            const snapshot = luvio.storeLookup<${returnShapeType}>(
                {
                    recordId: key,
                    node: select(luvio, resourceParams),
                    variables: {},
                },
                snapshotRefresh
            );

            return snapshot as (${FULFILLED_SNAPSHOT}<${returnShapeType}, {}> | ${STALE_SNAPSHOT}<${returnShapeType}, {}>);
        };

        function ${MARK_MISSING_OPTIONAL_FIELDS_ON_RECORDS_IDENTIFIER}(
            luvio: ${LUVIO_IMPORT},
            nomalized: ${returnShapeNormalizedType},
            optionalFields: string[],
        ) {
            const records = nomalized.${recordsProperty};
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const recordKey = record.__ref;
                if (recordKey !== undefined) {
                    const node = luvio.getNode<${recordRepNormalizedType}, ${recordRepType}>(recordKey);
                    ${MARK_MISSING_OPTIONAL_FIELDS_IMPORT}(node, optionalFields);
                }
            }
        }
    `;
}

function linkImports(resources, addImportOverride) {
    resources.forEach((resource) => {
        const resourceSuffix = getSuffix(resource.id);
        [
            {
                generatedIdentifier: 'select',
                targetIdentifier: 'select',
            },
            {
                generatedIdentifier: 'ingestSuccess',
                targetIdentifier: 'ingestSuccess',
            },
        ].forEach(({ generatedIdentifier, targetIdentifier }) => {
            addImportOverride(
                resourceSuffix,
                path.resolve(
                    'src',
                    'generated',
                    'uiapi',
                    'record-collection',
                    'resources',
                    resource.name
                ),
                generatedIdentifier,
                targetIdentifier
            );
        });
    });
}

function getParamsName(resource, configParamName) {
    const { queryParameters, bodyShape, urlParameters } = resource;

    if (queryParameters.find((param) => param.name === configParamName) !== undefined) {
        return 'queryParams';
    }

    if (
        bodyShape &&
        bodyShape.properties.find((prop) => prop.name === configParamName) !== undefined
    ) {
        return 'body';
    }

    if (urlParameters.find((param) => param.name === configParamName) !== undefined) {
        return 'urlParams';
    }
}

function getRecordRepShape(recordCollectionShape, recordsPropertyName) {
    const recordPropertyShape = recordCollectionShape.properties.find((property) => {
        return property.name === recordsPropertyName;
    });

    return recordPropertyShape.range.items.linkTarget;
}

function generateResourceSelect(resource, state) {
    const { generationContext, importsMap, def, modelInfo } = state;
    const { LUVIO_IMPORT, FRAGMENT_IMPORT, BUILD_SELECTION_FROM_FIELDS } = importsMap;
    const { importContext, deindent } = generationContext;
    const { fields: fieldsDef, optionalFields: optionalFieldsDef } = def;
    const fieldsConfigName = fieldsDef.configName;
    const optionalFieldsConfigName = optionalFieldsDef.configName;

    const { returnShape, id: resourceId } = resource;
    const paramsName = getParamsName(resource, fieldsConfigName);

    const shapePaginated = modelInfo.shapePaginated[returnShape.id];
    const recordsProperty = shapePaginated.items;

    const shapeDynamicSelect = importContext.importRamlArtifact(returnShape.id, 'dynamicSelect');
    const resourceRequestConfig = importContext.importRamlArtifact(
        resourceId,
        'ResourceRequestConfig'
    );
    const createPaginationParams = importContext.importRamlArtifact(
        resourceId,
        'createPaginationParams'
    );

    return deindent`
        export function select(
            luvio: ${LUVIO_IMPORT},
            params: ${resourceRequestConfig}
        ): ${FRAGMENT_IMPORT} {
            const { ${fieldsConfigName} = [], ${optionalFieldsConfigName} = [] } = params.${paramsName};

            return ${shapeDynamicSelect}(
                {
                    ${recordsProperty}: {
                        name: '${recordsProperty}',
                        kind: 'Link',
                        fragment: {
                            kind: 'Fragment',
                            private: ['eTag', 'weakEtag'],
                            selections: ${BUILD_SELECTION_FROM_FIELDS}(${fieldsConfigName}, ${optionalFieldsConfigName}),
                        },
                    },
                },
                ${createPaginationParams}(params)
            );
        };
    `;
}

module.exports = {
    validate: (modelInfo, addImportOverride) => {
        recordCollectionResources = getRecordCollectionResources(modelInfo);
        linkImports(recordCollectionResources, addImportOverride);
    },

    afterGenerate: (compilerConfig, modelInfo, createGenerationContext) => {
        const generatedDir = path.join(compilerConfig.outputDir, 'uiapi', 'record-collection');

        recordCollectionResources.forEach((resource) => {
            const def = recordCollectionAdapters[resource.adapter.name];
            generateResource(resource, def, generatedDir, createGenerationContext, modelInfo);
        });
    },
};
