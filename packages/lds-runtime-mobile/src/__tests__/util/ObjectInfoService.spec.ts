import { Adapter, FulfilledSnapshot } from '@luvio/engine';
import { DurableStore } from '@luvio/environments';
import { ObjectInfoRepresentation } from '@salesforce/lds-adapters-uiapi';
import { GetObjectInfoConfig } from '@salesforce/lds-adapters-uiapi/dist/types/src/generated/adapters/getObjectInfo';
import { ObjectInfoService, OBJECT_INFO_PREFIX_SEGMENT } from '../../utils/ObjectInfoService';

const info: Partial<ObjectInfoRepresentation> = {
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
    let getObjectInfoAdapter: Adapter<GetObjectInfoConfig, ObjectInfoRepresentation>;
    let durableStore: DurableStore;

    beforeEach(() => {
        durableStore = buildMockDurableStore();
        durableStore.getAllEntries = jest.fn().mockResolvedValue({
            Account: { data: { apiName: 'Account', keyPrefix: '001' } },
        });

        let snapshot: Partial<FulfilledSnapshot<ObjectInfoRepresentation, {}>> = {
            data: info as ObjectInfoRepresentation,
            recordId: '000',
            select: null,
        };
        getObjectInfoAdapter = jest.fn().mockResolvedValue(snapshot);
    });

    afterEach(() => {
        jest.resetAllMocks();
        durableStore = undefined;
        getObjectInfoAdapter = undefined;
    });

    describe('apiNameForPrefix', () => {
        it('returns apiName info for a given prefix', async () => {
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            await expect(subject.apiNameForPrefix('001')).resolves.toEqual(info.apiName);
        });

        it('throws error if prefix is not found', async () => {
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            await expect(subject.apiNameForPrefix('000')).rejects.toThrowError(
                'ObjectInfo for 000 is not primed into the durable store'
            );
        });
    });

    describe('prefixForApiName', () => {
        it('returns the prefix for a found apiName', async () => {
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            await expect(subject.prefixForApiName('Account')).resolves.toEqual(info.keyPrefix);
        });

        it('throws error if apiName is not found', async () => {
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            await expect(subject.prefixForApiName('000')).rejects.toThrowError(
                'ObjectInfo for 000 is not primed into the durable store'
            );
        });
    });

    describe('ensureObjectInfoCached', () => {
        it('sets ObjectInfo seen in in-memory cache when ObjectInfo is fetched from Durable store', async () => {
            // Arrange
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            (durableStore.getEntries as jest.Mock).mockResolvedValueOnce({
                Account: {
                    data: {
                        apiName: 'Account',
                        keyPrefix: '001',
                    },
                },
            });

            // Act
            await subject.ensureObjectInfoCached('Account');

            // Assert
            expect(subject.objectInfoMemoryCache['Account']).toBe('001');
            expect(getObjectInfoAdapter).toBeCalledTimes(0);
            expect(durableStore.getEntries).toBeCalledTimes(1);
            expect(durableStore.getEntries).toBeCalledWith(['Account'], OBJECT_INFO_PREFIX_SEGMENT);
        });

        it('calls getObjectInfo when ObjectInfo is not available in Durable store', async () => {
            // Arrange
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            (durableStore.getEntries as jest.Mock).mockResolvedValueOnce(undefined);

            // Act
            await subject.ensureObjectInfoCached('Account');

            // Assert
            expect(getObjectInfoAdapter).toBeCalledTimes(1);
            expect(subject.objectInfoMemoryCache['Account']).toBe('001');
        });

        it('does not hit Durable store if the in-memory cache has ObjectInfo', async () => {
            // Arrange
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            subject.objectInfoMemoryCache['Account'] = '001';

            // Act
            await subject.ensureObjectInfoCached('Account');

            // Assert
            expect(getObjectInfoAdapter).toBeCalledTimes(0);
            expect(durableStore.getEntries).toBeCalledTimes(0);
        });

        it('throws error if snapshot is null', async () => {
            getObjectInfoAdapter = jest.fn().mockResolvedValue(null);
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);

            await expect(subject.ensureObjectInfoCached('Account')).rejects.toThrowError(
                'No snapshot found for apiName Account'
            );
        });

        it('should set object info mapping when durable store is missing the entry', async () => {
            // Arrange
            const objectInfo = {
                apiName: 'Account',
                keyPrefix: '001',
            };
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            const spy = jest.spyOn(subject, 'createObjectInfoMapping');
            spy.mockResolvedValue(null);
            (durableStore.getEntries as jest.Mock).mockResolvedValueOnce(undefined);

            // Act
            await subject.ensureObjectInfoCached(
                objectInfo.apiName,
                objectInfo as ObjectInfoRepresentation
            );

            // Assert
            expect(spy).toBeCalledTimes(1);
            expect(spy).toBeCalledWith('Account', objectInfo);
        });

        it('should not set object info mapping when durable store contains the entry', async () => {
            // Arrange
            const objectInfo = {
                apiName: 'Account',
                keyPrefix: '001',
            };
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            subject.createObjectInfoMapping = jest
                .fn()
                .mockName('createObjectInfoMapping')
                .mockResolvedValue(null);
            (durableStore.getEntries as jest.Mock).mockResolvedValue({
                Account: { data: objectInfo },
            });

            // Act
            await subject.ensureObjectInfoCached(
                objectInfo.apiName,
                objectInfo as ObjectInfoRepresentation
            );

            // Assert
            expect(durableStore.setEntries).toBeCalledTimes(0);
        });
    });

    describe('createObjectInfoMapping', () => {
        it('should call durable store set', async () => {
            // Arrange
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            const apiName = 'mockApiName';
            const objectInfo = {
                apiName: 'mockApiName',
                keyPrefix: '007',
            };

            // Act
            await subject.createObjectInfoMapping(apiName, objectInfo as ObjectInfoRepresentation);

            // Assert
            expect(durableStore.setEntries).toBeCalledTimes(1);
            expect(durableStore.setEntries).toBeCalledWith(
                {
                    mockApiName: {
                        data: {
                            apiName: 'mockApiName',
                            keyPrefix: '007',
                        },
                    },
                },
                'OBJECT_INFO_PREFIX_SEGMENT'
            );
        });

        it('should not call durable store set when keyPrefix is null', async () => {
            // Arrange
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            const apiName = 'mockApiName';
            const objectInfo = {
                apiName: 'mockApiName',
                keyPrefix: null,
            };

            // Act
            await subject.createObjectInfoMapping(apiName, objectInfo as ObjectInfoRepresentation);

            // Assert
            expect(durableStore.setEntries).toBeCalledTimes(0);
        });

        it('should write to durable store when keyPrefix is empty', async () => {
            // Arrange
            const subject = new ObjectInfoService(getObjectInfoAdapter, durableStore);
            const apiName = 'mockApiName';
            const objectInfo = {
                apiName: 'mockApiName',
                keyPrefix: '',
            };

            // Act
            await subject.createObjectInfoMapping(apiName, objectInfo as ObjectInfoRepresentation);

            // Assert
            expect(durableStore.setEntries).toBeCalledTimes(1);
            expect(durableStore.setEntries).toBeCalledWith(
                {
                    mockApiName: {
                        data: objectInfo,
                    },
                },
                'OBJECT_INFO_PREFIX_SEGMENT'
            );
        });
    });
});
