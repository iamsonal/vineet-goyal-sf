import { ResourceRequest } from '@luvio/engine';
import { BatchRepresentation, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    DRAFT_RECORD_ID,
    mockDurableStoreGetDenormalizedRecordDraft,
    RECORD_ID,
    STORE_KEY_DRAFT_RECORD,
} from '../../__tests__/test-utils';
import { setupDraftEnvironment } from './test-utils';
import mockCompositeResponseSingleRecord from './mockData/records-single-Accounts-fields-Account.Id,Account.Name.json';
import mockCompositeResponseMultipleRecords from './mockData/records-multiple-Accounts-fields-Account.Id,Account.Name.json';
import mockCompositeResponseMultipleRecordsDraftIngested from './mockData/records-multiple-Accounts-fields-Account.Id,Account.Name-DraftIngestedFirst.json';
import { clone } from '../../utils/clone';
import { getRecordKeyForId } from '../../utils/records';

const FIELDS = ['Account.Name'];

function buildRequest(ids: string[], fields: string[], optionalFields: string[]): ResourceRequest {
    return {
        basePath: `/ui-api/records/batch/${ids.join(',')}`,
        baseUri: '',
        queryParams: {
            fields,
            optionalFields,
        },
        urlParams: {
            recordIds: ids,
        },
        method: 'get',
        body: undefined,
        headers: {},
    };
}

function mockCompositeNetworkResponse(network: jest.Mock) {
    network.mockResolvedValue({
        body: clone(mockCompositeResponseSingleRecord),
    });
}

