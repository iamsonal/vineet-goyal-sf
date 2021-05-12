import { DefaultDurableSegment, DurableStoreEntries } from '@luvio/environments';
import { RecordMetadataOnSetPlugin } from '../../plugins/RecordMetadataOnSetPlugin';

describe('RecordMetadataOnSetPlugin', () => {
    describe('beforeSet', () => {
        it('calls to fetch object info if is RecordRepresentation type', async () => {
            const mockFetch: (
                apiName: string
            ) => Promise<void> = jest.fn().mockResolvedValue(() => {});
            const subject = new RecordMetadataOnSetPlugin(mockFetch);
            const key = 'UiApi::RecordRepresentation:001234';
            const entries: DurableStoreEntries<unknown> = {
                [key]: {
                    data: { apiName: 'mockApiName' },
                },
            };
            subject.beforeSet(key, entries[key], DefaultDurableSegment);
            expect(mockFetch).toBeCalledTimes(1);
            expect(mockFetch).toBeCalledWith('mockApiName');
        });

        it('does not call to fetch object info if is not RecordRepresentation type', async () => {
            const mockFetch: (
                apiName: string
            ) => Promise<void> = jest.fn().mockResolvedValue(() => {});
            const subject = new RecordMetadataOnSetPlugin(mockFetch);

            const key = 'UiApi::SomeOtherRepresentation:123asdf';
            const entries: DurableStoreEntries<unknown> = {
                [key]: {
                    data: {},
                },
            };
            subject.beforeSet(key, entries[key], DefaultDurableSegment);
            expect(mockFetch).toBeCalledTimes(0);
        });

        it('does not call to fetch object info RecordRepresentation is field value', async () => {
            const mockFetch: (
                apiName: string
            ) => Promise<void> = jest.fn().mockResolvedValue(() => {});
            const subject = new RecordMetadataOnSetPlugin(mockFetch);

            const key = 'UiApi::RecordRepresentation:001234__fields__';
            const entries: DurableStoreEntries<unknown> = {
                [key]: {
                    data: { apiName: 'mockApiName' },
                },
            };
            subject.beforeSet(key, entries[key], DefaultDurableSegment);
            expect(mockFetch).toBeCalledTimes(0);
        });

        it('does not call to fetch object info if segment is not default', async () => {
            const mockFetch: (
                apiName: string
            ) => Promise<void> = jest.fn().mockResolvedValue(() => {});
            const subject = new RecordMetadataOnSetPlugin(mockFetch);
            const entries: DurableStoreEntries<any> = {
                one: { data: { apiName: 'mockApiName', id: '1234', eTag: '' } },
            };
            subject.beforeSet('one', entries['one'], 'DRAFTS');
            expect(mockFetch).toBeCalledTimes(0);
        });
    });
});
