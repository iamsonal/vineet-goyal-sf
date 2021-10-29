import { MockDurableStore } from '@luvio/adapter-test-library';
import {
    DefaultDurableSegment,
    DurableStoreEntries,
    DurableStoreOperationType,
    makeDurable,
    makeOffline,
} from '@luvio/environments';
import { flushPromises } from '../../__tests__/testUtils';
import { makePluginEnabledDurableStore } from '../makePluginEnabledDurableStore';
import { RecordMetadataOnSetPlugin } from '../plugins/RecordMetadataOnSetPlugin';
import { ObjectInfoService } from '../../utils/ObjectInfoService';
import { DurableStoreSetEntryPlugin } from '../plugins/DurableStorePlugins';
import {
    ObjectInfoRepresentation,
    RecordRepresentation,
} from '../../../../lds-adapters-uiapi/dist/types/src/main';
import { RECORD_ID_PREFIX } from '@salesforce/lds-uiapi-record-utils';
import { getObjectInfoAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import { Luvio, Environment, Store, FetchResponse, HttpStatusCode } from '@luvio/engine';

describe('makePluginEnableDurableStore tests', () => {
    const cases = [
        [
            'setEntries',
            (durableStore, key, segment) =>
                durableStore.setEntries({ [key]: { data: {} } }, segment),
        ],
        [
            'batchOperations',
            (durableStore, key, segment) =>
                durableStore.batchOperations([
                    {
                        entries: { [key]: { data: {} } },
                        segment,
                        type: DurableStoreOperationType.SetEntries,
                    },
                ]),
        ],
    ] as any[]; // TS complains on the it.each line if we don't cast

    it.each(cases)('%s calls registered plugins', async (_name, func) => {
        const durableStore = new MockDurableStore();
        const beforeSetSpy = jest.fn();
        const pluginEnabled = makePluginEnabledDurableStore(durableStore);
        pluginEnabled.registerPlugins([
            {
                beforeSet: beforeSetSpy,
            },
        ]);
        const key = 'key';
        func(pluginEnabled, key, DefaultDurableSegment);
        await flushPromises();
        expect(beforeSetSpy).toBeCalledTimes(1);
        expect(beforeSetSpy.mock.calls[0][0]).toBe(key);
        expect(beforeSetSpy.mock.calls[0][2]).toBe(DefaultDurableSegment);
    });

    it.each(cases)('%s works on non default segments', async (_name, func) => {
        const durableStore = new MockDurableStore();
        const beforeSetSpy = jest.fn();
        const pluginEnabled = makePluginEnabledDurableStore(durableStore);
        pluginEnabled.registerPlugins([
            {
                beforeSet: beforeSetSpy,
            },
        ]);
        const key = 'key';
        func(pluginEnabled, key, 'RANDOM');
        await flushPromises();
        expect(beforeSetSpy).toBeCalledTimes(1);
        expect(beforeSetSpy.mock.calls[0][0]).toBe(key);
        expect(beforeSetSpy.mock.calls[0][2]).toBe('RANDOM');
    });

    describe('setEntries', () => {
        it('only sends one request to the network from multiple entries', async () => {
            const baseDurableStore = new MockDurableStore();
            const response: FetchResponse<ObjectInfoRepresentation> = {
                status: HttpStatusCode.Ok,
                body: {
                    childRelationships: [],
                    createable: false,
                    custom: false,
                    deletable: true,
                    defaultRecordTypeId: '',
                    dependentFields: {},
                    eTag: '123',
                    feedEnabled: true,
                    fields: {},
                    apiName: 'Account',
                    associateEntityType: null,
                    associateParentEntity: null,
                    keyPrefix: '001',
                    label: 'Account',
                    labelPlural: 'Accounts',
                    layoutable: true,
                    mruEnabled: true,
                    nameFields: ['Name'],
                    queryable: true,
                    recordTypeInfos: {
                        '012000000000000AAA': {
                            available: true,
                            defaultRecordTypeMapping: true,
                            master: true,
                            name: 'Master',
                            recordTypeId: '012000000000000AAA',
                        },
                    },
                    searchable: true,
                    themeInfo: {
                        color: '7F8DE1',
                        iconUrl:
                            'https://miso-rockaway-6893-dev-ed.my.localhost.sfdcdev.salesforce.com:6101/img/icon/t4v35/standard/account_120.png',
                    },
                    updateable: true,
                },
                statusText: 'OK',
                ok: true,
                headers: {},
            };
            const networkAdapter = jest.fn().mockResolvedValue(response);
            const store = new Store();
            const env = makeDurable(makeOffline(new Environment(store, networkAdapter)), {
                durableStore: baseDurableStore,
            });
            const luvio = new Luvio(env);
            const getObjectInfoAdapter = getObjectInfoAdapterFactory(luvio);
            const objectInfoService = new ObjectInfoService(getObjectInfoAdapter, baseDurableStore);
            const ensureSpy = jest.spyOn(objectInfoService, 'ensureObjectInfoCached');
            const plugin = new RecordMetadataOnSetPlugin(objectInfoService.ensureObjectInfoCached);

            const durableStore = makePluginEnabledDurableStore(baseDurableStore);
            durableStore.registerPlugins([plugin as DurableStoreSetEntryPlugin]);

            durableStore.setEntries(
                {
                    [`${RECORD_ID_PREFIX}asd1`]: { data: { apiName: 'Account' } },
                } as DurableStoreEntries<Partial<RecordRepresentation>>,
                'DEFAULT'
            );
            durableStore.setEntries(
                {
                    [`${RECORD_ID_PREFIX}asd2`]: { data: { apiName: 'Account' } },
                } as DurableStoreEntries<Partial<RecordRepresentation>>,
                'DEFAULT'
            );
            durableStore.setEntries(
                {
                    [`${RECORD_ID_PREFIX}asd3`]: { data: { apiName: 'Account' } },
                } as DurableStoreEntries<Partial<RecordRepresentation>>,
                'DEFAULT'
            );
            await flushPromises();

            expect(ensureSpy).toBeCalledTimes(1);
            expect(networkAdapter).toBeCalledTimes(1);
        });
    });

    describe('batchOperations', () => {
        it('only sends one request to the network for multiple sets in batch operation', async () => {
            const baseDurableStore = new MockDurableStore();
            const response: FetchResponse<ObjectInfoRepresentation> = {
                status: HttpStatusCode.Ok,
                body: {
                    childRelationships: [],
                    createable: false,
                    custom: false,
                    deletable: true,
                    defaultRecordTypeId: '',
                    dependentFields: {},
                    eTag: '123',
                    feedEnabled: true,
                    fields: {},
                    apiName: 'Account',
                    associateEntityType: null,
                    associateParentEntity: null,
                    keyPrefix: '001',
                    label: 'Account',
                    labelPlural: 'Accounts',
                    layoutable: true,
                    mruEnabled: true,
                    nameFields: ['Name'],
                    queryable: true,
                    recordTypeInfos: {
                        '012000000000000AAA': {
                            available: true,
                            defaultRecordTypeMapping: true,
                            master: true,
                            name: 'Master',
                            recordTypeId: '012000000000000AAA',
                        },
                    },
                    searchable: true,
                    themeInfo: {
                        color: '7F8DE1',
                        iconUrl:
                            'https://miso-rockaway-6893-dev-ed.my.localhost.sfdcdev.salesforce.com:6101/img/icon/t4v35/standard/account_120.png',
                    },
                    updateable: true,
                },
                statusText: 'OK',
                ok: true,
                headers: {},
            };
            const networkAdapter = jest.fn().mockResolvedValue(response);
            const store = new Store();
            const env = makeDurable(makeOffline(new Environment(store, networkAdapter)), {
                durableStore: baseDurableStore,
            });
            const luvio = new Luvio(env);
            const getObjectInfoAdapter = getObjectInfoAdapterFactory(luvio);
            const objectInfoService = new ObjectInfoService(getObjectInfoAdapter, baseDurableStore);
            const ensureSpy = jest.spyOn(objectInfoService, 'ensureObjectInfoCached');
            const plugin = new RecordMetadataOnSetPlugin(objectInfoService.ensureObjectInfoCached);

            const durableStore = makePluginEnabledDurableStore(baseDurableStore);
            durableStore.registerPlugins([plugin as DurableStoreSetEntryPlugin]);

            durableStore.batchOperations([
                {
                    entries: {
                        [`${RECORD_ID_PREFIX}asd1`]: { data: { apiName: 'Account' } },
                    } as DurableStoreEntries<Partial<RecordRepresentation>>,
                    segment: DefaultDurableSegment,
                    type: DurableStoreOperationType.SetEntries,
                },
                {
                    entries: {
                        [`${RECORD_ID_PREFIX}asd2`]: { data: { apiName: 'Account' } },
                    } as DurableStoreEntries<Partial<RecordRepresentation>>,
                    segment: DefaultDurableSegment,
                    type: DurableStoreOperationType.SetEntries,
                },
                {
                    entries: {
                        [`${RECORD_ID_PREFIX}asd3`]: { data: { apiName: 'Account' } },
                    } as DurableStoreEntries<Partial<RecordRepresentation>>,
                    segment: DefaultDurableSegment,
                    type: DurableStoreOperationType.SetEntries,
                },
            ]);

            await flushPromises();

            expect(ensureSpy).toBeCalledTimes(1);
            expect(networkAdapter).toBeCalledTimes(1);
        });
    });
});
