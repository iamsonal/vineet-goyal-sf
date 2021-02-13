import { DurableEnvironment } from '@luvio/environments';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { createInternalErrorResponse, createOkResponse } from '../DraftFetchResponse';
import { clone } from '../utils/clone';
import { buildRecordSelector, extractRecordApiNameFromStore } from '../utils/records';

export function createSyntheticRecordResponse(
    key: string,
    fields: string[],
    allowUnfulfilledResponse: boolean,
    env: DurableEnvironment
) {
    const apiName = extractRecordApiNameFromStore(key, env);
    if (apiName === null) {
        // TODO: uncomment once logger is injected to engine
        // env.log('record not in store after revival');
        throw createInternalErrorResponse();
    }

    const selector = buildRecordSelector(
        key,
        fields.map(f => `${apiName}.${f}`)
    );
    const snapshot = env.storeLookup<RecordRepresentation>(selector, env.createSnapshot);
    const { state } = snapshot;
    if (state !== 'Fulfilled' && state !== 'Stale' && allowUnfulfilledResponse !== true) {
        // TODO: uncomment once logger is injected to engine
        // env.log('Snapshot is not fulfilled after a revival');
        throw createInternalErrorResponse();
    }

    // We need the data to be mutable to go through ingest/normalization.
    // Eventually storeLookup will supply a mutable version however for now we need
    // to make it mutable ourselves.
    const mutableData = clone(snapshot.data) as RecordRepresentation;
    return createOkResponse(mutableData);
}
