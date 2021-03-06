import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest, ERROR_RESPONSE } from './test-utils';

jest.mock('@salesforce/lds-environment-settings', () => {
    return {
        EnvironmentSettings: {},
        getEnvironmentSetting: () => {
            return false;
        },
    };
});

import { instrumentation } from '../instrumentation';

const instrumentationSpies = {
    logCrud: jest.spyOn(instrumentation, 'logCrud'),
};

beforeEach(() => {
    instrumentationSpies.logCrud.mockClear();
});

describe('crud logging', () => {
    describe('create', () => {
        it('logs create event when createRecord is called', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/records`,
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
            };

            const response = {
                id: '1234',
                fields: {
                    Id: {
                        value: '1234',
                    },
                },
                apiName: 'Test__c',
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('create', {
                recordId: '1234',
                recordType: 'Test__c',
                state: 'SUCCESS',
            });
        });

        it('logs create event when createRecord is called but returns error', async () => {
            const request = {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: ['Id'],
                },
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('read', {
                    recordId: '1234',
                    state: 'ERROR',
                });
            }
        });
    });
    describe('read', () => {
        it('logs read event when getRecord is called', async () => {
            const request = {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: ['Id'],
                },
            };

            const response = {
                id: '1234',
                fields: {
                    Id: {
                        value: '1234',
                    },
                },
                apiName: 'Foo',
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('read', {
                recordId: '1234',
                recordType: 'Foo',
                state: 'SUCCESS',
            });
        });

        it('logs read event when getRecord is called but returns error', async () => {
            const request = {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: ['Id'],
                },
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('read', {
                    recordId: '1234',
                    state: 'ERROR',
                });
            }
        });

        it('logs read event when postRelatedListRecords is called', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/001RM000004km7aYAA/Account?pageSize=10`,
                urlParams: {
                    parentRecordId: '001RM000004km7aYAA',
                    relatedListId: 'Contacts',
                },
                body: {
                    fields: ['Contact.Id', 'Contact.Name'],
                    optionalFields: ['Contact.Email', 'Contact.LastName'],
                    pageSize: 50,
                    pageToken: 0,
                },
            };

            const response = {
                count: 1,
                currentPageToken: '0',
                currentPageUrl:
                    '/services/data/v55.0/ui-api/related-list-records/001RM000004km7aYAA/Contacts?fields=Contact.Id%2CContact.Name&optionalFields=Contact.Email%2CContact.LastName&pageSize=50&pageToken=0',
                fields: ['Contact.Id', 'Contact.Name'],
                listInfoETag: null,
                listReference: {
                    id: null,
                    inContextOfRecordId: '001RM000004km7aYAA',
                    listViewApiName: null,
                    objectApiName: null,
                    parentObjectApiName: 'Account',
                    recordTypeId: null,
                    relatedListId: 'Contacts',
                    type: 'relatedList',
                },
                nextPageToken: null,
                nextPageUrl: null,
                optionalFields: ['Contact.Email', 'Contact.LastName'],
                pageSize: 50,
                previousPageToken: null,
                previousPageUrl: null,
                records: [
                    {
                        apiName: 'Contact',
                        childRelationships: {},
                        eTag: 'b6c2ae213a152b2e0f6eda2407724b9b',
                        fields: {
                            Email: {
                                displayValue: null,
                                value: null,
                            },
                            Id: {
                                displayValue: null,
                                value: '003RM000006Swh5YAC',
                            },
                            LastName: {
                                displayValue: null,
                                value: 'User',
                            },
                            Name: {
                                displayValue: null,
                                value: 'Test User',
                            },
                        },
                        id: '003RM000006Swh5YAC',
                        lastModifiedById: '005RM000001zVSEYA2',
                        lastModifiedDate: '2020-12-09T20:08:01.000Z',
                        recordTypeId: '012000000000000AAA',
                        recordTypeInfo: null,
                        systemModstamp: '2020-12-09T20:08:03.000Z',
                        weakEtag: 1607544483000,
                    },
                    {
                        apiName: 'Contact',
                        childRelationships: {},
                        eTag: 'b6c2ae213a152b2e0f6eda2407724b9b',
                        fields: {
                            Email: {
                                displayValue: null,
                                value: null,
                            },
                            Id: {
                                displayValue: null,
                                value: '003RM000006Swh5YAC',
                            },
                            LastName: {
                                displayValue: null,
                                value: 'User',
                            },
                            Name: {
                                displayValue: null,
                                value: 'Test User',
                            },
                        },
                        id: '003RM000006Swh5YAD',
                        lastModifiedById: '005RM000001zVSEYA2',
                        lastModifiedDate: '2020-12-09T20:08:01.000Z',
                        recordTypeId: '012000000000000AAA',
                        recordTypeInfo: null,
                        systemModstamp: '2020-12-09T20:08:03.000Z',
                        weakEtag: 1607544483000,
                    },
                ],
                sortBy: [],
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('reads', {
                parentRecordId: '001RM000004km7aYAA',
                recordIds: ['003RM000006Swh5YAC', '003RM000006Swh5YAD'],
                recordType: 'Contact',
                relatedListId: 'Contacts',
                state: 'SUCCESS',
            });
        });

        it('does not log read event when postRelatedListRecords is called but no records are returned', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/001RM000004km7aYAA/Account?pageSize=10`,
                urlParams: {
                    parentRecordId: '001RM000004km7aYAA',
                    relatedListId: 'Contacts',
                },
                body: {
                    fields: ['Contact.Id', 'Contact.Name'],
                    optionalFields: ['Contact.Email', 'Contact.LastName'],
                    pageSize: 50,
                    pageToken: 0,
                },
            };

            const response = {
                count: 1,
                currentPageToken: 0,
                currentPageUrl:
                    '/services/data/v55.0/ui-api/related-list-records/001RM000004km7aYAA/Contacts?fields=Contact.Id%2CContact.Name&optionalFields=Contact.Email%2CContact.LastName&pageSize=50&pageToken=0',
                fields: ['Contact.Id', 'Contact.Name'],
                listInfoETag: null,
                listReference: {
                    id: null,
                    inContextOfRecordId: '001RM000004km7aYAA',
                    listViewApiName: null,
                    objectApiName: null,
                    parentObjectApiName: 'Account',
                    recordTypeId: null,
                    relatedListId: 'Contacts',
                    type: 'relatedList',
                },
                nextPageToken: null,
                nextPageUrl: null,
                optionalFields: ['Contact.Email', 'Contact.LastName'],
                pageSize: 50,
                previousPageToken: null,
                previousPageUrl: null,
                records: [],
                sortBy: [],
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(0);
        });

        it('logs read event when postRelatedListRecords is called but returns error', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/001RM000004km7aYAA/Account?pageSize=10`,
                urlParams: {
                    parentRecordId: '001RM000004km7aYAA',
                    relatedListId: 'Contacts',
                },
                body: {
                    fields: ['Contact.Id, Contact.Name'],
                    optionalFields: ['Contact.Email, Contact.LastName'],
                    pageSize: 50,
                    pageToken: 0,
                },
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('reads', {
                    parentRecordId: '001RM000004km7aYAA',
                    relatedListId: 'Contacts',
                    state: 'ERROR',
                });
            }
        });

        it('logs read event when postRelatedListRecordsBatch is called', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/batch/a00RM0000004aVwYAI`,
                urlParams: {
                    parentRecordId: 'a00RM0000004aVwYAI',
                },
                body: {
                    relatedListParameters: [
                        {
                            relatedListId: 'CwcCustom02s__r',
                        },
                        {
                            relatedListId: 'CwcCustom01s__r',
                        },
                    ],
                },
                queryParams: {},
            };

            const response = {
                results: [
                    {
                        result: {
                            count: 0,
                            currentPageToken: '0',
                            currentPageUrl:
                                '/services/data/v55.0/ui-api/related-list-records/a00RM0000004aVwYAI/CwcCustom02s__r?pageSize=50&pageToken=0',
                            fields: [],
                            listInfoETag: null,
                            listReference: {
                                id: null,
                                inContextOfRecordId: 'a00RM0000004aVwYAI',
                                listViewApiName: null,
                                objectApiName: null,
                                parentObjectApiName: 'CwcCustom00__c',
                                recordTypeId: null,
                                relatedListId: 'CwcCustom02s__r',
                                type: 'relatedList',
                            },
                            nextPageToken: null,
                            nextPageUrl: null,
                            optionalFields: [],
                            pageSize: 50,
                            previousPageToken: null,
                            previousPageUrl: null,
                            records: [
                                {
                                    apiName: 'CwcCustom02__c',
                                    childRelationships: {},
                                    eTag: '85c515df26da980869a5765e752e7ae5',
                                    fields: {},
                                    id: 'a01RM000000vPOBYA1',
                                    lastModifiedById: '005RM000001a3zXYAQ',
                                    lastModifiedDate: '2020-02-27T21:08:42.000Z',
                                    recordTypeId: '012000000000000AAA',
                                    recordTypeInfo: null,
                                    systemModstamp: '2020-02-27T21:08:42.000Z',
                                    weakEtag: 1582837722000,
                                },
                            ],
                            sortBy: [],
                        },
                        statusCode: 200,
                    },
                    {
                        result: {
                            count: 8,
                            currentPageToken: 0,
                            currentPageUrl:
                                '/services/data/v55.0/ui-api/related-list-records/a00RM0000004aVwYAI/CwcCustom01s__r?pageSize=50&pageToken=0',
                            fields: [],
                            listInfoETag: null,
                            listReference: {
                                id: null,
                                inContextOfRecordId: 'a00RM0000004aVwYAI',
                                listViewApiName: null,
                                objectApiName: null,
                                parentObjectApiName: 'CwcCustom00__c',
                                recordTypeId: null,
                                relatedListId: 'CwcCustom01s__r',
                                type: 'relatedList',
                            },
                            nextPageToken: null,
                            nextPageUrl: null,
                            optionalFields: [],
                            pageSize: 50,
                            previousPageToken: null,
                            previousPageUrl: null,
                            records: [
                                {
                                    apiName: 'CwcCustom01__c',
                                    childRelationships: {},
                                    eTag: '85c515df26da980869a5765e752e7ae5',
                                    fields: {},
                                    id: 'a01RM000000vPOBYA2',
                                    lastModifiedById: '005RM000001a3zXYAQ',
                                    lastModifiedDate: '2020-02-27T21:08:42.000Z',
                                    recordTypeId: '012000000000000AAA',
                                    recordTypeInfo: null,
                                    systemModstamp: '2020-02-27T21:08:42.000Z',
                                    weakEtag: 1582837722000,
                                },
                                {
                                    apiName: 'CwcCustom01__c',
                                    childRelationships: {},
                                    eTag: '4eeb73800e805c99c89e1b116f018152',
                                    fields: {},
                                    id: 'a01RM000000qecDYAQ',
                                    lastModifiedById: '005RM000001a3zXYAQ',
                                    lastModifiedDate: '2019-10-08T15:45:38.000Z',
                                    recordTypeId: '012000000000000AAA',
                                    recordTypeInfo: null,
                                    systemModstamp: '2019-10-08T15:45:42.000Z',
                                    weakEtag: 1570549542000,
                                },
                                {
                                    apiName: 'CwcCustom01__c',
                                    childRelationships: {},
                                    eTag: '806595d125a12489f9e2d1ec7e57845c',
                                    fields: {},
                                    id: 'a01RM000000v7ThYAI',
                                    lastModifiedById: '005RM000001a3zXYAQ',
                                    lastModifiedDate: '2019-10-07T15:29:38.000Z',
                                    recordTypeId: '012000000000000AAA',
                                    recordTypeInfo: null,
                                    systemModstamp: '2019-10-07T15:29:40.000Z',
                                    weakEtag: 1570462180000,
                                },
                            ],
                            sortBy: [],
                        },
                        statusCode: 200,
                    },
                ],
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(2);
            expect(instrumentationSpies.logCrud).toHaveBeenNthCalledWith(1, 'reads', {
                parentRecordId: 'a00RM0000004aVwYAI',
                recordIds: ['a01RM000000vPOBYA1'],
                recordType: 'CwcCustom02__c',
                relatedListId: 'CwcCustom02s__r',
                state: 'SUCCESS',
            });
            expect(instrumentationSpies.logCrud).toHaveBeenNthCalledWith(2, 'reads', {
                parentRecordId: 'a00RM0000004aVwYAI',
                recordIds: ['a01RM000000vPOBYA2', 'a01RM000000qecDYAQ', 'a01RM000000v7ThYAI'],
                recordType: 'CwcCustom01__c',
                relatedListId: 'CwcCustom01s__r',
                state: 'SUCCESS',
            });
        });

        it('logs read event when postRelatedListRecordsBatch is called but a result is error', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/batch/a00RM0000004aVwYAI`,
                urlParams: {
                    parentRecordId: 'a00RM0000004aVwYAI',
                },
                body: {
                    relatedListParameters: [
                        {
                            relatedListId: 'CwcCustom02s__r',
                        },
                        {
                            relatedListId: 'CwcCustom01s__r',
                        },
                    ],
                },
                queryParams: {},
            };

            const response = {
                results: [
                    {
                        result: {
                            count: 0,
                            currentPageToken: '0',
                            currentPageUrl:
                                '/services/data/v55.0/ui-api/related-list-records/a00RM0000004aVwYAI/CwcCustom02s__r?pageSize=50&pageToken=0',
                            fields: [],
                            listInfoETag: null,
                            listReference: {
                                id: null,
                                inContextOfRecordId: 'a00RM0000004aVwYAI',
                                listViewApiName: null,
                                objectApiName: null,
                                parentObjectApiName: 'CwcCustom00__c',
                                recordTypeId: null,
                                relatedListId: 'CwcCustom02s__r',
                                type: 'relatedList',
                            },
                            nextPageToken: null,
                            nextPageUrl: null,
                            optionalFields: [],
                            pageSize: 50,
                            previousPageToken: null,
                            previousPageUrl: null,
                            records: [
                                {
                                    apiName: 'CwcCustom02__c',
                                    childRelationships: {},
                                    eTag: '85c515df26da980869a5765e752e7ae5',
                                    fields: {},
                                    id: 'a01RM000000vPOBYA1',
                                    lastModifiedById: '005RM000001a3zXYAQ',
                                    lastModifiedDate: '2020-02-27T21:08:42.000Z',
                                    recordTypeId: '012000000000000AAA',
                                    recordTypeInfo: null,
                                    systemModstamp: '2020-02-27T21:08:42.000Z',
                                    weakEtag: 1582837722000,
                                },
                            ],
                            sortBy: [],
                        },
                        statusCode: 200,
                    },
                    {
                        result: [
                            {
                                errorCode: 'INVALID_TYPE',
                                message:
                                    'The related lists UI API currently does not support this related list',
                            },
                        ],
                        statusCode: 400,
                    },
                ],
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('reads', {
                parentRecordId: 'a00RM0000004aVwYAI',
                recordIds: ['a01RM000000vPOBYA1'],
                recordType: 'CwcCustom02__c',
                relatedListId: 'CwcCustom02s__r',
                state: 'SUCCESS',
            });
        });

        it('logs read event when postRelatedListRecordsBatch is called but returns error', async () => {
            const request = {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/batch/a00RM0000004aVwYAI`,
                urlParams: {
                    parentRecordId: 'a00RM0000004aVwYAI',
                },
                body: {
                    relatedListParameters: [
                        {
                            relatedListId: 'CwcCustom02s__r',
                        },
                        {
                            relatedListId: 'CwcCustom01s__r',
                        },
                    ],
                },
                queryParams: {},
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('reads', {
                    parentRecordId: 'a00RM0000004aVwYAI',
                    relatedListIds: ['CwcCustom02s__r', 'CwcCustom01s__r'],
                    state: 'ERROR',
                });
            }
        });
    });
    describe('update', () => {
        it('logs update event when updateRecord is called', async () => {
            const request = {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
            };

            const response = {
                id: '1234',
                apiName: 'Test__c',
                fields: {},
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('update', {
                recordId: '1234',
                recordType: 'Test__c',
                state: 'SUCCESS',
            });
        });

        it('logs update event when updateRecord is called but returns error', async () => {
            const request = {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('update', {
                    state: 'ERROR',
                });
            }
        });
    });
    describe('delete', () => {
        it('logs delete event when deleteRecord is called', async () => {
            const request = {
                method: 'delete',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                body: {},
            };

            // the response from RecordUiController.deleteRecord is null
            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(null);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('delete', {
                recordId: '1234',
                state: 'SUCCESS',
            });
        });

        it('logs delete event when deleteRecord is called but returns error', async () => {
            const request = {
                method: 'delete',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                body: {},
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCrud).toHaveBeenCalledWith('delete', {
                    recordId: '1234',
                    state: 'ERROR',
                });
            }
        });
    });
});
