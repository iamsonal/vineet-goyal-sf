import { Adapter, FulfilledSnapshot } from '@luvio/engine';
import { DurableStore } from '@luvio/environments';
import { ObjectInfoRepresentation } from '@salesforce/lds-adapters-uiapi';
import { GetObjectInfoConfig } from '@salesforce/lds-adapters-uiapi/dist/types/src/generated/adapters/getObjectInfo';
import {
    objectInfoServiceFactory,
    OBJECT_INFO_PREFIX_SEGMENT,
} from '../../utils/ObjectInfoService';

const info: ObjectInfoRepresentation = {
    apiName: 'Account',
    keyPrefix: '001',
};

function buildMockDurableStore(): DurableStore {
    return {
        setEntries: jest.fn(),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
        batchOperations: jest.fn(),
    };
}

describe('ObjectInfoService', () => {
    let getObjectInfo: Adapter<GetObjectInfoConfig, ObjectInfoRepresentation>;
    let durableStore: DurableStore;

    beforeEach(() => {
        durableStore = buildMockDurableStore();
        durableStore.getAllEntries = jest.fn().mockResolvedValue({
            Account: { data: { apiName: 'Account', keyPrefix: '001' } },
        });

        let snapshot: FulfilledSnapshot<ObjectInfoRepresentation, {}> = {
            data: info,
            recordId: '000',
            select: null,
        };
        getObjectInfo = jest.fn().mockResolvedValue(snapshot);
    });

    afterEach(() => {
        durableStore = undefined;
        getObjectInfo = undefined;
    });

    describe('apiNameForPrefix', () => {
        it('returns apiName info for a given prefix', async () => {
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await expect(subject.apiNameForPrefix('001')).resolves.toEqual(info.apiName);
        });

        it('throws error if prefix is not found', async () => {
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await expect(subject.apiNameForPrefix('000')).rejects.toThrowError(
                'ObjectInfo for 000 is not primed into the durable store'
            );
        });
    });

    describe('prefixForApiName', () => {
        it('returns the prefix for a found apiName', async () => {
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await expect(subject.prefixForApiName('Account')).resolves.toEqual(info.keyPrefix);
        });

        it('throws error if apiName is not found', async () => {
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await expect(subject.prefixForApiName('000')).rejects.toThrowError(
                'ObjectInfo for 000 is not primed into the durable store'
            );
        });
    });

    describe('ensureObjectInfoCached', () => {
        it('sets entity in the durable store', async () => {
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await subject.ensureObjectInfoCached('Account');
            expect(durableStore.setEntries).toBeCalledWith(
                {
                    Account: {
                        data: {
                            apiName: 'Account',
                            keyPrefix: '001',
                        },
                    },
                },
                OBJECT_INFO_PREFIX_SEGMENT
            );
        });

        it('doesnt set entity in the durable store when cached already', async () => {
            durableStore.getEntries = jest.fn().mockResolvedValue({
                Account: {
                    data: {
                        apiName: 'Account',
                        keyPrefix: '001',
                    },
                },
            });
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await subject.ensureObjectInfoCached('Account');
            expect(durableStore.setEntries).toBeCalledTimes(0);
        });

        it('gets error forwarded from setEntries', async () => {
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            durableStore.setEntries = jest.fn().mockRejectedValue(new Error('mock error'));
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await expect(subject.ensureObjectInfoCached('Account')).rejects.toThrowError(
                'mock error'
            );
        });

        it('throws error if snapshot is null', async () => {
            getObjectInfo = jest.fn().mockResolvedValue(null);
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const subject = objectInfoServiceFactory(getObjectInfo, durableStore);
            await expect(subject.ensureObjectInfoCached('Account')).rejects.toThrowError(
                'No snapshot found for apiName Account'
            );
        });
    });
});
