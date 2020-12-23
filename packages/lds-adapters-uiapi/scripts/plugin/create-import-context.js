const path = require('path');
const cwd = process.cwd();

const src_util_fields = path.join(cwd, 'src', 'util', 'fields');
const src_util_records = path.join(cwd, 'src', 'util', 'records');
const src_util_record_ingest = path.join(cwd, 'src', 'util', 'record-ingest');
const src_helpers_RecordRepresentation_resolveConflict = path.join(
    cwd,
    'src',
    'helpers',
    'RecordRepresentation',
    'resolveConflict'
);

function createImportsMap(importContext) {
    const { namedImport, importAbsolutePath } = importContext;
    return {
        FIELD_MAP_REPRESENTATION_IMPORT: namedImport(src_util_fields, 'FieldMapRepresentation'),
        FIELD_MAP_REPRESENTATION_NORMALIZED_IMPORT: namedImport(
            src_util_fields,
            'FieldMapRepresentationNormalized'
        ),
        CONVERT_TRIE_TO_FIELDS_IMPORT: namedImport(src_util_records, 'convertTrieToFields'),
        MARK_MISSING_OPTIONAL_FIELDS_IMPORT: namedImport(
            src_util_records,
            'markMissingOptionalFields'
        ),
        RESOLVE_RECORD_CONFLICT_MAP: importAbsolutePath(
            src_helpers_RecordRepresentation_resolveConflict,
            'resolveConflict'
        ),
        RECORD_INGEST: importAbsolutePath(src_util_record_ingest, 'createRecordIngest'),
        RESOURCE_INGEST_INTERFACE: namedImport(`@luvio/engine`, 'ResourceIngest'),
        RECORD_FIELD_TRIE: importAbsolutePath(src_util_records, 'RecordFieldTrie'),
        RESOLVE_RECORD_MAP_INTERFACE: importAbsolutePath(
            src_helpers_RecordRepresentation_resolveConflict,
            'RecordConflictMap'
        ),
        INGEST_PATH_IMPORT: namedImport('@luvio/engine', 'IngestPath'),
        LUVIO_IMPORT: namedImport('@luvio/engine', 'Luvio'),
        STORE_IMPORT: namedImport('@luvio/engine', 'Store'),
        CREATE_FIELDS_INGESTION: namedImport(src_util_record_ingest, 'createFieldsIngestion'),
    };
}

module.exports = { createImportsMap };
