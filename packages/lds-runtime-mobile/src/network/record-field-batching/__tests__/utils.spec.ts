import {
    buildAggregateUiUrl,
    mergeRecordFields,
    shouldUseAggregateUiForFields,
    UiApiParams,
} from '../utils';
import { BASE_URI, buildResourceRequest, generateMockedRecordFields } from './testUtils';

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
            params.fields.forEach(field => {
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
            params.optionalFields.forEach(field => {
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
            params.fields.forEach(field => {
                expect(actualUrl).toContain(field);
            });
            params.optionalFields.forEach(field => {
                expect(actualUrl).toContain(field);
            });
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
});

export function wrapFieldsInRecordObject(fields: any) {
    return {
        apiName: 'foo',
        childRelationships: {},
        eTag: 'eTag',
        fields: fields,
        id: 'oppy',
        systemModstamp: '01-01-1970',
        lastModifiedById: 'user',
        lastModifiedDate: '01-01-1970',
        recordTypeId: 'recordTypeId',
        recordTypeInfo: null,
        weakEtag: 1,
    };
}
