import timekeeper from 'timekeeper';
import { Luvio } from '@luvio/engine';
import { customMatchers } from '@salesforce/lds-jest';

import { JSONStringify } from '../../../utils/language';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import getRecordsResponse from './data/records-multiple-Accounts-fields-Account.Id,Account.Name.json';
import getRecordsResponseWithOwnerField from './data/records-multiple-Accounts-fields-Account.OwnerId.json';
import { flushPromises } from '../../testUtils';
import { resetLuvioStore, setup } from './integrationTestSetup';
import { MockNimbusDurableStore } from '../../MockNimbusDurableStore';
import mockResponseWithMissingOptionalFields from './data/records-multiple-Accounts-MissingOptionalFields.json';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';

const RECORD_TTL = 30000;
const GET_RECORDS_PRIVATE_FIELDS = ['eTag', 'weakEtag', 'hasErrors'];

// add toEqualFulfilledSnapshotWithData custom matcher
expect.extend(customMatchers);

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let networkAdapter: MockNimbusNetworkAdapter;
    let durableStore: MockNimbusDurableStore;
    let getRecords;
    let createRecord;

    beforeEach(async () => {
        ({ luvio, networkAdapter, durableStore, getRecords, createRecord } = await setup());
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

            const result = await getRecords(config)!;

            expect(result.state).toBe('Fulfilled');
            expect(result.data.results[0].result.id).toBe(id1);
            expect(durableStore).toBeDefined();

            await resetLuvioStore();

            timekeeper.travel(Date.now() + RECORD_TTL + 1);

            const result2 = await getRecords(config)!;

            expect(result2).toEqualStaleSnapshotWithData(
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

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(errorResponseBody),
            });

            const result = await getRecords(config)!;

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

        it('should be fulfilled with missing optional fields', async () => {
            const config = {
                records: [
                    {
                        recordIds: ['001x0000004ckZXAAY'],
                        optionalFields: ['Account.Name'],
                    },
                    {
                        recordIds: ['02ix000000CG4h1AAD', '02ix000000CG4h1AAE'],
                        optionalFields: ['Asset.Id', 'Asset.ContactId'],
                    },
                ],
            };

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockResponseWithMissingOptionalFields),
            });

            const originalResult = await getRecords(config)!;
            expect(originalResult.state).toBe('Fulfilled');

            await resetLuvioStore();

            const durableResult = await getRecords(config)!;
            expect(durableResult.state).toBe('Fulfilled');
        });

        it('resolves with a mix of draft ids and server ids', async () => {
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

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });

            const draft = (
                await createRecord({
                    apiName: 'Account',
                    fields: { Name: 'I am a poor draft' },
                })
            ).data;

            await flushPromises();
            await resetLuvioStore();

            const configWithDraft = {
                records: [
                    {
                        recordIds: [id1, id2, draft.id],
                        optionalFields: ['Account.Id', 'Account.Name'],
                    },
                ],
            };

            const resultWithDraft = await getRecords(configWithDraft)!;

            expect(resultWithDraft.state).toBe('Fulfilled');
        });

        it('stale becomes unstale after refresh', async () => {
            const id1 = '001xx000003Gn4WAAS';
            const id2 = '00122000003Gn4WBBA';
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(getRecordsResponse),
            });

            const config = {
                records: [
                    {
                        recordIds: [id1, id2],
                        optionalFields: ['Account.Id', 'Account.Name'],
                    },
                ],
            };

            const networkSpy = jest.spyOn(networkAdapter, 'sendRequest');

            let snapshot = await getRecords(config);

            expect(snapshot.state).toBe('Fulfilled');

            const subscriptionSpy = jest.fn();
            luvio.storeSubscribe(snapshot, subscriptionSpy);

            timekeeper.travel(Date.now() + 30000 + 1);

            await flushPromises();

            // Set the mock response for a refresh
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(getRecordsResponse),
            });

            snapshot = await getRecords(config);

            expect(snapshot.state).toBe('Stale');

            await flushPromises();

            expect(networkSpy).toBeCalledTimes(2);

            snapshot = await getRecords(config);

            expect(snapshot.state).toBe('Fulfilled');

            expect(networkSpy).toBeCalledTimes(2);

            // ingestion response was the same so broadcast should not emit to
            // subscription
            expect(subscriptionSpy).toHaveBeenCalledTimes(0);
        });
    });
});
