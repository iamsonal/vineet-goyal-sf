import { HttpStatusCode, ResourceRequest } from '@luvio/engine';
import {
    buildAggregateUiUrl,
    shouldUseAggregateUiForGetRecord,
    dispatchSplitRecordAggregateUiAction,
    mergeRecordFields,
    buildGetRecordByFieldsCompositeRequest,
    MAX_AGGREGATE_UI_CHUNK_LIMIT,
    ResourceRequestWithConfigOptionalFields,
} from '../execute-aggregate-ui';
import { buildResourceRequest, generateMockedRecordFields } from './test-utils';
import { UI_API_BASE_URI } from '../../uiapi-base';
import salesforceNetworkAdapter from '../../main';

describe('executeAggregateUi', () => {
    describe('buildGetRecordByFieldsCompositeRequest', () => {
        it('should build a CompositeRequest with a getRecord input', () => {
            const fields = ['Name', 'Id', 'Cars__c', 'Cars__r.Name'];

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: [],
                    optionalFieldsLength: 0,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(1);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
        });

        it('should create multiple chunks with fields and optionalFields', () => {
            const fields = ['Name', 'Id', 'Cars__c', 'Cars__r.Name'];
            const optionalFields = ['Parent_Account__c'];

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: optionalFields,
                    optionalFieldsLength: optionalFields.join(',').length,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(2);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].url.length).toBeGreaterThan(0);
        });

        it('should never create a request that exceeds the maximum subquery limit', () => {
            const fields = ['Name', 'Id', 'Cars__c', 'Cars__r.Name'];
            const optionalFields = generateMockedRecordFields(1000000, 'TooManyFields__c');

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: optionalFields,
                    optionalFieldsLength: optionalFields.join(',').length,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(MAX_AGGREGATE_UI_CHUNK_LIMIT);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].url.length).toBeGreaterThan(0);
        });

        it('should always use one chunk for any amount of fields', () => {
            const fields = generateMockedRecordFields(500, 'CrazyHugeCustomFieldName__c');

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: [],
                    optionalFieldsLength: 0,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(1);
            actualCompositeRequest.forEach((requestChunk) => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });
        });

        it('should not distribute lookups across chunks for config fields', () => {
            const fields = generateMockedRecordFields(20, 'CrazyHugeCustomFieldName', true);

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: [],
                    optionalFieldsLength: 0,
                    fieldsLength: fields.length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(1);
            actualCompositeRequest.forEach((requestChunk) => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });
        });

        it('should limit lookups to no more than four per chunk', () => {
            // 20 fields with four lookups per chunk equals five chunks
            const fields = generateMockedRecordFields(20, 'CrazyHugeCustomFieldName', true);

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: [],
                    optionalFieldsArray: fields,
                    optionalFieldsLength: fields.length,
                    fieldsLength: 0,
                }
            );

            expect(actualCompositeRequest.length).toEqual(5);
            actualCompositeRequest.forEach((requestChunk) => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });
        });

        it('should put the config lookup fields in the first chunk always', () => {
            // 20 fields with four lookups per chunk equals five chunks
            const trackedOptionalFields = generateMockedRecordFields(
                20,
                'CrazyHugeCustomFieldName',
                true
            );
            const configFields = generateMockedRecordFields(20, 'ConfigFieldName', true);
            const configOptionalFields = generateMockedRecordFields(
                20,
                'ConfigOptionalFieldName',
                true
            );

            const resourceRequest: ResourceRequest = buildResourceRequest({});
            (resourceRequest as ResourceRequestWithConfigOptionalFields).configOptionalFields =
                configOptionalFields;

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(resourceRequest, {
                fieldsArray: configFields,
                optionalFieldsArray: trackedOptionalFields,
                optionalFieldsLength: trackedOptionalFields.length,
                fieldsLength: configFields.length,
            });

            // Five chunks plus one each for fields and optionalFields from config == 7
            expect(actualCompositeRequest.length).toEqual(7);
            actualCompositeRequest.forEach((requestChunk) => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });
        });

        it('should dedupe tracked fields with config fields', () => {
            // 20 fields with four lookups per chunk equals five chunks
            const trackedOptionalFields = generateMockedRecordFields(
                20,
                'CrazyHugeCustomFieldName',
                true
            );
            const configFields = generateMockedRecordFields(20, 'ConfigFieldName', true);
            const configOptionalFields = generateMockedRecordFields(
                20,
                'ConfigOptionalFieldName',
                true
            );

            // add in a field that we expect to be deduped
            const dedupedField = configOptionalFields[0];
            trackedOptionalFields.push(dedupedField);

            const resourceRequest: ResourceRequest = buildResourceRequest({});
            (resourceRequest as ResourceRequestWithConfigOptionalFields).configOptionalFields =
                configOptionalFields;

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(resourceRequest, {
                fieldsArray: configFields,
                optionalFieldsArray: trackedOptionalFields,
                optionalFieldsLength: trackedOptionalFields.length,
                fieldsLength: configFields.length,
            });

            // Five chunks plus one each for fields and optionalFields from config == 7
            // Without tracked optionalField dedupe, we would get another chunk.
            expect(actualCompositeRequest.length).toEqual(7);

            actualCompositeRequest.forEach((requestChunk) => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });

            // More assertions for optionalFields deduping
            expect(actualCompositeRequest[1].referenceId).toEqual(
                'LDS_Records_AggregateUi_optionalFields_0'
            );
            expect(actualCompositeRequest[1].url).toContain(dedupedField);

            // Check that it's not in other chunks (1st is for fields)
            for (let i = 2; i < actualCompositeRequest.length; i++) {
                expect(actualCompositeRequest[i].url).not.toContain(dedupedField);
            }
        });
    });

    describe('dispatchSplitRecordAggregateUiAction', () => {
        it('should return a response with every aggregate merged', () => {
            const aggregateResponse = {
                compositeResponse: [
                    {
                        body: {
                            fields: { Field1__c: { value: '1', displayValue: '10' } },
                        },
                        httpStatusCode: HttpStatusCode.Ok,
                    },
                    {
                        body: {
                            fields: { Field2__c: { value: '2', displayValue: '20' } },
                        },
                        httpStatusCode: HttpStatusCode.Ok,
                    },
                    {
                        body: {
                            fields: { Field3__c: { value: '3', displayValue: '30' } },
                        },
                        httpStatusCode: HttpStatusCode.Ok,
                    },
                ],
            };

            const successfulResponseMock = jest
                .fn()
                .mockResolvedValueOnce({ body: aggregateResponse });

            return dispatchSplitRecordAggregateUiAction('recordid', successfulResponseMock, {
                baseUri: UI_API_BASE_URI,
                basePath: `${UI_API_BASE_URI}/aggregate-ui`,
                urlParams: {},
                queryParams: {},
                body: {},
                method: 'POST',
                headers: {},
                priority: 'normal',
            }).then((data: any) => {
                expect(successfulResponseMock).toHaveBeenCalledTimes(1);

                expect(data.status).toBe(HttpStatusCode.Ok);
                expect(data.body.fields).toBeDefined();

                const responseField1 = data.body.fields['Field1__c'];
                const responseField2 = data.body.fields['Field2__c'];
                const responseField3 = data.body.fields['Field3__c'];

                expect(responseField1.value).toEqual('1');
                expect(responseField1.displayValue).toBe('10');
                expect(responseField2.value).toEqual('2');
                expect(responseField2.displayValue).toBe('20');
                expect(responseField3.value).toEqual('3');
                expect(responseField3.displayValue).toBe('30');
            });
        });

        it('should throw an exception when one aggregate response fails', () => {
            const aggregateResponse = {
                compositeResponse: [
                    {
                        body: {
                            fields: { Field1__c: { value: '1', displayValue: '10' } },
                        },
                    },
                    {
                        httpStatusCode: HttpStatusCode.ServerError,
                    },
                    {
                        body: {
                            fields: { Field3__c: { value: '3', displayValue: '30' } },
                        },
                    },
                ],
            };

            const unsuccessfulResponseMock = jest
                .fn()
                .mockResolvedValueOnce({ body: aggregateResponse });
            const networkAdapter = salesforceNetworkAdapter(unsuccessfulResponseMock);

            return dispatchSplitRecordAggregateUiAction('recordid', networkAdapter, {
                baseUri: UI_API_BASE_URI,
                basePath: `${UI_API_BASE_URI}/aggregate-ui`,
                urlParams: {},
                queryParams: {},
                body: {},
                method: 'POST',
                headers: {},
                priority: 'normal',
            }).catch((e) => {
                expect(unsuccessfulResponseMock).toHaveBeenCalledTimes(1);

                expect(e.status).toBe(HttpStatusCode.ServerError);
            });
        });

        it('should throw an exception with empty response body', () => {
            const emptyBodyResponseMock = jest.fn().mockResolvedValueOnce({ body: {} });

            return dispatchSplitRecordAggregateUiAction('recordid', emptyBodyResponseMock, {
                baseUri: UI_API_BASE_URI,
                basePath: `${UI_API_BASE_URI}/aggregate-ui`,
                urlParams: {},
                queryParams: {},
                body: {},
                method: 'POST',
                headers: {},
                priority: 'normal',
            }).catch((e) => {
                expect(emptyBodyResponseMock).toHaveBeenCalledTimes(1);
                expect(e.status).toEqual(HttpStatusCode.ServerError);
                expect(e.body.error).toEqual('No response body in executeAggregateUi found');
            });
        });
    });

    describe('shouldUseAggregateUiForGetRecord', () => {
        it('returns true for large fields', () => {
            const actual = shouldUseAggregateUiForGetRecord(
                generateMockedRecordFields(800).join(','),
                ''
            );

            expect(actual).toBe(true);
        });

        it('returns true for large optionalFields', () => {
            const actual = shouldUseAggregateUiForGetRecord(
                '',
                generateMockedRecordFields(800).join(',')
            );

            expect(actual).toBe(true);
        });

        it('returns true for large combined fields and optionalFields', () => {
            const actual = shouldUseAggregateUiForGetRecord(
                generateMockedRecordFields(400).join(','),
                generateMockedRecordFields(400).join(',')
            );

            expect(actual).toBe(true);
        });

        it('returns false for few fields', () => {
            const actual = shouldUseAggregateUiForGetRecord(
                generateMockedRecordFields(2).join(','),
                generateMockedRecordFields(2).join(',')
            );

            expect(actual).toBe(false);
        });
    });

    describe('buildAggregateUiUrl', () => {
        it('should generate a valid URL when only fields are requested', () => {
            const params = {
                fields: [
                    'Name',
                    'Id',
                    'Cars__c',
                    'Cars__r.Name',
                    'Cars__r.Parent_Account__c',
                    'Cars__r.Parent_Account__r.Name',
                ],
            };

            const resourceRequest = buildResourceRequest({
                basePath: '/ui-api/records',
            });

            const actualUrl = buildAggregateUiUrl(params, resourceRequest);

            expect(actualUrl).not.toContain('?optionalFields=');
            expect(actualUrl).not.toContain('&optionalFields=');
            expect(actualUrl).toContain('?fields=');
            expect(actualUrl).toContain(`${UI_API_BASE_URI}/ui-api/records`);

            // Verify fields
            params.fields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
        });

        it('should generate a valid URL when only optionalFields are requested', () => {
            const params = {
                optionalFields: [
                    'Name',
                    'Id',
                    'Cars__c',
                    'Cars__r.Name',
                    'Cars__r.Parent_Account__c',
                    'Cars__r.Parent_Account__r.Name',
                ],
            };

            const resourceRequest = buildResourceRequest({
                basePath: '/ui-api/records',
            });

            const actualUrl = buildAggregateUiUrl(params, resourceRequest);

            expect(actualUrl).not.toContain('?fields=');
            expect(actualUrl).not.toContain('&fields=');
            expect(actualUrl).toContain('?optionalFields=');
            expect(actualUrl).toContain(`${UI_API_BASE_URI}/ui-api/records`);

            // Verify fields
            params.optionalFields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
        });

        it('should generate a valid URL when fields and optionalFields are requested', () => {
            const params = {
                fields: [
                    'Name',
                    'Id',
                    'Cars__c',
                    'Cars__r.Parent_Account__c',
                    'Cars__r.Parent_Account__r.Name',
                ],
                optionalFields: ['Cars__c', 'Cars__r.Name'],
            };

            const resourceRequest = buildResourceRequest({
                basePath: '/ui-api/records',
            });

            const actualUrl = buildAggregateUiUrl(params, resourceRequest);

            expect(actualUrl).toContain('?fields=');
            expect(actualUrl).toContain('&optionalFields=');
            expect(actualUrl).toContain(`${UI_API_BASE_URI}/ui-api/records`);

            // Verify fields
            params.fields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
            params.optionalFields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
        });
    });
});

