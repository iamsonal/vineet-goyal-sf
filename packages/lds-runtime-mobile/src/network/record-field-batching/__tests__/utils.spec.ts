import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { ScopedFieldsCollection } from '../ScopedFields';
import {
    buildAggregateUiUrl,
    buildCompositeRequestByFields,
    mergeRecordFields,
    shouldUseAggregateUiForFields,
    UiApiParams,
    createAggregateBatchRequestInfo,
    mergeAggregateUiResponse,
    MAX_STRING_LENGTH_PER_CHUNK,
} from '../utils';
import {
    BASE_URI,
    buildResourceRequest,
    generateFetchResponse,
    generateMockedRecordFields,
    wrapFieldsInRecordObject,
    wrapRecordInCompositeResponse,
} from './testUtils';

describe('record-field-batching utils', () => {
    describe('mergeRecordFields', () => {
        it('should retain deep record fields', () => {
            const accountField = {
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
            };
            const cityField = {
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
            };
            const targetRecord = wrapFieldsInRecordObject({
                Account: accountField,
            });
            const sourceRecord = wrapFieldsInRecordObject({
                City: cityField,
            });
            const result = mergeRecordFields(targetRecord, sourceRecord);

            const expectedRecord = wrapFieldsInRecordObject({
                Account: accountField,
                City: cityField,
            });
            expect(result).toEqual(expectedRecord);
        });

        it('should merge separate shallow record fields together', () => {
            const accountField = {
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
            };
            const cityField = {
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
            };
            const targetRecord = wrapFieldsInRecordObject({
                Account: accountField,
            });
            const sourceRecord = wrapFieldsInRecordObject({
                City: cityField,
            });
            const expectedRecord = wrapFieldsInRecordObject({
                Account: accountField,
                City: cityField,
            });
            const resultRecord = mergeRecordFields(targetRecord, sourceRecord);
            expect(resultRecord).toEqual(expectedRecord);
        });

        it('should merge separate deep record fields together', () => {
            const nameField = {
                displayValue: 'Name',
                value: 'Name',
            };
            const idField = {
                displayValue: 'Id',
                value: 'id',
            };
            const accountFieldEmbeddingNameField = {
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
                        Name: nameField,
                    },
                    recordTypeId: 'recordTypeId',
                    recordTypeInfo: null,
                },
            };
            const accountFieldEmbeddingIdField = {
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
                        Id: idField,
                    },
                    recordTypeId: 'recordTypeId',
                    recordTypeInfo: null,
                },
            };
            const accountFieldEmbeddingNameAndIdField = {
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
                        Name: nameField,
                        Id: idField,
                    },
                    recordTypeId: 'recordTypeId',
                    recordTypeInfo: null,
                },
            };
            const targetRecord = wrapFieldsInRecordObject({
                Account: accountFieldEmbeddingNameField,
            });
            const sourceRecord = wrapFieldsInRecordObject({
                Account: accountFieldEmbeddingIdField,
            });
            const expectedRecord = wrapFieldsInRecordObject({
                Account: accountFieldEmbeddingNameAndIdField,
            });
            const resultRecord = mergeRecordFields(targetRecord, sourceRecord);
            expect(resultRecord).toEqual(expectedRecord);
        });

        it('should merge combination of deep and shallow record fields together', () => {
            const targetRecord = wrapFieldsInRecordObject({
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
            });
            const sourceRecord = wrapFieldsInRecordObject({
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
            });
            const expectedRecord = wrapFieldsInRecordObject({
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
            });
            const result = mergeRecordFields(targetRecord, sourceRecord);
            expect(result).toEqual(expectedRecord);
        });

        it('should merge non-spanning records together', () => {
            const shallowField = {
                displayValue: 'shallow',
                value: 10,
            };
            const cityField = {
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
            };
            const targetRecord = wrapFieldsInRecordObject({
                Shallow: shallowField,
            });
            const sourceRecord = wrapFieldsInRecordObject({
                City: cityField,
            });
            const expectedRecord = wrapFieldsInRecordObject({
                Shallow: shallowField,
                City: cityField,
            });
            const result = mergeRecordFields(targetRecord, sourceRecord);

            expect(result).toEqual(expectedRecord);
        });

        it('should retain null fields', () => {
            const targetRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: null,
                    value: null,
                },
            });
            const cityField = {
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
            };
            const sourceRecord = wrapFieldsInRecordObject({
                City: cityField,
            });
            const resultRecord = mergeRecordFields(targetRecord, sourceRecord);
            const expectedRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: null,
                    value: null,
                },
                City: cityField,
            });

            expect(resultRecord).toEqual(expectedRecord);
        });

        it('should merge null records together', () => {
            const targetRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: null,
                    value: null,
                },
            });
            const sourceRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: null,
                    value: null,
                },
            });
            const expectedRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: null,
                    value: null,
                },
            });
            const resultRecord = mergeRecordFields(targetRecord, sourceRecord);

            expect(resultRecord).toEqual(expectedRecord);
        });

        it('should merge null spanning records', () => {
            const targetRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: 'shallow',
                    value: 10,
                },
            });
            const sourceRecord = wrapFieldsInRecordObject({
                City: {
                    displayValue: null,
                    value: null,
                },
            });
            const result = mergeRecordFields(targetRecord, sourceRecord);
            const expectedRecord = wrapFieldsInRecordObject({
                Shallow: {
                    displayValue: 'shallow',
                    value: 10,
                },
                City: {
                    displayValue: null,
                    value: null,
                },
            });
            expect(result).toEqual(expectedRecord);
        });
    });

    describe('buildAggregateUiUrl', () => {
        it('should generate a valid URL when only fields are requested', () => {
            const params: UiApiParams = {
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
            expect(actualUrl).toContain(`${BASE_URI}/ui-api/records`);

            // Verify fields
            params.fields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
        });

        it('should generate a valid URL when only optionalFields are requested', () => {
            const params: UiApiParams = {
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
            expect(actualUrl).toContain(`${BASE_URI}/ui-api/records`);

            // Verify fields
            params.optionalFields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
        });

        it('should generate a valid URL when fields and optionalFields are requested', () => {
            const params: UiApiParams = {
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
            expect(actualUrl).toContain(`${BASE_URI}/ui-api/records`);

            // Verify fields
            params.fields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
            params.optionalFields.forEach((field) => {
                expect(actualUrl).toContain(field);
            });
        });

        it('should generate a valid url without losing other parameter beside fields and optionalFields', () => {
            const params: UiApiParams = {
                fields: ['Name'],
                optionalFields: ['SomeField'],
            };
            const resourceRequest = buildResourceRequest({
                basePath: '/ui-api/records',
                queryParams: {
                    modes: ['Create', 'Edit'],
                },
            });
            const actualUrl = buildAggregateUiUrl(params, resourceRequest);
            expect(actualUrl).toEqual(
                '/services/data/v53.0/ui-api/records?modes=Create,Edit&fields=Name&optionalFields=SomeField'
            );
        });
    });

    describe('shouldUseAggregateUiForFields', () => {
        it('returns true for large fields', () => {
            const actual = shouldUseAggregateUiForFields(
                generateMockedRecordFields(800).join(','),
                ''
            );

            expect(actual).toBe(true);
        });

        it('returns true for large optionalFields', () => {
            const actual = shouldUseAggregateUiForFields(
                '',
                generateMockedRecordFields(800).join(',')
            );

            expect(actual).toBe(true);
        });

        it('returns true for large combined fields and optionalFields', () => {
            const actual = shouldUseAggregateUiForFields(
                generateMockedRecordFields(400).join(','),
                generateMockedRecordFields(400).join(',')
            );

            expect(actual).toBe(true);
        });

        it('returns false for few fields', () => {
            const actual = shouldUseAggregateUiForFields(
                generateMockedRecordFields(2).join(','),
                generateMockedRecordFields(2).join(',')
            );

            expect(actual).toBe(false);
        });
    });

    describe('buildCompositeRequestByFields', () => {
        const referenceId = 'mockId';
        it('should build a CompositeRequest with a getRecord input', () => {
            const fieldCollection = ScopedFieldsCollection.fromQueryParameterValue(
                'Name,Id,Cars__c,Cars__r.Name'
            ).split();

            const actualCompositeRequest = buildCompositeRequestByFields(
                referenceId,
                buildResourceRequest({}),
                {
                    fieldCollection,
                    optionalFieldCollection: undefined,
                }
            );

            expect(actualCompositeRequest.length).toEqual(1);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
        });

        it('should create multiple chunks with fields and optionalFields', () => {
            const fieldCollection = ScopedFieldsCollection.fromQueryParameterValue(
                'Name,Id,Cars__c,Cars__r.Name'
            ).split();
            const optionalFieldCollection =
                ScopedFieldsCollection.fromQueryParameterValue('Parent_Account__c').split();

            const actualCompositeRequest = buildCompositeRequestByFields(
                referenceId,
                buildResourceRequest({}),
                {
                    fieldCollection,
                    optionalFieldCollection,
                }
            );

            expect(actualCompositeRequest.length).toEqual(2);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].url.length).toBeGreaterThan(0);
        });

        it('should create multiple chunks with a large amount of fields', () => {
            const fieldCollection = ScopedFieldsCollection.fromQueryParameterValue(
                generateMockedRecordFields(500, 'CrazyHugeCustomFieldName__c').join(',')
            ).split();

            const actualCompositeRequest = buildCompositeRequestByFields(
                referenceId,
                buildResourceRequest({}),
                {
                    fieldCollection,
                    optionalFieldCollection: undefined,
                }
            );

            expect(actualCompositeRequest.length).toBeGreaterThan(1);
            actualCompositeRequest.forEach((requestChunk) => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });
        });
    });

    describe('createAggregateBatchRequestInfo', () => {
        const endpoint = /^\/ui-api\/?(([a-zA-Z0-9]+))?$/;
        it('should return undefined because it doesnt match regex', () => {
            const subject = createAggregateBatchRequestInfo(buildResourceRequest({}), endpoint);
            expect(subject).toBe(undefined);
        });

        it('matches regex but has no fields', () => {
            const subject = createAggregateBatchRequestInfo(
                buildResourceRequest({ basePath: '/ui-api/mock' }),
                endpoint
            );
            expect(subject).toBe(undefined);
        });

        it('returns undefined because fields and optional fields are empty', () => {
            const subject = createAggregateBatchRequestInfo(
                buildResourceRequest({
                    basePath: '/ui-api/mock',
                    queryParams: { fields: '', optionalFields: '' },
                }),
                endpoint
            );
            expect(subject).toBe(undefined);
        });

        it('returns field object and is an aggregate', () => {
            const subject = createAggregateBatchRequestInfo(
                buildResourceRequest({
                    basePath: '/ui-api/mock',
                    queryParams: {
                        fields: generateMockedRecordFields(1000),
                        optionalFields: generateMockedRecordFields(1000),
                    },
                }),
                endpoint
            );

            expect(subject.fieldCollection.length).toBe(2);
            const chunK1Length = subject.fieldCollection[0].toQueryParameterValue().length;
            const chunk2Length = subject.fieldCollection[1].toQueryParameterValue().length;
            expect(chunK1Length + chunk2Length).toBe(17888);
            expect(chunK1Length).toBeLessThan(MAX_STRING_LENGTH_PER_CHUNK);
            expect(chunk2Length).toBeLessThan(MAX_STRING_LENGTH_PER_CHUNK);

            expect(subject.optionalFieldCollection.length).toBe(2);
            const chunK3Length = subject.optionalFieldCollection[0].toQueryParameterValue().length;
            const chunk4Length = subject.optionalFieldCollection[1].toQueryParameterValue().length;
            expect(chunK3Length + chunk4Length).toBe(17888);
            expect(chunK3Length).toBeLessThan(MAX_STRING_LENGTH_PER_CHUNK);
            expect(chunk4Length).toBeLessThan(MAX_STRING_LENGTH_PER_CHUNK);
        });
    });

    describe('mergeAggregateUiResponse', () => {
        it('throw error with no body', () => {
            const result = mergeAggregateUiResponse(
                {
                    status: 200,
                    body: undefined,
                    headers: {},
                    ok: true,
                    statusText: '',
                },
                mergeRecordFields
            );
            expect(result).toEqual({
                body: {
                    error: 'Error: No response body in executeAggregateUi found',
                },
                headers: {},
                ok: true,
                status: 500,
                statusText: 'Server Error',
            });
        });

        it('throw error with no responses', () => {
            const result = mergeAggregateUiResponse(
                generateFetchResponse<RecordRepresentation>([]),
                mergeRecordFields
            );
            expect(result).toEqual({
                body: {
                    error: 'Error: No response body in executeAggregateUi found',
                },
                headers: {},
                ok: true,
                status: 500,
                statusText: 'Server Error',
            });
        });

        it('to merge records together', () => {
            const firstRecord = wrapFieldsInRecordObject({
                Id: {
                    displayValue: null,
                    value: '12345',
                },
            });
            const secondRecord = wrapFieldsInRecordObject({
                Name: {
                    displayValue: 'Costco Richmond',
                    value: 'Costco Richmond',
                },
            });

            const mergeSpy = jest.fn().mockImplementation(mergeRecordFields);
            const subject = mergeAggregateUiResponse(
                generateFetchResponse<RecordRepresentation>([
                    wrapRecordInCompositeResponse(firstRecord),
                    wrapRecordInCompositeResponse(secondRecord),
                ]),
                mergeSpy
            );

            expect(mergeSpy).toBeCalledTimes(1);
            expect(subject.body.fields).toEqual({ ...firstRecord.fields, ...secondRecord.fields });
        });
    });
});
