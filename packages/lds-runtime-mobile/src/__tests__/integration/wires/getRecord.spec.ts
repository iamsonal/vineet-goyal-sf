import { Luvio, Snapshot, HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { CompositeResponseEnvelope } from '../../../network/record-field-batching/utils';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusNetworkAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import { getRecordAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import { generateMockedRecordFields } from '../../../network/record-field-batching/__tests__/testUtils';
import { JSONStringify } from '../../../utils/language';
import { clone } from '../../testUtils';
const RECORD_ID = mockAccount.id;
const API_NAME = mockAccount.apiName;

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let networkAdapter: MockNimbusNetworkAdapter;
    let durableStore: MockNimbusDurableStore;
    let getRecord;

    beforeEach(async () => {
        durableStore = new MockNimbusDurableStore();
        mockNimbusStoreGlobal(durableStore);

        networkAdapter = new MockNimbusNetworkAdapter();
        mockNimbusNetworkGlobal(networkAdapter);

        const runtime = await import('../../../main');
        luvio = runtime.luvio;
        (luvio as any).environment.store.reset();

        getRecord = getRecordAdapterFactory(luvio);
    });
    describe('getRecord', () => {
        it('return data correctly when fields are batched', async () => {
            // mock up the network response
            const responseChunk1 = clone(mockAccount);
            delete responseChunk1.fields.Name;

            const responseChunk2 = clone(mockAccount);
            delete responseChunk2.fields.Id;

            const mockCompositeResponse: CompositeResponseEnvelope<RecordRepresentation> = {
                compositeResponse: [
                    { body: responseChunk1, httpStatusCode: HttpStatusCode.Ok },
                    { body: responseChunk2, httpStatusCode: HttpStatusCode.Ok },
                ],
            };

            // Set the mock response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockCompositeResponse),
            });

            const getRecordConfig = {
                recordId: RECORD_ID,
                optionalFields: [
                    `${API_NAME}.Id`,
                    `${API_NAME}.Name`,
                    ...generateMockedRecordFields(500).map(field => `${API_NAME}.${field}`),
                ],
            };

            const getRecordSnapshot = (await getRecord(getRecordConfig)) as Snapshot<
                RecordRepresentation
            >;

            expect(getRecordSnapshot.state).toBe('Fulfilled');
            const record = getRecordSnapshot.data;
            expect(record.fields).toEqual(mockAccount.fields);
        });
    });
});
