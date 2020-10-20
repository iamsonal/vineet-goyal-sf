export { MRU } from './wire/getListUi';
export { notifyChangeFactory as GetRecordNotifyChange } from './wire/getRecord';
export { ClientOptions as UpdateRecordClientOptions } from './wire/updateRecord';

export { UpdateRecordConfig } from './generated/adapters/updateRecord';

// Validation Utils
export { untrustedIsObject } from './generated/adapters/adapter-utils';

// This ingestion method needs to be exposed to ingest records coming from the ADS Bridge.
// These ingestion methods are also used to ingest records after a draft action is executed
// TODO W-5971944 - remove the ADS bridge and these exports
export {
    RecordRepresentation,
    RecordRepresentationNormalized,
    keyBuilder as keyBuilderRecord,
    KeyParams as KeyParamsRecord,
} from './generated/types/RecordRepresentation';
export { ingest as ingestRecord } from './raml-artifacts/types/RecordRepresentation/ingest';
export {
    ObjectInfoRepresentation,
    keyBuilder as keyBuilderObjectInfo,
    ingest as ingestObjectInfo,
} from './generated/types/ObjectInfoRepresentation';
export {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from './generated/types/FieldValueRepresentation';

export * from './generated/artifacts/main';

// Exposing those ingestion methods method "@ldsjs/engine" performance tests.
// TODO W-6900152 - Explore other solutions to see how we can avoid exposing the types out of the module.
export { ingest as ingestRecordUi } from './generated/types/RecordUiRepresentation';
export { ingest as ingestRelatedListInfo } from './generated/types/RelatedListInfoRepresentation';
export { ingest as ingestRelatedListInfoBatch } from './generated/types/RelatedListInfoBatchRepresentation';
export { ingest as ingestRelatedListRecords } from './generated/types/RelatedListRecordCollectionRepresentation';
export { ingest as ingestRelatedListRecordsBatch } from './generated/types/RelatedListRecordCollectionBatchRepresentation';
export { ingest as ingestDuplicateConfiguration } from './generated/types/DuplicatesConfigurationRepresentation';
export { ingest as ingestDuplicatesRepresentation } from './generated/types/DuplicatesRepresentation';
export { ingest as ingestRelatedListSummaryInfoCollection } from './generated/types/RelatedListSummaryInfoCollectionRepresentation';

export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getRecordInput,
    getFieldValue,
} from './uiapi-static-functions';

// Export "retrievers" so durable environments can properly revive RecordRepresentations
// from responses before running record merge code
export { responseRecordRepresentationRetrievers } from './generated/records/retrievers';

// Exposing this helper method so we can build record selectors from our @salesforce/lds-drafts package
// TODO W-8235671 we should move common record utilities to @salesforce/uiapi-record-utils
export { buildSelectionFromFields } from './selectors/record';