describe('mergeRecordFields', () => {
    it('should retain deep record fields', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Account: {
                        displayValue: 'account',
                        value: {
                            apiName: 'account',
                            eTag: 'eTag',
                            id: 'account',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Country: {
                                    displayValue: 'country',
                                    value: {
                                        apiName: 'country',
                                        eTag: 'eTag',
                                        id: 'country',
                                        childRelationships: {},
                                        systemModstamp: '01-01-1970',
                                        lastModifiedById: 'user',
                                        lastModifiedDate: '01-01-1970',
                                        weakEtag: 1,
                                        fields: {
                                            Id: {
                                                displayValue: 'id',
                                                value: 'Id',
                                            },
                                        },
                                        recordTypeId: 'recordTypeId',
                                        recordTypeInfo: null,
                                    },
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    City: {
                        displayValue: 'account',
                        value: {
                            apiName: 'city',
                            eTag: 'eTag',
                            id: 'city',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Account: {
                    displayValue: 'account',
                    value: {
                        apiName: 'account',
                        eTag: 'eTag',
                        id: 'account',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Country: {
                                displayValue: 'country',
                                value: {
                                    apiName: 'country',
                                    eTag: 'eTag',
                                    id: 'country',
                                    childRelationships: {},
                                    systemModstamp: '01-01-1970',
                                    lastModifiedById: 'user',
                                    lastModifiedDate: '01-01-1970',
                                    weakEtag: 1,
                                    fields: {
                                        Id: {
                                            displayValue: 'id',
                                            value: 'Id',
                                        },
                                    },
                                    recordTypeId: 'recordTypeId',
                                    recordTypeInfo: null,
                                },
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
                City: {
                    displayValue: 'account',
                    value: {
                        apiName: 'city',
                        eTag: 'eTag',
                        id: 'city',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should merge separate shallow record fields together', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Account: {
                        displayValue: 'account',
                        value: {
                            apiName: 'account',
                            eTag: 'eTag',
                            id: 'account',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Name: {
                                    displayValue: 'Name',
                                    value: 'Name',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    City: {
                        displayValue: 'account',
                        value: {
                            apiName: 'city',
                            eTag: 'eTag',
                            id: 'city',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Account: {
                    displayValue: 'account',
                    value: {
                        apiName: 'account',
                        eTag: 'eTag',
                        id: 'account',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Name: {
                                displayValue: 'Name',
                                value: 'Name',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
                City: {
                    displayValue: 'account',
                    value: {
                        apiName: 'city',
                        eTag: 'eTag',
                        id: 'city',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should merge separate deep record fields together', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Account: {
                        displayValue: 'account',
                        value: {
                            apiName: 'account',
                            eTag: 'eTag',
                            id: 'account',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Name: {
                                    displayValue: 'Name',
                                    value: 'Name',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Account: {
                        displayValue: 'account',
                        value: {
                            apiName: 'account',
                            eTag: 'eTag',
                            id: 'account',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Account: {
                    displayValue: 'account',
                    value: {
                        apiName: 'account',
                        eTag: 'eTag',
                        id: 'account',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                            Name: {
                                displayValue: 'Name',
                                value: 'Name',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should merge combination of deep and shallow record fields together', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Account: {
                        displayValue: 'account',
                        value: {
                            apiName: 'account',
                            eTag: 'eTag',
                            id: 'account',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Name: {
                                    displayValue: 'Name',
                                    value: 'Name',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Account: {
                        displayValue: 'account',
                        value: {
                            apiName: 'account',
                            eTag: 'eTag',
                            id: 'account',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                    City: {
                        displayValue: 'account',
                        value: {
                            apiName: 'city',
                            eTag: 'eTag',
                            id: 'city',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Account: {
                    displayValue: 'account',
                    value: {
                        apiName: 'account',
                        eTag: 'eTag',
                        id: 'account',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                            Name: {
                                displayValue: 'Name',
                                value: 'Name',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
                City: {
                    displayValue: 'account',
                    value: {
                        apiName: 'city',
                        eTag: 'eTag',
                        id: 'city',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should merge non-spanning records together', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Shallow: {
                        displayValue: 'shallow',
                        value: 10,
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    City: {
                        displayValue: 'account',
                        value: {
                            apiName: 'city',
                            eTag: 'eTag',
                            id: 'city',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Shallow: {
                    displayValue: 'shallow',
                    value: 10,
                },
                City: {
                    displayValue: 'account',
                    value: {
                        apiName: 'city',
                        eTag: 'eTag',
                        id: 'city',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should retain null fields', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Shallow: {
                        displayValue: null,
                        value: null,
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    City: {
                        displayValue: 'account',
                        value: {
                            apiName: 'city',
                            eTag: 'eTag',
                            id: 'city',
                            childRelationships: {},
                            systemModstamp: '01-01-1970',
                            lastModifiedById: 'user',
                            lastModifiedDate: '01-01-1970',
                            weakEtag: 1,
                            fields: {
                                Id: {
                                    displayValue: 'Id',
                                    value: 'id',
                                },
                            },
                            recordTypeId: 'recordTypeId',
                            recordTypeInfo: null,
                        },
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Shallow: {
                    displayValue: null,
                    value: null,
                },
                City: {
                    displayValue: 'account',
                    value: {
                        apiName: 'city',
                        eTag: 'eTag',
                        id: 'city',
                        childRelationships: {},
                        systemModstamp: '01-01-1970',
                        lastModifiedById: 'user',
                        lastModifiedDate: '01-01-1970',
                        weakEtag: 1,
                        fields: {
                            Id: {
                                displayValue: 'Id',
                                value: 'id',
                            },
                        },
                        recordTypeId: 'recordTypeId',
                        recordTypeInfo: null,
                    },
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should merge null records together', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Shallow: {
                        displayValue: null,
                        value: null,
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Shallow: {
                        displayValue: null,
                        value: null,
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Shallow: {
                    displayValue: null,
                    value: null,
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });

    it('should merge null spanning records', () => {
        const result = mergeRecordFields(
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    Shallow: {
                        displayValue: 'shallow',
                        value: 10,
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            },
            {
                apiName: 'foo',
                childRelationships: {},
                eTag: 'eTag',
                fields: {
                    City: {
                        displayValue: null,
                        value: null,
                    },
                },
                id: 'oppy',
                systemModstamp: '01-01-1970',
                lastModifiedById: 'user',
                lastModifiedDate: '01-01-1970',
                recordTypeId: 'recordTypeId',
                recordTypeInfo: null,
                weakEtag: 1,
            }
        );

        expect(result).toEqual({
            apiName: 'foo',
            childRelationships: {},
            eTag: 'eTag',
            fields: {
                Shallow: {
                    displayValue: 'shallow',
                    value: 10,
                },
                City: {
                    displayValue: null,
                    value: null,
                },
            },
            id: 'oppy',
            systemModstamp: '01-01-1970',
            lastModifiedById: 'user',
            lastModifiedDate: '01-01-1970',
            recordTypeId: 'recordTypeId',
            recordTypeInfo: null,
            weakEtag: 1,
        });
    });
});
