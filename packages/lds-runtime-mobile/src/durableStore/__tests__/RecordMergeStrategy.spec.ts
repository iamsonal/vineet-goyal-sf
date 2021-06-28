import { MockDurableStore } from '@luvio/adapter-test-library';
import { DefaultDurableSegment } from '@luvio/environments';
import { ObjectKeys } from '../../utils/language';
import { flushPromises } from '../../__tests__/testUtils';
import { makeDurableStoreWithMergeStrategy } from '../makeDurableStoreWithMergeStrategy';
import { RecordMergeStrategy } from '../RecordMergeStrategy';

describe('RecordMergeStrategy tests', () => {
    const RECORD_ID = 'UiApi::RecordRepresentation:foo';
    const RECORD_WITH_NAME = {
        'UiApi::RecordRepresentation:foo': {
            data: {
                id: 'foo',
                apiName: 'Account',
                fields: {
                    Name: { value: 'Justin', displayValue: 'Justin' },
                },
                links: {},
            },
        },
    };

    const RECORD_WITH_NAME_DRAFT = {
        'UiApi::RecordRepresentation:foo': {
            data: {
                id: 'foo',
                apiName: 'Account',
                fields: {
                    Name: { value: 'Justin', displayValue: 'Justin' },
                },
                drafts: {
                    serverValues: {
                        Name: { value: 'Jason', displayValue: 'Jason' },
                    },
                    created: false,
                    edited: true,
                    deleted: false,
                    draftActionIds: ['foo'],
                },
                links: {},
            },
        },
    };

    const RECORD_WITH_BIRTHDAY = {
        'UiApi::RecordRepresentation:foo': {
            data: {
                id: 'foo',
                apiName: 'Account',
                fields: {
                    Birthday: { value: '1', displayValue: '1' },
                },
                links: {},
            },
        },
    };

    const RECORD_WITH_NAME_BIRTHDAY = {
        'UiApi::RecordRepresentation:foo': {
            data: {
                id: 'foo',
                apiName: 'Account',
                fields: {
                    Name: { value: 'Justin', displayValue: 'Justin' },
                    Birthday: { value: '1', displayValue: '1' },
                },
                links: {},
            },
        },
    };
    const RECORD_WITH_NAME_COLOR = {
        'UiApi::RecordRepresentation:foo': {
            data: {
                id: 'foo',
                apiName: 'Account',
                fields: {
                    Name: { value: 'Justin', displayValue: 'Justin' },
                    Color: { value: 'Blue', displayValue: 'Blue' },
                },
                links: {},
            },
        },
    };

    const NON_RECORD = {
        'UiApi::NotARecord:foo': {
            data: {
                foo: 'v1',
            },
        },
    };

    const NON_RECORD_UPDATED = {
        'UiApi::NotARecord:foo': {
            data: {
                foo: 'v2',
            },
        },
    };

    function setup() {
        const baseDurableStore = new MockDurableStore();

        const getActionsForTags = jest.fn().mockResolvedValue({});
        const mockGetRecord = jest.fn();
        const mockUserId = '';
        const mergeStrategy = new RecordMergeStrategy(
            baseDurableStore,
            getActionsForTags,
            mockGetRecord,
            mockUserId
        );
        const durableStore = makeDurableStoreWithMergeStrategy(baseDurableStore);
        durableStore.registerMergeStrategy(mergeStrategy);

        return {
            baseDurableStore,
            durableStore,
            mockGetRecord,
            mockUserId,
            mergeStrategy,
            getActionsForTags,
        };
    }
    it('non records are not merged', async () => {
        const durableStore = new MockDurableStore();
        const existing = { ...NON_RECORD };
        const incoming = { ...NON_RECORD_UPDATED };

        durableStore.segments[DefaultDurableSegment] = existing;

        const getActionsForTags = jest.fn().mockResolvedValue({});
        const mockGetRecord = jest.fn();
        const mockUserId = '';
        const recordMergeStrategy = new RecordMergeStrategy(
            durableStore,
            getActionsForTags,
            mockGetRecord,
            mockUserId
        );

        const mergeEnabled = makeDurableStoreWithMergeStrategy(durableStore);
        mergeEnabled.registerMergeStrategy(recordMergeStrategy);

        await mergeEnabled.setEntries(incoming, DefaultDurableSegment);
        expect(durableStore.segments[DefaultDurableSegment]).toEqual(incoming);
    });

    it('non existant entry gets written over', async () => {
        const { durableStore, baseDurableStore } = setup();

        durableStore.setEntries(RECORD_WITH_NAME, DefaultDurableSegment);
        await flushPromises();
        const result = baseDurableStore.segments[DefaultDurableSegment][RECORD_ID].data as any;
        expect(ObjectKeys(result.fields)).toEqual(['Name']);
    });

    it('concurrent merges are queued', async () => {
        const { durableStore, baseDurableStore } = setup();
        baseDurableStore.segments[DefaultDurableSegment] = { ...RECORD_WITH_NAME };

        durableStore.setEntries({ ...RECORD_WITH_NAME_COLOR }, DefaultDurableSegment);
        durableStore.setEntries({ ...RECORD_WITH_NAME_BIRTHDAY }, DefaultDurableSegment);
        await flushPromises();
        const result = baseDurableStore.segments[DefaultDurableSegment][RECORD_ID].data as any;
        expect(ObjectKeys(result.fields)).toEqual(['Name', 'Birthday', 'Color']);
    });

    it('records mixed with non records get merged', async () => {
        const { durableStore, baseDurableStore } = setup();
        const existing = { ...NON_RECORD, ...RECORD_WITH_NAME };
        const incoming = { ...NON_RECORD_UPDATED, ...RECORD_WITH_BIRTHDAY };
        const expected = { ...NON_RECORD_UPDATED, ...RECORD_WITH_NAME_BIRTHDAY };

        baseDurableStore.segments[DefaultDurableSegment] = existing;

        await durableStore.setEntries(incoming, DefaultDurableSegment);
        expect(baseDurableStore.segments[DefaultDurableSegment]).toEqual(expected);
    });

    it('requests drafts if an existing record contains drafts', async () => {
        const { durableStore, baseDurableStore, getActionsForTags } = setup();
        baseDurableStore.segments[DefaultDurableSegment] = { ...RECORD_WITH_NAME_DRAFT };

        durableStore.setEntries({ ...RECORD_WITH_NAME_COLOR }, DefaultDurableSegment);
        await flushPromises();
        expect(getActionsForTags).toHaveBeenCalledTimes(1);
    });

    it('requests drafts if an incoming record contains drafts', async () => {
        const { durableStore, baseDurableStore, getActionsForTags } = setup();
        baseDurableStore.segments[DefaultDurableSegment] = { ...RECORD_WITH_NAME };

        durableStore.setEntries({ ...RECORD_WITH_NAME_DRAFT }, DefaultDurableSegment);
        await flushPromises();
        expect(getActionsForTags).toHaveBeenCalledTimes(1);
    });
    it('does not request drafts if neither incoming or existing contains drafts', async () => {
        const { durableStore, baseDurableStore, getActionsForTags } = setup();
        baseDurableStore.segments[DefaultDurableSegment] = { ...RECORD_WITH_NAME };

        durableStore.setEntries({ ...RECORD_WITH_NAME_COLOR }, DefaultDurableSegment);
        await flushPromises();
        expect(getActionsForTags).toHaveBeenCalledTimes(0);
    });
});
