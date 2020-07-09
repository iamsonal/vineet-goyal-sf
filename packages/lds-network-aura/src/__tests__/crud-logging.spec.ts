import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest, ERROR_RESPONSE } from './test-utils';
import { generateMockedRecordFields } from './execute-aggregate-ui.spec';
import { HttpStatusCode } from '@ldsjs/engine';

jest.mock('@salesforce/lds-environment-settings', () => {
    return {
        EnvironmentSettings: {},
        getEnvironmentSetting: () => {
            return false;
        },
    };
});

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        logCRUDLightningInteraction: jest.fn(),
    };

    return {
        incrementGetRecordAggregateInvokeCount: () => {},
        incrementGetRecordNormalInvokeCount: () => {},
        registerLdsCacheStats: () => {},
        logCRUDLightningInteraction: spies.logCRUDLightningInteraction,
        __spies: spies,
    };
});

import { __spies as instrumentationSpies } from '@salesforce/lds-instrumentation';

beforeEach(() => {
    instrumentationSpies.logCRUDLightningInteraction.mockClear();
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

            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                'create',
                {
                    recordId: '1234',
                    recordType: 'Test__c',
                    state: 'SUCCESS',
                }
            );
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
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                    'read',
                    {
                        recordId: '1234',
                        state: 'ERROR',
                    }
                );
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

            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith('read', {
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
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                    'read',
                    {
                        recordId: '1234',
                        state: 'ERROR',
                    }
                );
            }
        });
    });
    describe('executeAggregateUi', () => {
        it('logs read event when getRecord is called', async () => {
            const request = {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: generateMockedRecordFields(800),
                },
            };

            const response = {
                compositeResponse: [
                    {
                        body: {
                            recordId: '1234',
                            apiName: 'Foo',
                            fields: { Field1__c: { value: '1', displayValue: '10' } },
                        },
                        httpStatusCode: HttpStatusCode.Ok,
                    },
                    {
                        body: {
                            recordId: '1234',
                            apiName: 'Foo',
                            fields: { Field2__c: { value: '2', displayValue: '20' } },
                        },
                        httpStatusCode: HttpStatusCode.Ok,
                    },
                    {
                        body: {
                            recordId: '1234',
                            apiName: 'Foo',
                            fields: { Field3__c: { value: '3', displayValue: '30' } },
                        },
                        httpStatusCode: HttpStatusCode.Ok,
                    },
                ],
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith('read', {
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
                    fields: generateMockedRecordFields(800),
                },
            };

            const aggregateErrorResponse = {
                compositeResponse: [
                    {
                        body: {
                            recordId: '1234',
                            apiName: 'Foo',
                            fields: { Field1__c: { value: '1', displayValue: '10' } },
                        },
                    },
                    {
                        httpStatusCode: HttpStatusCode.ServerError,
                    },
                    {
                        body: {
                            recordId: '1234',
                            apiName: 'Foo',
                            fields: { Field3__c: { value: '3', displayValue: '30' } },
                        },
                    },
                ],
            };

            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(
                aggregateErrorResponse
            );
            try {
                await networkAdapter(buildResourceRequest(request));
            } catch (err) {
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                    'read',
                    {
                        recordId: '1234',
                        state: 'ERROR',
                    }
                );
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

            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                'update',
                {
                    recordId: '1234',
                    recordType: 'Test__c',
                    state: 'SUCCESS',
                }
            );
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
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                    'update',
                    {
                        state: 'ERROR',
                    }
                );
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

            const response = {
                id: '1234',
                apiName: 'Test__c',
                fields: {},
            };

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
            await networkAdapter(buildResourceRequest(request));

            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                'delete',
                {
                    recordId: '1234',
                    recordType: 'Test__c',
                    state: 'SUCCESS',
                }
            );
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
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.logCRUDLightningInteraction).toHaveBeenCalledWith(
                    'delete',
                    {
                        recordId: '1234',
                        state: 'ERROR',
                    }
                );
            }
        });
    });
});
