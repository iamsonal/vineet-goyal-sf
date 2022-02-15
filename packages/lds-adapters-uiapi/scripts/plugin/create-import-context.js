const path = require('path');
const cwd = process.cwd();

const src_util_fields = path.join(cwd, 'src', 'util', 'fields');
const src_util_records = path.join(cwd, 'src', 'util', 'records');
const src_util_record_ingest = path.join(cwd, 'src', 'util', 'record-ingest');
const src_util_select_records = path.join(cwd, 'src', 'selectors', 'record');
const src_helpers_RecordRepresentation_resolveConflict = path.join(
    cwd,
    'src',
    'helpers',
    'RecordRepresentation',
    'resolveConflict'
);
const src_configuration = path.join(cwd, 'src', 'configuration');

function createImportsMap(importContext) {
    const { namedImport, importAbsolutePath } = importContext;
    return {
        // @luvio imports
        INGEST_PATH_IMPORT: namedImport('@luvio/engine', 'IngestPath'),
        LUVIO_IMPORT: namedImport('@luvio/engine', 'Luvio'),
        STORE_IMPORT: namedImport('@luvio/engine', 'Store'),
        FRAGMENT_IMPORT: namedImport('@luvio/engine', 'Fragment'),
        CREATE_FIELDS_INGESTION: importAbsolutePath(
            src_util_record_ingest,
            'createFieldsIngestion'
        ),
        FULFILLED_SNAPSHOT: namedImport('@luvio/engine', 'FulfilledSnapshot'),
        STALE_SNAPSHOT: namedImport('@luvio/engine', 'StaleSnapshot'),
        PENDING_SNAPSHOT: namedImport('@luvio/engine', 'PendingSnapshot'),
        FETCH_RESPONSE: namedImport(`@luvio/engine`, 'FetchResponse'),
        UNFULFILLED_SNAPSHOT_IMPORT: namedImport('@luvio/engine', 'UnfulfilledSnapshot'),
        SNAPSHOT_REFRESH_TYPE: namedImport(`@luvio/engine`, 'SnapshotRefresh'),
        RESOURCE_REQUEST_OVERRIDE: namedImport(`@luvio/engine`, 'ResourceRequestOverride'),
        DISPATCH_RESOURCE_REQUEST_CONTEXT: namedImport(
            `@luvio/engine`,
            'DispatchResourceRequestContext'
        ),
        RESOURCE_INGEST_INTERFACE: namedImport(`@luvio/engine`, 'ResourceIngest'),
        RESOURCE_RESPONSE_INTERFACE: namedImport(`@luvio/engine`, 'ResourceResponse'),

        // uiapi fields/records imports
        FIELD_MAP_REPRESENTATION_IMPORT: namedImport(src_util_fields, 'FieldMapRepresentation'),
        FIELD_MAP_REPRESENTATION_NORMALIZED_IMPORT: namedImport(
            src_util_fields,
            'FieldMapRepresentationNormalized'
        ),
        CREATE_TRIE_FROM_FIELDS: importAbsolutePath(
            src_util_fields,
            'convertRecordFieldsArrayToTrie'
        ),
        GET_TRACKED_FIELDS: importAbsolutePath(src_util_records, 'getTrackedFields'),
        CONVERT_TRIE_TO_FIELDS_IMPORT: importAbsolutePath(src_util_records, 'convertTrieToFields'),
        MARK_MISSING_OPTIONAL_FIELDS_IMPORT: importAbsolutePath(
            src_util_records,
            'markMissingOptionalFields'
        ),
        RESOLVE_RECORD_CONFLICT_MAP: importAbsolutePath(
            src_helpers_RecordRepresentation_resolveConflict,
            'resolveConflict'
        ),

        RECORD_FIELD_TRIE: importAbsolutePath(src_util_records, 'RecordFieldTrie'),
        BLANK_RECORD_FIELDS_TRIE: importAbsolutePath(src_util_records, 'BLANK_RECORD_FIELDS_TRIE'),
        CONVERT_FIELDS_TO_TRIE_IMPORT: importAbsolutePath(src_util_records, 'convertFieldsToTrie'),

        RECORD_INGEST: importAbsolutePath(src_util_record_ingest, 'createRecordIngest'),

        RESOLVE_RECORD_MAP_INTERFACE: importAbsolutePath(
            src_helpers_RecordRepresentation_resolveConflict,
            'RecordConflictMap'
        ),
        CREATE_FIELDS_SELECTION: importAbsolutePath(src_util_fields, 'createPathSelection'),

        GENERATE_FIELDS_SELECTION: importAbsolutePath(
            src_util_select_records,
            'generateFieldsSelection'
        ),
        BUILD_SELECTION_FROM_FIELDS: importAbsolutePath(
            src_util_select_records,
            'buildSelectionFromFields'
        ),

        // configuration
        CONFIGURATION_OBJECT: importAbsolutePath(src_configuration, 'configuration'),
    };
}

module.exports = { createImportsMap };
