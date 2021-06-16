import timekeeper from 'timekeeper';
import { Luvio, PendingSnapshot, Snapshot } from '@luvio/engine';
import { getRecordsAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '@salesforce/lds-drafts';
import { customMatchers } from '@salesforce/lds-jest';

import { JSONStringify } from '../../../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusNetworkAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import getRecordsResponse from './data/records-multiple-Accounts-fields-Account.Id,Account.Name.json';
import getRecordsResponseWithOwnerField from './data/records-multiple-Accounts-fields-Account.OwnerId.json';
import { flushPromises } from '../../testUtils';

const RECORD_TTL = 30000;
const GET_RECORDS_PRIVATE_FIELDS = ['eTag', 'weakEtag', 'hasErrors'];

// add toEqualFulfilledSnapshotWithData custom matcher
expect.extend(customMatchers);

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let networkAdapter: MockNimbusNetworkAdapter;
    let getRecords;

    // we want the same instance of MockNimbusDurableStore since we don't
    // want to lose the listeners between tests (luvio instance only registers
    // the listeners once on static import)
    const durableStore = new MockNimbusDurableStore();
    mockNimbusStoreGlobal(durableStore);

    beforeEach(async () => {
        await durableStore.resetStore();

        networkAdapter = new MockNimbusNetworkAdapter();
        mockNimbusNetworkGlobal(networkAdapter);

        const runtime = await import('../../../main');
        luvio = runtime.luvio;
        draftQueue = runtime.draftQueue;
        draftQueue.stopQueue();
        (luvio as any).environment.store.reset();

        getRecords = getRecordsAdapterFactory(luvio);
    });

    describe('getRecords', () => {
        it('resolves stale snapshots from durable store', async () => {
            const id1 = '001xx000003Gn4WAAS';
            const id2 = '00122000003Gn4WBBA';
            const config = {
                records: [
                    {
                        recordIds: [id1, id2],
                        optionalFields: ['Account.Id', 'Account.Name'],
                    },
                ],
            };

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(getRecordsResponse),
            });

            // TODO - W-9051409 we don't need to check for Promises once custom adapters
            // are updated to not use resolveUnfulfilledSnapshot
            const snapshotOrPromise = getRecords(config)!;
            let result: Snapshot<any>;
            if ('then' in snapshotOrPromise) {
                result = await snapshotOrPromise;
            } else {
                result = await luvio.resolvePendingSnapshot(
                    snapshotOrPromise as PendingSnapshot<any, any>
                );
            }
            expect(result.state).toBe('Fulfilled');
            expect(result.data.results[0].result.id).toBe(id1);
            expect(durableStore).toBeDefined();
            (luvio as any).environment.store.reset();

            timekeeper.travel(Date.now() + RECORD_TTL + 1);

            // TODO - W-9051409 we don't need to check for Promises once custom adapters
            // are updated to not use resolveUnfulfilledSnapshot
            const snapshotOrPromise2 = getRecords(config)!;
            let result2: Snapshot<any>;
            if ('then' in snapshotOrPromise2) {
                result2 = await snapshotOrPromise2;
            } else {
                result2 = await luvio.resolvePendingSnapshot(
                    snapshotOrPromise2 as PendingSnapshot<any, any>
                );
            }
            expect(result2).toEqualFulfilledSnapshotWithData(
                getRecordsResponse,
                GET_RECORDS_PRIVATE_FIELDS
            );
        });

        it('emits a value on a 400 response', async () => {
            const id1 = '001xx000003Gn4WAAS';
            const config = {
                records: [
                    {
                        recordIds: [id1],
                        optionalFields: ['Account.Id', 'Account.Name'],
                    },
                ],
            };

            let errorResponseBody = {
                hasErrors: true,
                results: [
                    {
                        result: [
                            {
                                errorCode: 'INVALID_TYPE',
                                message: 'Object UserRole is not supported in UI API',
                            },
                        ],
                        statusCode: 400,
                    },
                ],
            };

            // TODO - W-9051373 this should only hit the network once, but makeDurable.resolveUnfulfilledSnapshot
            // will call base resolveUnfulfilledSnapshot on errors... once generated
            // adapters use resolveSnapshot this should change to just return one mock response
            networkAdapter.setMockResponses([
                {
                    status: 200,
                    headers: {},
                    body: JSONStringify(errorResponseBody),
                },
                {
                    status: 200,
                    headers: {},
                    body: JSONStringify(errorResponseBody),
                },
            ]);
            // networkAdapter.setMockResponse({
            //     status: 200,
            //     headers: {},
            //     body: JSONStringify(errorResponseBody),
            // });

            // TODO - W-9051409 we don't need to check for Promises once custom adapters
            // are updated to not use resolveUnfulfilledSnapshot
            const snapshotOrPromise = getRecords(config)!;
            let result: Snapshot<any>;
            if ('then' in snapshotOrPromise) {
                result = await snapshotOrPromise;
            } else {
                result = await luvio.resolvePendingSnapshot(
                    snapshotOrPromise as PendingSnapshot<any, any>
                );
            }
            expect(result).toEqualFulfilledSnapshotWithData(
                errorResponseBody,
                GET_RECORDS_PRIVATE_FIELDS
            );
        });

        it('merges fields with records in durable store', async () => {
            const id1 = '001xx000003Gn4WAAS';
            const id2 = '00122000003Gn4WBBA';
            const config = {
                records: [
                    {
                        recordIds: [id1, id2],
                        optionalFields: ['Account.Id', 'Account.Name'],
                    },
                ],
            };

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(getRecordsResponse),
            });

            const result = await getRecords(config)!;
            expect(result.state).toBe('Fulfilled');

            await flushPromises();

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(getRecordsResponseWithOwnerField),
            });

            const configWithOwnerId = {
                records: [
                    {
                        recordIds: [id1, id2],
                        optionalFields: ['Account.OwnerId'],
                    },
                ],
            };

            // make sure store is empty before second call
            (luvio as any).environment.store.reset();

            const result2 = await getRecords(configWithOwnerId)!;
            expect(result2.state).toBe('Fulfilled');

            const networkCallsBefore = networkAdapter.sentRequests.length;
            // flush everything and now make a combined request, it should service from L2
            await flushPromises();
            (luvio as any).environment.store.reset();

            const configCombined = {
                records: [
                    {
                        recordIds: [id1, id2],
                        optionalFields: ['Account.Id', 'Account.Name', 'Account.OwnerId'],
                    },
                ],
            };

            const combinedResult = await getRecords(configCombined)!;
            expect(combinedResult.state).toBe('Fulfilled');

            await flushPromises();
            const networkCallsAfter = networkAdapter.sentRequests.length;

            // no additional network calls should have been made
            expect(networkCallsBefore).toEqual(networkCallsAfter);
        });
    });
});
