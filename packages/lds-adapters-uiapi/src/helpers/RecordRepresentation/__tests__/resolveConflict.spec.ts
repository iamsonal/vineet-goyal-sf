import { Environment, LDS, Store } from '@ldsjs/engine';
import { buildNetworkSnapshot as getRecordNetwork } from '../../../wire/getRecord/GetRecordFields';
import { buildNetworkSnapshot as getRecordsNetwork } from '../../../generated/adapters/getRecords';
import { resolveConflict } from '../resolveConflict';

jest.mock('../../../wire/getRecord/GetRecordFields', () => {
    return {
        buildNetworkSnapshot: jest.fn(),
    };
});

jest.mock('../../../generated/adapters/getRecords', () => {
    return {
        buildNetworkSnapshot: jest.fn(),
    };
});

const trie1 = {
    name: 'a',
    children: {
        b: {
            name: 'b',
            children: {},
        },
        c: {
            name: 'c',
            children: {},
        },
    },
};

const trie2 = {
    name: 'test2',
    children: {
        alex: {
            name: 'alex',
            children: {},
        },
        ben: {
            name: 'ben',
            children: {},
        },
        han: {
            name: 'han',
            children: {},
        },
    },
};

describe('resolve conflict ', () => {
    it('returns void', () => {
        const mockLDS = new LDS(new Environment(new Store(), jest.fn()));
        expect(resolveConflict(mockLDS, {})).toBe(undefined);
    });
    it('makes no network call when there is no conflict', () => {
        const mockLDS = new LDS(new Environment(new Store(), jest.fn()));
        const singleRecordConflictMap = {};
        resolveConflict(mockLDS, singleRecordConflictMap);
        return Promise.resolve().then(() => {
            expect(getRecordNetwork).not.toHaveBeenCalled();
            expect(getRecordsNetwork).not.toHaveBeenCalled();
        });
    });
    it('calls getRecordNetwork when a single record exists in recordConflictMap', () => {
        const mockLDS = new LDS(new Environment(new Store(), jest.fn()));
        const singleRecordConflictMap = {
            a: { recordId: 'a', trackedFields: trie1 },
        };
        const mockConfig = { recordId: 'a', optionalFields: ['a.b', 'a.c'] };
        resolveConflict(mockLDS, singleRecordConflictMap);
        return Promise.resolve().then(() => {
            expect(getRecordNetwork).toHaveBeenCalledWith(mockLDS, mockConfig);
        });
    });
    it('calls getRecordsNetwork when multiple records exist in recordConflictMap', () => {
        const mockLDS = new LDS(new Environment(new Store(), jest.fn()));
        const singleRecordConflictMap = {
            a: { recordId: 'a', trackedFields: trie1 },
            test2: { recordId: 'test2', trackedFields: trie2 },
        };
        const mockConfig = {
            records: [
                { recordIds: ['a'], optionalFields: ['a.b', 'a.c'] },
                { recordIds: ['test2'], optionalFields: ['test2.alex', 'test2.ben', 'test2.han'] },
            ],
        };
        resolveConflict(mockLDS, singleRecordConflictMap);
        return Promise.resolve().then(() => {
            expect(getRecordsNetwork).toHaveBeenCalledWith(mockLDS, mockConfig);
        });
    });
});