describe('draft environment tests', () => {
    describe('getRecords', () => {
        it('does not hit the network for request containing only draft ids', async () => {
            const { draftEnvironment, network, durableStore } = setupDraftEnvironment();

            // create getRecords request containing draft ids
            const request = buildRequest([DRAFT_RECORD_ID], FIELDS, []);
            mockDurableStoreGetDenormalizedRecordDraft(durableStore);
            const response = await draftEnvironment.dispatchResourceRequest(request);
            // ensure network not called
            expect(network).toBeCalledTimes(0);
            // ensure synthetic response returned
            expect(response.status).toBe(200);
            const compoundResponse = response.body as any;
            expect(compoundResponse.results.length).toBe(1);
            expect(compoundResponse.results[0].statusCode).toBe(200);
            expect(compoundResponse.results[0].result.id).toBe(DRAFT_RECORD_ID);
        });

        it('only hits the network with canonical ids', async () => {
            const { draftEnvironment, network } = setupDraftEnvironment();

            // create getRecords request containing only canonical ids
            const request = buildRequest([RECORD_ID], FIELDS, []);
            await draftEnvironment.dispatchResourceRequest(request);

            // ensure network with all ids called and returned untouched
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/batch/${RECORD_ID}`);
        });

        it('merges synthetic records with canonical records', async () => {
            const { draftEnvironment, network, durableStore } = setupDraftEnvironment();

            mockDurableStoreGetDenormalizedRecordDraft(durableStore);
            mockCompositeNetworkResponse(network);

            // create getRecords request containing a mix of draft ids and canonical ids
            const request = buildRequest([RECORD_ID, DRAFT_RECORD_ID], FIELDS, []);
            const response = await draftEnvironment.dispatchResourceRequest<BatchRepresentation>(
                request
            );

            // ensure network request containing only canonical ids is made
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/batch/${RECORD_ID}`);

            // ensure result contains the network response and synthetic responses
            const compoundResponse = response.body;
            expect(compoundResponse.results.length).toBe(2);
            expect(compoundResponse.results[0].statusCode).toBe(200);
            expect((compoundResponse.results[0].result as RecordRepresentation).id).toBe(RECORD_ID);
            expect(compoundResponse.results[1].statusCode).toBe(200);
            expect((compoundResponse.results[1].result as RecordRepresentation).id).toBe(
                DRAFT_RECORD_ID
            );
        });

        it('maintains order of requested ids in response', async () => {
            const { draftEnvironment, network, durableStore } = setupDraftEnvironment();

            mockDurableStoreGetDenormalizedRecordDraft(durableStore);
            mockCompositeNetworkResponse(network);

            // create getRecords request containing a mix of draft ids and canonical ids
            const request = buildRequest([DRAFT_RECORD_ID, RECORD_ID], FIELDS, []);
            const response = await draftEnvironment.dispatchResourceRequest<BatchRepresentation>(
                request
            );

            // ensure network request containing only canonical ids is made
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/batch/${RECORD_ID}`);

            // ensure result contains the network response and synthetic responses
            const compoundResponse = response.body;
            expect(compoundResponse.results.length).toBe(2);
            expect(compoundResponse.results[0].statusCode).toBe(200);
            expect((compoundResponse.results[0].result as RecordRepresentation).id).toBe(
                DRAFT_RECORD_ID
            );
            expect(compoundResponse.results[1].statusCode).toBe(200);
            expect((compoundResponse.results[1].result as RecordRepresentation).id).toBe(RECORD_ID);
        });

        it('returns mutable data', async () => {
            const { draftEnvironment, network, durableStore } = setupDraftEnvironment();

            mockDurableStoreGetDenormalizedRecordDraft(durableStore);
            mockCompositeNetworkResponse(network);

            // create getRecords request containing a mix of draft ids and canonical ids
            const request = buildRequest([RECORD_ID, DRAFT_RECORD_ID], FIELDS, []);
            const response = await draftEnvironment.dispatchResourceRequest<BatchRepresentation>(
                request
            );
            const compoundResponse = response.body;
            expect(compoundResponse.results.length).toBe(2);
            expect(compoundResponse.results[0].statusCode).toBe(200);

            const record = compoundResponse.results[0].result as RecordRepresentation;
            expect(record.id).toBe(RECORD_ID);
            record.id = 'bar';
            expect(record.id).toBe('bar');
        });

        it('returns synthetic records with missing optionalFields', async () => {
            const { draftEnvironment, network, durableStore } = setupDraftEnvironment();

            mockDurableStoreGetDenormalizedRecordDraft(durableStore);
            mockCompositeNetworkResponse(network);

            // create getRecords request containing a mix of draft ids and canonical ids
            const request = buildRequest([RECORD_ID, DRAFT_RECORD_ID], FIELDS, [
                'Account.MissingField',
            ]);
            const response = await draftEnvironment.dispatchResourceRequest<BatchRepresentation>(
                request
            );

            // ensure network request containing only canonical ids is made
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/batch/${RECORD_ID}`);

            // ensure result contains the network response and synthetic responses
            const compoundResponse = response.body;
            expect(compoundResponse.results.length).toBe(2);
            expect(compoundResponse.results[0].statusCode).toBe(200);
            expect((compoundResponse.results[0].result as RecordRepresentation).id).toBe(RECORD_ID);
            expect(compoundResponse.results[1].statusCode).toBe(200);
            expect((compoundResponse.results[1].result as RecordRepresentation).id).toBe(
                DRAFT_RECORD_ID
            );
        });

        it('refetches if a draft response has been ingested since the fetch', async () => {
            const { draftEnvironment, network, store } = setupDraftEnvironment();
            const mappedRecordId = mockCompositeResponseMultipleRecords.results[1].result.id;
            let networkCount = 0;

            network.mockImplementation(() => {
                networkCount++;

                expect(networkCount).toBeLessThanOrEqual(2);

                if (networkCount === 1) {
                    const mappedRecordKey = getRecordKeyForId(mappedRecordId);
                    store.redirect(STORE_KEY_DRAFT_RECORD, mappedRecordKey);
                    return Promise.resolve({
                        body: clone(mockCompositeResponseSingleRecord),
                    });
                }

                if (networkCount === 2) {
                    return Promise.resolve({
                        body: clone(mockCompositeResponseMultipleRecords),
                    });
                }
            });

            // create getRecords request containing a mix of draft ids and canonical ids
            const request = buildRequest([RECORD_ID, DRAFT_RECORD_ID], FIELDS, []);
            const response = await draftEnvironment.dispatchResourceRequest<BatchRepresentation>(
                request
            );
            expect(response.body.results.length).toBe(2);
            expect((response.body.results[1].result as any).id).toBe(mappedRecordId);
        });

        it('maintains request id order with ingested draft records', async () => {
            const { draftEnvironment, network, store } = setupDraftEnvironment();
            const mappedRecordId =
                mockCompositeResponseMultipleRecordsDraftIngested.results[0].result.id;
            const nonMappedRecordId =
                mockCompositeResponseMultipleRecordsDraftIngested.results[1].result.id;
            let networkCount = 0;

            network.mockImplementation(() => {
                networkCount++;

                expect(networkCount).toBeLessThanOrEqual(2);

                if (networkCount === 1) {
                    const mappedRecordKey = getRecordKeyForId(mappedRecordId);
                    store.redirect(STORE_KEY_DRAFT_RECORD, mappedRecordKey);
                    return Promise.resolve({
                        body: clone(mockCompositeResponseSingleRecord),
                    });
                }

                if (networkCount === 2) {
                    return Promise.resolve({
                        body: clone(mockCompositeResponseMultipleRecordsDraftIngested),
                    });
                }
            });

            // create getRecords request containing a mix of draft ids and canonical ids
            const request = buildRequest([DRAFT_RECORD_ID, nonMappedRecordId], FIELDS, []);
            const response = await draftEnvironment.dispatchResourceRequest<BatchRepresentation>(
                request
            );
            expect(response.body.results.length).toBe(2);
            expect((response.body.results[0].result as any).id).toBe(mappedRecordId);
            expect((response.body.results[1].result as any).id).toBe(nonMappedRecordId);
        });
    });
});
