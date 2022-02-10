import { NimbusDurableStore } from '../NimbusDurableStore';
import {
    MockNimbusDurableStore,
    resetNimbusStoreGlobal,
    mockNimbusStoreGlobal,
} from './MockNimbusDurableStore';
import { JSONStringify } from '../utils/language';
import { DefaultDurableSegment, DurableStoreOperationType } from '@luvio/environments';
import { DurableStoreChange } from '@mobileplatform/nimbus-plugin-lds';

import { getInstrumentation } from 'o11y/client';
import { withInstrumentation } from '../utils/observability';
type Instrumentation = ReturnType<typeof getInstrumentation>;

const testSegment = 'testSegment';
describe('Nimbus durable store tests', () => {
    const recordId = 'foo';
    const recordData = { data: { bar: true } };

    afterEach(() => {
        resetNimbusStoreGlobal();
    });

    describe('Plugin signature backward compatibility', () => {
        it('should use the old setEntries if new does not exist', async () => {
            const setEntriesSpy = jest.fn().mockResolvedValue(undefined);
            const mock = { setEntriesInSegment: setEntriesSpy };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            const setData = {
                [recordId]: recordData,
            };
            await durableStore.setEntries(setData, testSegment);
            expect(setEntriesSpy).toBeCalledTimes(1);
            expect(setEntriesSpy.mock.calls[0][0]).toBeDefined();
            expect(setEntriesSpy.mock.calls[0][1]).toEqual(testSegment);
        });

        it('should call getEntriesInSegment if getEntriesInSegmentWithCallback does not exist', async () => {
            const getEntriesInSegmentSpy = jest.fn().mockResolvedValue({
                entries: { foo: JSONStringify(recordData) },
            });
            const mock = { getEntriesInSegment: getEntriesInSegmentSpy };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getEntries([recordId], DefaultDurableSegment);
            expect(getEntriesInSegmentSpy).toBeCalledTimes(1);
            expect(result[recordId]).toEqual(recordData);
        });

        it('should call getAllEntriesInSegment if getAllEntriesInSegmentWithCallback does not exist', async () => {
            const getAllEntriesInSegmentSpy = jest.fn().mockResolvedValue({
                entries: { foo: JSONStringify(recordData) },
            });
            const mock = { getAllEntriesInSegment: getAllEntriesInSegmentSpy };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getAllEntries(DefaultDurableSegment);
            expect(getAllEntriesInSegmentSpy).toBeCalledTimes(1);
            expect(result[recordId]).toEqual(recordData);
        });

        // TODO [W-10080780]: re-enable
        xit('should call getEntriesInSegmentWithCallback if both getEntriesInSegment and getEntriesInSegmentWithCallback exist', async () => {
            const resultEntries = {
                entries: { foo: JSONStringify(recordData) },
            };
            const getEntriesInSegmentSpy = jest.fn().mockResolvedValue(resultEntries);
            const getEntriesInSegmentWithCallbackSpy = jest
                .fn()
                .mockImplementation((ids, segment, onResult) => {
                    onResult(resultEntries);
                });

            const mock = {
                getEntriesInSegment: getEntriesInSegmentSpy,
                getEntriesInSegmentWithCallback: getEntriesInSegmentWithCallbackSpy,
            };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getEntries([recordId], DefaultDurableSegment);
            expect(getEntriesInSegmentSpy).toBeCalledTimes(0);
            expect(getEntriesInSegmentWithCallbackSpy).toBeCalledTimes(1);
            expect(result[recordId]).toEqual(recordData);
        });

        // TODO [W-10080780]: re-enable
        xit('should call getAllEntriesInSegmentWithCallback if both getAllEntriesInSegment and getAllEntriesInSegmentWithCallback exist', async () => {
            const resultEntries = {
                entries: { foo: JSONStringify(recordData) },
            };
            const getAllEntriesInSegmentSpy = jest.fn().mockResolvedValue(resultEntries);
            const getAllEntriesInSegmentWithCallbackSpy = jest
                .fn()
                .mockImplementation((segment, onResult) => {
                    onResult(resultEntries);
                    Promise.resolve(undefined);
                });

            const mock = {
                getAllEntriesInSegment: getAllEntriesInSegmentSpy,
                getAllEntriesInSegmentWithCallback: getAllEntriesInSegmentWithCallbackSpy,
            };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getAllEntries(DefaultDurableSegment);
            expect(getAllEntriesInSegmentSpy).toBeCalledTimes(0);
            expect(getAllEntriesInSegmentWithCallbackSpy).toBeCalledTimes(1);
            expect(result[recordId]).toEqual(recordData);
        });

        it('should use the old evictEntries if new doesnt exist', async () => {
            const evictEntriesSpy = jest.fn().mockResolvedValue(undefined);
            const mock = { evictEntriesInSegment: evictEntriesSpy };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            await durableStore.evictEntries(['1'], testSegment);
            expect(evictEntriesSpy).toBeCalledTimes(1);
            expect(evictEntriesSpy.mock.calls[0][0]).toEqual(['1']);
            expect(evictEntriesSpy.mock.calls[0][1]).toEqual(testSegment);
        });

        // TODO [W-10080780]: re-enable
        xit('should handle errors if getEntriesInSegmentWithCallback fails in the synchronous code path', async () => {
            let expectedError = new Error('it failed');
            const getEntriesInSegmentWithCallback = jest.fn().mockImplementation(() => {
                return Promise.reject(expectedError);
            });

            const mock = {
                getEntriesInSegmentWithCallback,
            };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            await expect(
                durableStore.getEntries([recordId], DefaultDurableSegment)
            ).rejects.toEqual(expectedError);
        });

        // TODO [W-10080780]: re-enable
        xit('should handle errors if getAllEntriesInSegmentWithCallback fails in the synchronous code path', async () => {
            let expectedError = new Error('it failed');
            const getAllEntriesInSegmentWithCallback = jest.fn().mockImplementation(() => {
                return Promise.reject(expectedError);
            });

            const mock = {
                getAllEntriesInSegmentWithCallback,
            };
            mockNimbusStoreGlobal(mock as any as MockNimbusDurableStore);
            const durableStore = new NimbusDurableStore();
            await expect(durableStore.getAllEntries(DefaultDurableSegment)).rejects.toEqual(
                expectedError
            );
        });
    });

    describe('GetEntries', () => {
        it('should return empty object if missing entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getEntries(['missing'], DefaultDurableSegment);
            expect(result).toEqual({});
        });
        it('should parse serialized entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();

            await nimbusStore.set(recordId, DefaultDurableSegment, recordData);
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getEntries([recordId], DefaultDurableSegment);
            const entry = result[recordId];
            expect(entry).toEqual(recordData);
            expect(entry.data['bar']).toBe(true);
        });
        it('should return partial map if missing some entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            const durableStore = new NimbusDurableStore();
            await nimbusStore.set('present', DefaultDurableSegment, { data: {} });

            const result = await durableStore.getEntries(
                ['missing', 'present'],
                DefaultDurableSegment
            );
            expect(result).toEqual({ present: { data: {} } });
        });

        it('should report metrics to the instrumentation service', async () => {
            // Arrange
            const errorSpy = jest.fn();
            const incrementCounterSpy = jest.fn();
            const mockReporter = {
                error: errorSpy,
                incrementCounter: incrementCounterSpy,
            } as unknown as Instrumentation;

            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            const durableStore = new NimbusDurableStore({
                withInstrumentation: withInstrumentation(mockReporter),
            });

            nimbusStore.kvp = {
                [DefaultDurableSegment]: {
                    ['present']: JSONStringify({ data: {} }),
                },
            };

            // Act
            await durableStore.getEntries(['missing', 'present'], DefaultDurableSegment);

            // Assert
            expect(errorSpy).toBeCalledTimes(0);
            expect(incrementCounterSpy).toBeCalledTimes(1);
            expect(incrementCounterSpy).toBeCalledWith(
                'durable-store',
                1, // Metric Value
                false, // hasError
                {
                    method: 'getEntries',
                    operation: 'read',
                    segment: 'DEFAULT',
                }
            );
        });

        it('should report errors to the instrumentation service', async () => {
            // Arrange
            const errorSpy = jest.fn();
            const incrementCounterSpy = jest.fn();
            const mockReporter = {
                error: errorSpy,
                incrementCounter: incrementCounterSpy,
            } as unknown as Instrumentation;

            const readError = new Error('Read error');
            const nimbusStore = new MockNimbusDurableStore();
            jest.spyOn(nimbusStore, 'getEntriesInSegment').mockRejectedValue(readError);
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore({
                withInstrumentation: withInstrumentation(mockReporter),
            });

            nimbusStore.kvp = {
                [DefaultDurableSegment]: {
                    ['present']: JSONStringify({ data: {} }),
                },
            };

            // Act
            await expect(
                durableStore.getEntries(['missing', 'present'], DefaultDurableSegment)
            ).rejects.toThrow(readError);

            // Assert
            expect(errorSpy).toBeCalledTimes(1);
            expect(errorSpy).toBeCalledWith(readError);
            expect(incrementCounterSpy).toBeCalledTimes(1);
            expect(incrementCounterSpy).toBeCalledWith(
                'durable-store',
                1, // Metric Value
                true, // hasError
                {
                    method: 'getEntries',
                    operation: 'read',
                    segment: 'DEFAULT',
                }
            );
        });
    });

    describe('BatchOperations', () => {
        it('should stringify entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            const batchSpy = jest.fn().mockResolvedValue(undefined);
            nimbusStore.batchOperations = batchSpy;
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            const setData = {
                [recordId]: recordData,
            };
            await durableStore.batchOperations([
                {
                    entries: setData,
                    type: DurableStoreOperationType.SetEntries,
                    segment: DefaultDurableSegment,
                },
            ]);

            expect(batchSpy.mock.calls[0][0][0].entries[recordId]).toEqual(
                JSONStringify(recordData)
            );
        });

        it('should use default setEntries if batchOperations is undefined', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            const setEntriesSpy = jest.fn().mockResolvedValue(undefined);
            nimbusStore.batchOperations = undefined;
            nimbusStore.setEntriesInSegmentWithSender = setEntriesSpy;

            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            const setData = {
                [recordId]: recordData,
            };

            const stringifiedEntries = { [recordId]: JSONStringify(recordData) };
            await durableStore.setEntries(setData, DefaultDurableSegment);

            expect(setEntriesSpy.mock.calls[0][0]).toEqual(stringifiedEntries);
        });

        it('should use default evictEntries if batchOperations is undefined', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            const evictEntriesSpy = jest.fn().mockResolvedValue(undefined);
            nimbusStore.batchOperations = undefined;
            nimbusStore.evictEntriesInSegmentWithSender = evictEntriesSpy;

            const evictIds = ['1', '2', '3'];
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            await durableStore.evictEntries(evictIds, DefaultDurableSegment);

            expect(evictEntriesSpy.mock.calls[0][0]).toEqual(evictIds);
        });

        it('should batch setEntries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            const batchSpy = jest.fn().mockResolvedValue(undefined);
            nimbusStore.batchOperations = batchSpy;
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            const setData = {
                [recordId]: recordData,
            };

            const stringifiedEntries = { [recordId]: JSONStringify(recordData) };
            await durableStore.setEntries(setData, DefaultDurableSegment);

            expect(batchSpy.mock.calls[0][0][0]).toEqual({
                entries: stringifiedEntries,
                ids: [recordId],
                type: DurableStoreOperationType.SetEntries,
                segment: DefaultDurableSegment,
            });
        });

        it('should batch evict', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            const batchSpy = jest.fn().mockResolvedValue(undefined);
            nimbusStore.batchOperations = batchSpy;
            const evictIds = ['1', '2', '3'];
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            await durableStore.evictEntries(evictIds, DefaultDurableSegment);

            expect(batchSpy.mock.calls[0][0][0]).toEqual({
                ids: evictIds,
                type: DurableStoreOperationType.EvictEntries,
                segment: DefaultDurableSegment,
            });
        });
    });

    describe('RegisterOnChangedListener', () => {
        it('should call back on change listener', async () => {
            const durableStore = new NimbusDurableStore();
            const changedIds = ['1', '2', '3'];
            const changedSegment = 'random segment';
            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            let registeredListener: (changes: DurableStoreChange[]) => void = undefined;
            nimbusStore.registerOnChangedListenerWithBatchInfo = (listener) => {
                registeredListener = listener;
                return Promise.resolve('1234');
            };
            const listenerSpy = jest.fn();
            durableStore.registerOnChangedListener(listenerSpy);
            expect(registeredListener).toBeDefined();

            registeredListener([
                {
                    ids: changedIds,
                    type: DurableStoreOperationType.EvictEntries,
                    segment: changedSegment,
                    sender: '',
                },
            ]);

            expect(listenerSpy.mock.calls[0][0][0].ids).toEqual(changedIds);
            expect(listenerSpy.mock.calls[0][0][0].segment).toEqual(changedSegment);
        });

        it('should unsubscribe on change listener', async () => {
            const durableStore = new NimbusDurableStore();
            const changedIds = ['1', '2', '3'];
            const changedSegment = 'random segment';
            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            let registeredListener: (changes: DurableStoreChange[]) => void = undefined;
            nimbusStore.registerOnChangedListenerWithBatchInfo = (listener) => {
                registeredListener = listener;
                return Promise.resolve('1234');
            };
            nimbusStore.unsubscribeOnChangedListener = (_id) => {
                registeredListener = undefined;
                return Promise.resolve();
            };
            const listenerSpy = jest.fn();
            const unsubscribe = await durableStore.registerOnChangedListener(listenerSpy);
            expect(registeredListener).toBeDefined();
            registeredListener([
                {
                    ids: changedIds,
                    type: DurableStoreOperationType.EvictEntries,
                    segment: changedSegment,
                    sender: '',
                },
            ]);
            expect(listenerSpy.mock.calls[0][0][0].ids).toEqual(changedIds);
            expect(listenerSpy.mock.calls[0][0][0].segment).toEqual(changedSegment);

            await unsubscribe();
            expect(registeredListener).toBeUndefined();
        });
    });

    describe('Change listener', () => {
        it('should send external when not sent by self', async () => {
            expect.assertions(3);
            const durableStore = new NimbusDurableStore();
            const nimbusStore = new MockNimbusDurableStore();
            let callCount = 0;
            mockNimbusStoreGlobal(nimbusStore);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            durableStore.registerOnChangedListener((changes) => {
                callCount += 1;
                expect(changes[0].isExternalChange).toEqual(true);
            });
            expect(callCount).toEqual(0);
            const secondDurableStore = new NimbusDurableStore();
            await secondDurableStore.evictEntries(['1'], DefaultDurableSegment);

            expect(callCount).toEqual(1);
        });

        it('should not send external when  sent by self', async () => {
            expect.assertions(3);
            const durableStore = new NimbusDurableStore();
            const nimbusStore = new MockNimbusDurableStore();
            let callCount = 0;
            mockNimbusStoreGlobal(nimbusStore);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            durableStore.registerOnChangedListener((changes) => {
                callCount += 1;
                expect(changes[0].isExternalChange).toEqual(false);
            });
            expect(callCount).toEqual(0);
            await durableStore.evictEntries(['1'], DefaultDurableSegment);

            expect(callCount).toEqual(1);
        });
    });
});
