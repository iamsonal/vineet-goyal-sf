import { stripProperties } from '@luvio/adapter-test-library';
import { subscribeToAdapter, OnSnapshot } from '../executeAdapter';
import { addMockNetworkResponse } from './mocks/mockNimbusNetwork';
import objectInfo_Account from './mockData/objectInfo-Account.json';

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

    it('calls getObjectInfo wire adapter', (done) => {
        // setup mock response
        addMockNetworkResponse('GET', '/services/data/v54.0/ui-api/object-info/Account', {
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

        unsubscribe();
    });

    it('calls error callback on non-2xx response', (done) => {
        // setup mock response
        addMockNetworkResponse('GET', '/services/data/v54.0/ui-api/object-info/Account', {
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

        unsubscribe();
    });
});
