const path = require('path');

const RAML_ARTIFACTS = {
    '/adapters/getRecords': [
        {
            identifier: 'GetRecordsConfig',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'GetRecordsConfig.ts'
            ),
        },
        {
            identifier: 'getRecords_ConfigPropertyNames',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'getRecords_ConfigPropertyNames.ts'
            ),
        },
        {
            identifier: 'adapterFragment',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'adapterFragment.ts'
            ),
        },
        {
            identifier: 'createResourceParams',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'createResourceParams.ts'
            ),
        },
        {
            identifier: 'onResourceResponseSuccess',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'onResourceResponseSuccess.ts'
            ),
        },
        {
            identifier: 'typeCheckConfig',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'typeCheckConfig.ts'
            ),
        },
        {
            identifier: 'validateAdapterConfig',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecords',
                'validateAdapterConfig.ts'
            ),
        },
    ],
    '/adapters/getRecord': [
        {
            identifier: 'getRecordAdapterFactory',
            path: path.join('src', 'wire', 'getRecord', 'index.ts'),
            //targetIdentifier added to point to the overridden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getRecordUi': [
        {
            identifier: 'getRecordUiAdapterFactory',
            path: path.join('src', 'wire', 'getRecordUi', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getLayout': [
        {
            identifier: 'validateAdapterConfig',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayout',
                'validateAdapterConfig.ts'
            ),
        },
        {
            identifier: 'onResourceResponseSuccess',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayout',
                'onResourceResponseSuccess.ts'
            ),
        },
        {
            identifier: 'GetLayoutConfig',
            path: path.join('src', 'raml-artifacts', 'adapters', 'getLayout', 'utils.ts'),
            targetIdentifier: 'GetLayoutConfigWithDefaults',
        },
        {
            identifier: 'buildCachedSnapshotCachePolicy',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayout',
                'buildCachedSnapshotCachePolicy.ts'
            ),
        },
    ],
    '/adapters/getLayoutUserState': [
        {
            identifier: 'buildCachedSnapshot',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayoutUserState',
                'buildCachedSnapshot.ts'
            ),
        },
        {
            identifier: 'buildCachedSnapshotCachePolicy',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayoutUserState',
                'buildCachedSnapshotCachePolicy.ts'
            ),
        },
        {
            identifier: 'buildNetworkSnapshot',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayoutUserState',
                'buildNetworkSnapshot.ts'
            ),
        },
        {
            identifier: 'getLayoutUserState_ConfigPropertyNames',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayoutUserState',
                'getLayoutUserState_ConfigPropertyNames.ts'
            ),
        },
        {
            identifier: 'validateAdapterConfig',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayoutUserState',
                'validateAdapterConfig.ts'
            ),
        },
        {
            identifier: 'GetLayoutUserStateConfig',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getLayoutUserState',
                'getLayoutUserStateConfig.ts'
            ),
        },
    ],
    '/adapters/getListViewSummaryCollection': [
        {
            identifier: 'getListViewSummaryCollectionAdapterFactory',
            path: path.join('src', 'wire', 'getListViewSummaryCollection', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getLookupRecords': [
        {
            identifier: 'getLookupRecordsAdapterFactory',
            path: path.join('src', 'wire', 'getLookupRecords', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getMruListUi': [
        {
            identifier: 'getMruListUiAdapterFactory',
            path: path.join('src', 'wire', 'getMruListUi', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getPicklistValues': [
        {
            identifier: 'validateAdapterConfig',
            path: path.join('src', 'raml-artifacts', 'getPicklistValues', 'index.ts'),
        },
        {
            identifier: 'buildNetworkSnapshotCachePolicy',
            path: path.join('src', 'raml-artifacts', 'getPicklistValues', 'index.ts'),
        },
        {
            identifier: 'buildCachedSnapshotCachePolicy',
            path: path.join('src', 'raml-artifacts', 'getPicklistValues', 'index.ts'),
        },
    ],
    '/adapters/getRecordAvatars': [
        {
            identifier: 'buildNetworkSnapshot',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecordAvatars',
                'buildNetworkSnapshot.ts'
            ),
        },
        {
            identifier: 'buildNetworkSnapshotCachePolicy',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecordAvatars',
                'buildNetworkSnapshotCachePolicy.ts'
            ),
        },
        {
            identifier: 'buildCachedSnapshot',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecordAvatars',
                'buildCachedSnapshot.ts'
            ),
        },
        {
            identifier: 'buildCachedSnapshotCachePolicy',
            path: path.join(
                'src',
                'raml-artifacts',
                'adapters',
                'getRecordAvatars',
                'buildCachedSnapshotCachePolicy.ts'
            ),
        },
    ],
    '/adapters/getRecordCreateDefaults': [
        {
            identifier: 'getRecordCreateDefaultsAdapterFactory',
            path: path.join('src', 'wire', 'getRecordCreateDefaults', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/resources/getUiApiRecordDefaultsTemplateCloneByRecordId': [
        {
            identifier: 'select',
            path: path.join(
                'src',
                'raml-artifacts',
                'resources',
                'getUiApiRecordDefaultsTemplateCloneByRecordId',
                'select.ts'
            ),
        },
    ],
    '/resources/getUiApiRecordsBatchByRecordIds': [
        {
            identifier: 'selectChildResourceParams',
            path: path.join(
                'src',
                'raml-artifacts',
                'resources',
                'getUiApiRecordsBatchByRecordIds',
                'selectChildResourceParams.ts'
            ),
        },
        {
            identifier: 'ingestSuccessChildResourceParams',
            path: path.join(
                'src',
                'raml-artifacts',
                'resources',
                'getUiApiRecordsBatchByRecordIds',
                'ingestSuccessChildResourceParams.ts'
            ),
        },
    ],
    '/resources/getUiApiRecordsByRecordId': [
        {
            identifier: 'createResourceRequest',
            path: path.join(
                'src',
                'raml-artifacts',
                'resources',
                'getUiApiRecordsByRecordId',
                'createResourceRequest.ts'
            ),
        },
    ],
    '/resources/getUiApiRecordAvatarsBatchByRecordIds': [
        {
            identifier: 'ingestSuccess',
            path: path.join(
                'src',
                'raml-artifacts',
                'resources',
                'getUiApiRecordAvatarsBatchByRecordIds',
                'ingestSuccess.ts'
            ),
        },
    ],
    '/types/RecordRepresentation': [
        {
            identifier: 'keyBuilderFromType',
            path: path.join(
                'src',
                'raml-artifacts',
                'types',
                'RecordRepresentation',
                'keyBuilderFromType.ts'
            ),
        },
        {
            identifier: 'ingest',
            path: path.join('src', 'raml-artifacts', 'types', 'RecordRepresentation', 'ingest.ts'),
        },
    ],
    '/types/RecordAvatarBulkMapRepresentation': [
        {
            identifier: 'ingest',
            path: path.join(
                'src',
                'raml-artifacts',
                'types',
                'RecordAvatarBulkMapRepresentation',
                'ingest.ts'
            ),
        },
    ],
    '/types/QuickActionDefaultsRepresentation': [
        {
            identifier: 'dynamicIngest',
            path: path.join(
                'src',
                'raml-artifacts',
                'types',
                'QuickActionDefaultsRepresentation',
                'dynamicIngest.ts'
            ),
        },
    ],
};

module.exports = {
    RAML_ARTIFACTS,
};
