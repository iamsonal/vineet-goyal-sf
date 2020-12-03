import { Luvio, Store, Environment, Reader, ReaderFragment } from '@luvio/engine';
import { selectChildResourceParams } from '../selectChildResourceParams';
import { buildRecordSelector } from '../../../../wire/getRecord/GetRecordFields';
import { keyBuilder } from '../../../../generated/resources/getUiApiRecordsByRecordId';

jest.mock('../../../../wire/getRecord/GetRecordFields', () => {
    const actual = jest.requireActual('../../../../wire/getRecord/GetRecordFields');
    return {
        ...actual,
        buildRecordSelector: jest.fn().mockImplementation(actual.buildRecordSelector),
    };
});

jest.mock('../../../../generated/resources/getUiApiRecordsByRecordId', () => {
    const actual = jest.requireActual('../../../../generated/resources/getUiApiRecordsByRecordId');
    return {
        ...actual,
        keyBuilder: jest.fn().mockImplementation(actual.keyBuilder),
    };
});

function assertIsFragment(fragment) {
    expect(fragment.reader).toBe(true);
    expect(fragment.kind).toEqual('Fragment');
    expect(fragment.synthetic).toBe(true);
    expect(fragment.read).toBeDefined();
    expect(typeof fragment.read).toEqual('function');
}

describe('selectChildResourceParams', () => {
    const luvio = new Luvio(new Environment(new Store(), jest.fn()));
    let reader: Reader<any>;

    const fields = ['a', 'b', 'c'];
    const optionalFields = ['d', 'e', 'f'];

    const makeParams = recordId => ({
        urlParams: {
            recordId,
        },
        queryParams: {
            fields,
            optionalFields,
        },
    });

    beforeEach(() => {
        reader = new Reader({}, {}, {});
    });

    afterEach(() => {
        keyBuilder.mockClear();
        buildRecordSelector.mockClear();
    });

    const record1 = {
        state: 'Fulfilled',
        data: {
            fieldA: 'record1FiedlA',
        },
    };
    const record2 = {
        state: 'Fulfilled',
        data: {
            fieldA: 'record2FiedlA',
        },
    };
    const result1 = {
        statusCode: 200,
        result: {
            fieldA: 'record1FiedlA',
        },
    };
    const result2 = {
        statusCode: 200,
        result: {
            fieldA: 'record2FiedlA',
        },
    };
    const erroredRecord = {
        state: 'Error',
        error: {
            status: 'some error status',
            body: 'some error body',
        },
    };
    const erroredResult = {
        statusCode: 'some error status',
        result: 'some error body',
    };
    const unfulfilledRecord = {
        state: 'Unfulfilled',
    };
    const pendingRecord = {
        state: 'Pending',
    };
    const staleRecord = { state: 'Stale' };

    it.each([
        ['fulfilled', record1, result1],
        ['errored', erroredRecord, erroredResult],
        ['unfulfilled', unfulfilledRecord, {}],
        ['pending', pendingRecord, {}],
        ['stale', staleRecord, {}],
    ])('selects %s record', (stateName, inputRecord, expectedRecord) => {
        reader.read = jest.fn().mockImplementation(() => inputRecord);
        const params = makeParams('record1');
        const fragment = selectChildResourceParams(luvio, [params]) as ReaderFragment;
        assertIsFragment(fragment);
        const result = fragment.read(reader);
        expect(Object.isFrozen(result)).toEqual(true);
        expect(result).toEqual({ results: [expectedRecord] });
        expect(keyBuilder).toHaveBeenCalledTimes(1);
        expect(keyBuilder).toHaveBeenCalledWith(params);
        expect(buildRecordSelector).toHaveBeenCalledTimes(1);
        expect(buildRecordSelector).toHaveBeenCalledWith('record1', fields, optionalFields);
    });

    it('selects multiple records', () => {
        const records = {
            'UiApi::RecordRepresentation:record1': record1,
            'UiApi::RecordRepresentation:record2': record2,
            'UiApi::RecordRepresentation:errored': erroredRecord,
            'UiApi::RecordRepresentation:unfulfilled': unfulfilledRecord,
            'UiApi::RecordRepresentation:pending': pendingRecord,
            'UiApi::RecordRepresentation:stale': staleRecord,
        };
        reader.read = jest.fn().mockImplementation(selector => records[selector.recordId]);
        const recordIds = ['record1', 'record2', 'errored', 'unfulfilled', 'pending', 'stale'];
        const params = recordIds.map(recordId => makeParams(recordId));
        const fragment = selectChildResourceParams(luvio, params) as ReaderFragment;
        assertIsFragment(fragment);
        const result = fragment.read(reader);
        expect(Object.isFrozen(result)).toEqual(true);
        expect(result).toEqual({ results: [result1, result2, erroredResult, {}, {}, {}] });
        expect(buildRecordSelector).toHaveBeenCalledTimes(6);
        const expectBuildRecordSelector = (n, recordId) =>
            expect(buildRecordSelector).toHaveBeenNthCalledWith(
                n,
                recordId,
                fields,
                optionalFields
            );
        expectBuildRecordSelector(1, 'record1');
        expectBuildRecordSelector(2, 'record2');
        expectBuildRecordSelector(3, 'errored');
        expectBuildRecordSelector(4, 'unfulfilled');
        expectBuildRecordSelector(5, 'pending');
        expectBuildRecordSelector(6, 'stale');
    });
});
