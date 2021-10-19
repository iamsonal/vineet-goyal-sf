import { stripProperties } from '@luvio/adapter-test-library';
import { subscribeToAdapter, OnSnapshot } from '../executeAdapter';
import { addMockNetworkResponse } from './mocks/mockNimbusNetwork';
import { objectInfoAccountPath, recordEndpointPath } from './urlPaths';
import { flushPromises } from './utils';

import objectInfo_Account from './mockData/objectInfo-Account.json';
import recordRep_Account from './mockData/RecordRepresentation-Account.json';

describe('subscribeToAdapter', () => {
    it('to not throw on expected adapters', () => {
        const adapterNames = [
            'getRecord',
            'getRecords',
            'getRelatedListRecords',
            'getObjectInfo',
            'getListUi',
            'getRecordAvatars',
            'getRecordActions',
            'getLookupRecords',
        ];
        const onSnapshot: OnSnapshot = jest.fn();

        adapterNames.forEach((adapterName) => {
            expect(() =>
                subscribeToAdapter(adapterName, JSON.stringify({}), onSnapshot)
            ).not.toThrowError(`adapter ${adapterName} not recognized`);
        });
    });

    it('throws on missing adapter', () => {
        const onSnapshot: OnSnapshot = jest.fn();

        const missingAdapterName = 'missingAdapter123';

        expect(() =>
            subscribeToAdapter(missingAdapterName, JSON.stringify({}), onSnapshot)
        ).toThrowError(`adapter ${missingAdapterName} not recognized`);
    });

    it('throws when DML adapter called', () => {
        expect(() => subscribeToAdapter('updateRecord', '', jest.fn())).toThrowError(
            'updateRecord is not a GET wire adapter.'
        );
    });

    it('calls getObjectInfo wire adapter', async (done) => {
        // setup mock response
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 200,
            body: JSON.stringify(objectInfo_Account),
        });

        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(data).toEqual(stripProperties(objectInfo_Account, ['eTag']));
            expect(error).toBeUndefined();
            done();
        };

        const unsubscribe = subscribeToAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            onSnapshot
        );
        await flushPromises();
        unsubscribe();
    });

    it('calls getRecord wire adapter', async (done) => {
        // setup mock response
        addMockNetworkResponse('GET', recordEndpointPath(recordRep_Account.id), {
            headers: {},
            status: 200,
            body: JSON.stringify(recordRep_Account),
        });

        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(data).toEqual(stripProperties(recordRep_Account, ['eTag', 'weakEtag']));
            expect(error).toBeUndefined();
            done();
        };

        const unsubscribe = subscribeToAdapter(
            'getRecord',
            JSON.stringify({
                recordId: recordRep_Account.id,
                fields: [
                    'Account.CreatedBy.Id',
                    'Account.CreatedBy.Name',
                    'Account.LastModifiedBy.Id',
                    'Account.LastModifiedBy.Name',
                    'Account.Owner.Id',
                    'Account.Owner.Name',
                    'Account.Name',
                ],
            }),
            onSnapshot
        );
        await flushPromises();
        unsubscribe();
    });

    it('calls error callback on non-2xx response', async (done) => {
        // setup mock response
        addMockNetworkResponse('GET', objectInfoAccountPath(), {
            headers: {},
            status: 400,
            body: JSON.stringify({}),
        });

        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(error).toEqual({
                status: 400,
                statusText: 'Bad Request',
                body: {},
                headers: {},
                ok: false,
            });
            expect(data).toBeUndefined();
            done();
        };

        const unsubscribe = subscribeToAdapter(
            'getObjectInfo',
            JSON.stringify({ objectApiName: 'Account' }),
            onSnapshot
        );

        await flushPromises();
        unsubscribe();
    });
});
