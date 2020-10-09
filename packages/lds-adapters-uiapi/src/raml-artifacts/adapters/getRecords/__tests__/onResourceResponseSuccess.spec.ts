import { onResourceResponseSuccess } from '../onResourceResponseSuccess';
import { LDS, Store, Environment, ResourceResponse } from '@ldsjs/engine';
import { GetRecordsConfig } from '../GetRecordsConfig';
import * as createChildResourceParamObject from '../createChildResourceParams';
import { ingestSuccessChildResourceParams } from '../../../resources/getUiApiRecordsBatchByRecordIds/ingestSuccessChildResourceParams';
import { adapterFragment } from '../adapterFragment';
import { ResourceRequestConfig } from '../../../../generated/resources/getUiApiRecordsBatchByRecordIds';
import { BatchRepresentation } from '../../../../generated/types/BatchRepresentation';
import createRecordData from '../../../../../src/util/__tests__/data/createSampleData';

jest.mock(
    '../../../resources/getUiApiRecordsBatchByRecordIds/ingestSuccessChildResourceParams',
    () => {
        return {
            ingestSuccessChildResourceParams: jest
                .fn()
                .mockReturnValue({ childSnapshotData: 'foo', seenRecords: 'bar' }),
        };
    }
);
jest.mock('../adapterFragment', () => {
    return {
        adapterFragment: jest.fn(),
    };
});

describe('onResourceResponseSuccess', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Input Data Setup
    const mockRecordData = createRecordData(1);
    const { id: mockRecordId } = mockRecordData;
    const fields = ['Account.Id', 'Account.City'];

    const inputGetRecordsConfig: GetRecordsConfig = {
        records: [
            {
                recordIds: [mockRecordId],
                fields,
            },
        ],
    };
    const resourceParams: ResourceRequestConfig = {
        queryParams: {
            fields,
        },
        urlParams: {
            recordIds: [mockRecordId],
        },
    };
    const mockResponse: ResourceResponse<BatchRepresentation> = {
        status: 200,
        statusText: 'Ok',
        ok: true,
        headers: undefined,
        body: {
            results: [
                {
                    result: mockRecordData,
                    statusCode: 200,
                },
            ],
        },
    };
    const store = new Store();
    const lds = new LDS(new Environment(store, jest.fn()));

    it('returns snapshot with state fulfilled', () => {
        const result = onResourceResponseSuccess(
            lds,
            inputGetRecordsConfig,
            resourceParams,
            mockResponse
        );
        expect(result.state).toBe('Fulfilled');
    });

    it('calls createChildResourceParams with the input GetRecordsConfig', () => {
        const createChildResourceParamsSpy = jest.spyOn(
            createChildResourceParamObject,
            'createChildResourceParams'
        );
        onResourceResponseSuccess(lds, inputGetRecordsConfig, resourceParams, mockResponse);
        expect(createChildResourceParamsSpy).toHaveBeenCalledWith(inputGetRecordsConfig);
    });

    it('calls ingestSuccessChildResourceParams with the right arguments', () => {
        onResourceResponseSuccess(lds, inputGetRecordsConfig, resourceParams, mockResponse);
        const childResourceParam = {
            urlParams: {
                recordId: mockRecordId,
            },
            queryParams: {
                fields,
            },
        };
        expect(ingestSuccessChildResourceParams).toHaveBeenCalledWith(
            lds,
            [childResourceParam],
            mockResponse.body.results
        );
    });

    it('calls adapterFragment with lds and GetRecordsConfig input', () => {
        onResourceResponseSuccess(lds, inputGetRecordsConfig, resourceParams, mockResponse);
        expect(adapterFragment).toHaveBeenCalledWith(lds, inputGetRecordsConfig);
    });

    it('calls lds.storeBroadcast once', () => {
        const ldsBroadcastSpy = jest.spyOn(lds, 'storeBroadcast');
        onResourceResponseSuccess(lds, inputGetRecordsConfig, resourceParams, mockResponse);
        expect(ldsBroadcastSpy).toHaveBeenCalledTimes(1);
    });
});
