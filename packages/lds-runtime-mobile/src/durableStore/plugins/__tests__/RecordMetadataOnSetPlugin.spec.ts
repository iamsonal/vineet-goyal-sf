import { DefaultDurableSegment, DurableStoreEntries } from '@luvio/environments';
import { RecordMetadataOnSetPlugin } from '../../plugins/RecordMetadataOnSetPlugin';

const mockEnsureObjectInfoCached = jest
    .fn()
    .mockName('mockEnsureObjectInfoCached')
    .mockResolvedValue(() => {});

describe('RecordMetadataOnSetPlugin', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('beforeSet', () => {
        it('calls to fetch object info if is RecordRepresentation type', async () => {
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);
            const key = 'UiApi::RecordRepresentation:001234';
            const entries: DurableStoreEntries<unknown> = {
                [key]: {
                    data: { apiName: 'mockApiName' },
                },
            };
            await subject.beforeSet(key, entries[key], DefaultDurableSegment);
            expect(mockEnsureObjectInfoCached).toBeCalledTimes(1);
            expect(mockEnsureObjectInfoCached).toBeCalledWith('mockApiName');
        });

        it('does not call to fetch object info if is not RecordRepresentation type', async () => {
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);

            const key = 'UiApi::SomeOtherRepresentation:123asdf';
            const entries: DurableStoreEntries<unknown> = {
                [key]: {
                    data: {},
                },
            };
            await subject.beforeSet(key, entries[key], DefaultDurableSegment);
            expect(mockEnsureObjectInfoCached).toBeCalledTimes(0);
        });

        it('does not call to fetch object info RecordRepresentation is field value', async () => {
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);

            const key = 'UiApi::RecordRepresentation:001234__fields__';
            const entries: DurableStoreEntries<unknown> = {
                [key]: {
                    data: { apiName: 'mockApiName' },
                },
            };
            await subject.beforeSet(key, entries[key], DefaultDurableSegment);
            expect(mockEnsureObjectInfoCached).toBeCalledTimes(0);
        });

        it('does not call to fetch object info if segment is not default', async () => {
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);
            const entries: DurableStoreEntries<any> = {
                one: { data: { apiName: 'mockApiName', id: '1234', eTag: '' } },
            };
            await subject.beforeSet('one', entries['one'], 'DRAFTS');
            expect(mockEnsureObjectInfoCached).toBeCalledTimes(0);
        });

        it('calls ensureObjectInfo when record is ObjectInfoRepresentation', async () => {
            // Arrange
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);
            const key = 'UiApi::ObjectInfoRepresentation:mockApiName';
            const entries: DurableStoreEntries<any> = {
                [key]: {
                    data: {
                        apiName: 'mockApiName',
                        keyPrefix: '001',
                    },
                },
            };

            // Act
            await subject.beforeSet(key, entries[key], 'DEFAULT');

            // Assert
            expect(mockEnsureObjectInfoCached).toBeCalledTimes(1);
            expect(mockEnsureObjectInfoCached).toBeCalledWith('mockApiName', entries[key].data);
        });
    });

    describe('isEntryObjectInfoRepresentation', () => {
        it('should return true when entry is ObjectInfo', () => {
            // Arrange
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);
            const key = 'UiApi::ObjectInfoRepresentation:one';
            const entry = {
                data: {
                    apiName: 'mockApiName',
                    keyPrefix: '001',
                },
            };

            // Act
            const isObjectInfo = subject.isEntryObjectInfoRepresentation(entry, key);

            // Assert
            expect(isObjectInfo).toBe(true);
        });

        it('should return false when key does not have the right prefix', () => {
            // Arrange
            const subject = new RecordMetadataOnSetPlugin(mockEnsureObjectInfoCached);
            const key = 'one';
            const entry = {
                data: {
                    apiName: 'mockApiName',
                    keyPrefix: '001',
                },
            };

            // Act
            const isObjectInfo = subject.isEntryObjectInfoRepresentation(entry, key);

            // Assert
            expect(isObjectInfo).toBe(false);
        });
    });
});
