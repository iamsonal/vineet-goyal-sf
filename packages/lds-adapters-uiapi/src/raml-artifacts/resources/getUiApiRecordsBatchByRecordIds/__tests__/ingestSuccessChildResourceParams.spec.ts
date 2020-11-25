import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestSuccessChildResourceParams } from '../ingestSuccessChildResourceParams';
import { RecordRepresentation } from '../../../../generated/types/RecordRepresentation';
import { BatchResultRepresentation } from '../../../../generated/types/BatchResultRepresentation';
import { ingestError, ingestSuccess } from '../../../../wire/getRecord/GetRecordFields';
import record from './data/sampleRecord.json';

jest.mock('../../../../wire/getRecord/GetRecordFields', () => {
    const actual = jest.requireActual('../../../../wire/getRecord/GetRecordFields');
    return {
        ...actual,
        ingestSuccess: jest.fn().mockImplementation(actual.ingestSuccess),
        ingestError: jest.fn().mockImplementation(actual.ingestError),
    };
});

function buildSampleRecord(): RecordRepresentation {
    return JSON.parse(JSON.stringify(record));
}

describe('ingestSuccessChildResourceParams', () => {
    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    const newRecord = buildSampleRecord();
    const recordId = newRecord.id;

    const fields = ['Account.City', 'Account.Id'];
    const optionalFields = ['Account.LastModifiedBy'];

    const makeParams = recordId => ({
        urlParams: {
            recordId,
        },
        queryParams: {
            fields,
            optionalFields,
        },
    });

    const successResult: BatchResultRepresentation = {
        statusCode: 200,
        result: newRecord,
    };

    const errorResult: BatchResultRepresentation = {
        statusCode: 404,
        result: 'some error message',
    };

    it('ingestSuccess', () => {
        const params = makeParams(recordId);
        const ingestResult = ingestSuccessChildResourceParams(luvio, [params], [successResult]);
        expect(Object.isFrozen(ingestResult.childSnapshotData)).toEqual(true);
        expect(ingestSuccess).toHaveBeenCalledTimes(1);
        expect(ingestResult.childSnapshotData.results[0].statusCode).toEqual(200);
    });

    it('ingestError', () => {
        const params = makeParams(recordId);
        const ingestResult = ingestSuccessChildResourceParams(luvio, [params], [errorResult]);
        expect(Object.isFrozen(ingestResult.childSnapshotData)).toEqual(true);
        expect(ingestError).toHaveBeenCalledTimes(1);
        expect(ingestResult.childSnapshotData.results[0].statusCode).toEqual(404);
    });
});
