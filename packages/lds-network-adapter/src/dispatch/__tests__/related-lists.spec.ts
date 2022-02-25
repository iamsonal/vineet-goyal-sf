import { ResourceRequest } from '@luvio/engine';
import {
    convertPostRelatedListRecordsToGet,
    isRelatedListPostRecordsResourceRequest,
} from '../related-lists';
import { UI_API_BASE_URI } from '../../uiapi-base';
import { buildResourceRequest } from './test-utils';

const UIAPI_GET_RELATED_LIST_RECORDS = '/related-list-records';
const UIAPI_GET_RELATED_LIST_RECORDS_BATCH = `${UIAPI_GET_RELATED_LIST_RECORDS}/batch`;

const requestParams = {
    apiName: 'Test__c',
    fields: [],
};

const request: ResourceRequest = buildResourceRequest({
    method: 'post',
    baseUri: UI_API_BASE_URI,
    basePath: UIAPI_GET_RELATED_LIST_RECORDS,
    body: requestParams,
});

describe('convertPostRelatedListRecordsToGet', () => {
    it('should map the POST body to GET query params', () => {
        const convertedRequest = convertPostRelatedListRecordsToGet(request);

        expect(convertedRequest.body).toBeNull();
        expect(convertedRequest.queryParams).toEqual(requestParams);
        expect(convertedRequest.method).toEqual('get');
    });
});

describe('isRelatedListPostRecordsResourceRequest', () => {
    it('should detect a standard getRelatedListRecords request', () => {
        expect(isRelatedListPostRecordsResourceRequest(request)).toEqual(true);
    });

    it('should not match for a batch getRelatedListRecords request', () => {
        const request: ResourceRequest = buildResourceRequest({
            method: 'post',
            baseUri: UI_API_BASE_URI,
            basePath: UIAPI_GET_RELATED_LIST_RECORDS_BATCH,
            body: requestParams,
        });

        expect(isRelatedListPostRecordsResourceRequest(request)).toEqual(false);
    });

    it('should not match for a get request', () => {
        const request: ResourceRequest = buildResourceRequest({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: UIAPI_GET_RELATED_LIST_RECORDS_BATCH,
            body: requestParams,
        });

        expect(isRelatedListPostRecordsResourceRequest(request)).toEqual(false);
    });

    it('should not match for a non-related lists path', () => {
        const request: ResourceRequest = buildResourceRequest({
            method: 'post',
            baseUri: UI_API_BASE_URI,
            basePath: '/records',
            body: requestParams,
        });

        expect(isRelatedListPostRecordsResourceRequest(request)).toEqual(false);
    });
});
