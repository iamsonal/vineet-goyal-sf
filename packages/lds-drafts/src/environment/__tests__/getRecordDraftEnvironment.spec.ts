import { HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { DEFAULT_NAME_FIELD_VALUE } from './test-utils';
import {
    DRAFT_RECORD_ID,
    mockDurableStoreDraftResponse,
    RECORD_ID,
    setupDraftEnvironment,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_RECORD,
} from './test-utils';

function buildRequest(id: string, fields: string[], optionalFields: string[]): ResourceRequest {
    return {
        basePath: `/ui-api/records/${id}`,
        baseUri: '',
        queryParams: {
            fields,
            optionalFields,
        },
        urlParams: {
            recordId: id,
        },
        method: 'get',
        body: undefined,
        headers: {},
    };
}

describe('draft environment tests', () => {
    describe('getRecord', () => {
        it('does not intercept record get endpoint on non-draft id', () => {
            const { draftEnvironment, network } = setupDraftEnvironment();
            draftEnvironment.dispatchResourceRequest(buildRequest(RECORD_ID, ['Account.Name'], []));
            expect(network).toBeCalledTimes(1);
        });

        it('replaces draft id with canonical id in get requests', () => {
            const { draftEnvironment, network } = setupDraftEnvironment();
            draftEnvironment.storeRedirect(STORE_KEY_DRAFT_RECORD, STORE_KEY_RECORD);
            draftEnvironment.dispatchResourceRequest(
                buildRequest(DRAFT_RECORD_ID, ['Account.Name'], [])
            );
            expect(network).toBeCalledTimes(1);
            expect(network.mock.calls[0][0].basePath).toBe(`/ui-api/records/${RECORD_ID}`);
        });

        it('returns mutable data', async () => {
            const { durableStore, draftEnvironment } = setupDraftEnvironment();
            mockDurableStoreDraftResponse(durableStore);
            const response = await draftEnvironment.dispatchResourceRequest(
                buildRequest(DRAFT_RECORD_ID, ['Account.Name'], [])
            );

            expect(response).toBeDefined();
            const record = response.body as RecordRepresentation;

            record.fields.Name.value = 'foo';

            expect(record.fields.Name.value).toBe('foo');
        });

        it('fails to get record with fields that do not exist on the synthetic record', async () => {
            const { durableStore, draftEnvironment } = setupDraftEnvironment();
            mockDurableStoreDraftResponse(durableStore);

            await expect(
                draftEnvironment.dispatchResourceRequest(
                    buildRequest(DRAFT_RECORD_ID, ['Account.Name', 'Account.Birthday'], [])
                )
            ).rejects.toMatchObject({
                status: HttpStatusCode.BadRequest,
            });
        });

        it('succeeds to get record with optionalFields that do not exist on the synthetic record', async () => {
            const { durableStore, draftEnvironment } = setupDraftEnvironment();
            mockDurableStoreDraftResponse(durableStore);
            const response = await draftEnvironment.dispatchResourceRequest(
                buildRequest(DRAFT_RECORD_ID, ['Account.Name'], ['Account.Birthday'])
            );

            expect(response).toBeDefined();
            const record = response.body as RecordRepresentation;

            expect(record.fields.Name.value).toBe(DEFAULT_NAME_FIELD_VALUE);
            expect(record.fields.Birthday).toBeUndefined();
        });
    });
});
