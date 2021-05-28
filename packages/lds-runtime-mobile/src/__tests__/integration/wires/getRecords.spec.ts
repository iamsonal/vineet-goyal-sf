import timekeeper from 'timekeeper';
import { Luvio } from '@luvio/engine';
import { getRecordsAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '@salesforce/lds-drafts';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusNetworkAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import getRecordsResponse from './data/records-multiple-Accounts-fields-Account.Id,Account.Name.json';

const RECORD_TTL = 30000;

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

            const snapshot = await getRecords(config);
            expect(snapshot.state).toBe('Fulfilled');
            expect(snapshot.data.results[0].result.id).toBe(id1);
            expect(durableStore).toBeDefined();
            (luvio as any).environment.store.reset();

            timekeeper.travel(Date.now() + RECORD_TTL + 1);

            const snapshot2 = await getRecords(config);
            expect(snapshot2.state).toBe('Fulfilled');
            expect(snapshot2.data.results.length).toBe(2);
            expect(snapshot2.data.results[0].result.id).toBe(id1);
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

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(errorResponseBody),
            });

            const snapshot = await getRecords(config);
            expect(snapshot.state).toBe('Fulfilled');
            expect(snapshot.data.results[0]).toStrictEqual(errorResponseBody.results[0]);
        });
    });
});
