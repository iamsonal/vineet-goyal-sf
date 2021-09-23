import { Luvio } from '@luvio/engine';
import { getListUiAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../testUtils';
import { setup } from './integrationTestSetup';
import getListUiResponse from './data/list-ui-All-Opportunities.json';
describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let networkAdapter: MockNimbusNetworkAdapter;
    let getRecord;
    let updateRecord;

    beforeEach(async () => {
        ({ luvio, networkAdapter, updateRecord, getRecord } = await setup());
    });

    describe('getListUi', () => {
        // TODO [W-9921803]: once this work is done verify this test is working correctly
        xit('replays record drafts data on getListUi the first time it is called', async () => {
            const opp1 = getListUiResponse.records.records[0];
            networkAdapter.setMockResponses([
                {
                    status: 200,
                    headers: {},
                    body: JSON.stringify(opp1),
                },
                {
                    status: 200,
                    headers: {},
                    body: JSON.stringify(getListUiResponse),
                },
            ]);

            const fields = Object.keys(opp1.fields).map((x) => `${opp1.apiName}.${x}`);
            const record = await getRecord({
                recordId: opp1.id,
                fields: fields,
            });
            expect(record.state).toEqual('Fulfilled');

            await flushPromises();

            const testUpdate = await updateRecord({
                recordId: '006xx000001a6HmAAI',
                fields: {
                    Name: 'MOCK',
                },
            });
            expect(testUpdate.state).toEqual('Fulfilled');

            await flushPromises();

            const getListUiAdapter = getListUiAdapterFactory(luvio);

            const listSnapshot = await getListUiAdapter({
                listViewApiName: getListUiResponse.info.listReference.listViewApiName,
                objectApiName: getListUiResponse.info.listReference.objectApiName,
            });
            expect(listSnapshot.state).toEqual('Fulfilled');

            const data = listSnapshot.data as any;
            expect(data).not.toBeUndefined();
            expect(data.records.records[0].fields['Name'].value).toEqual('MOCK');

            const drafts = data.records.records[0].drafts;
            expect(drafts).not.toBeUndefined();
            expect(drafts.serverValues).toEqual({
                Name: {
                    displayValue: null,
                    value: 'Burlington Textiles Weaving Plant Generator',
                },
            });
        });
    });
});
