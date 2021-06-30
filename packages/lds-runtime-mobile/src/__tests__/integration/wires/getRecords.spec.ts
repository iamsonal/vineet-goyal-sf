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

const RECORD_TTL = 30000;
const GET_RECORDS_PRIVATE_FIELDS = ['eTag', 'weakEtag', 'hasErrors'];

// add toEqualFulfilledSnapshotWithData custom matcher
expect.extend(customMatchers);

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let networkAdapter: MockNimbusNetworkAdapter;
    let durableStore: MockNimbusDurableStore;
    let getRecords;

    beforeEach(async () => {
        ({ luvio, networkAdapter, durableStore, getRecords } = await setup());
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
            (luvio as any).environment.store.reset();

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

            resetLuvioStore();

            const durableResult = await getRecords(config)!;
            expect(durableResult.state).toBe('Fulfilled');
        });
    });
});
