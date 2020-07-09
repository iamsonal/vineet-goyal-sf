import {
    DurableStore,
    DurableStoreFetchResult,
    DurableStoreEntries,
} from '@mobileplatform/nimbus-plugin-lds';
import { NimbusDurableStore } from '../NimbusDurableStore';
import { RecordRepresentationNormalized } from '@salesforce/lds-adapters-uiapi';

class MockNimbusDurableStore implements DurableStore {
    kvp: { [key: string]: string } = {};

    async getEntries(ids: string[]): Promise<DurableStoreFetchResult> {
        const result = {};
        let isMissingEntries = false;
        for (const id of ids) {
            const val = this.kvp[id];
            if (val === undefined) {
                isMissingEntries = true;
            } else {
                result[id] = val;
            }
        }

        return {
            entries: result,
            isMissingEntries,
        };
    }

    setEntries(entries: DurableStoreEntries): Promise<void> {
        Object.assign(this.kvp, entries);
        return Promise.resolve();
    }
    evictEntries(ids: string[]): Promise<void> {
        for (const id of ids) {
            delete this.kvp[id];
        }
        return Promise.resolve();
    }
}

function mockNimbusStore(mockNimbusStore: MockNimbusDurableStore) {
    global.__nimbus = {
        plugins: {
            LdsDurableStore: mockNimbusStore,
        },
    } as any;
}
function resetNimbusStore() {
    global.__nimbus = undefined;
}
describe('nimbus durable store tests', () => {
    afterEach(() => {
        resetNimbusStore();
    });
    it('should filter out pending record fields', () => {
        const durableStore = new MockNimbusDurableStore();
        const key = 'UiApi::RecordRepresentation:foo';
        const nameKey = 'UiApi:RecordRepresentation:foo__fields_Name';
        mockNimbusStore(durableStore);
        const nimbusStore = new NimbusDurableStore();
        nimbusStore.setEntries({
            [key]: {
                data: {
                    id: 'foo',
                    fields: {
                        Name: {
                            __ref: nameKey,
                        },
                        Birthday: {
                            pending: true,
                        },
                    },
                },
            },
        });

        const data = durableStore.kvp[key];
        const entry = JSON.parse(data);
        const record = entry.data as RecordRepresentationNormalized;
        expect(record.fields['Name'].__ref).toBe(nameKey);
        expect(record.fields['Birthday']).toBeUndefined();
    });

    it('should not mutate entry', () => {
        const durableStore = new MockNimbusDurableStore();
        const key = 'UiApi::RecordRepresentation:foo';
        const nameKey = 'UiApi:RecordRepresentation:foo__fields_Name';
        mockNimbusStore(durableStore);
        const nimbusStore = new NimbusDurableStore();
        const data = {
            id: 'foo',
            fields: {
                Name: {
                    __ref: nameKey,
                },
                Birthday: {
                    pending: true,
                },
            },
        };
        nimbusStore.setEntries({
            [key]: {
                data,
            },
        });

        expect(data.fields.Birthday).toBeDefined();
        expect(data.fields.Birthday.pending).toBe(true);
    });
});
