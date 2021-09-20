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
            //targetIdentifier added to point to the overriden export name
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
            identifier: 'getLayoutAdapterFactory',
            path: path.join('src', 'wire', 'getLayout', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getLayoutUserState': [
        {
            identifier: 'getLayoutUserStateAdapterFactory',
            path: path.join('src', 'wire', 'getLayoutUserState', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
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
            identifier: 'getPicklistValuesAdapterFactory',
            path: path.join('src', 'wire', 'getPicklistValues', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
        },
    ],
    '/adapters/getRecordAvatars': [
        {
            identifier: 'getRecordAvatarsAdapterFactory',
            path: path.join('src', 'wire', 'getRecordAvatars', 'index.ts'),
            //targetIdentifier added to point to the overriden export name
            targetIdentifier: 'factory',
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
