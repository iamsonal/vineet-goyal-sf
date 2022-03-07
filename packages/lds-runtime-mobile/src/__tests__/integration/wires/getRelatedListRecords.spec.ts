import { customMatchers } from '@salesforce/lds-jest';

import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { JSONStringify } from '../../../utils/language';
import { resetLuvioStore, setup } from './integrationTestSetup';
import mockGetRelatedListRecords from './data/list-ui-All-Related-Lists.json';
import { MockNimbusDurableStore } from '../../MockNimbusDurableStore';
import { flushPromises, clone } from '../../testUtils';

import mockData_Service_Appointments__r from './data/related-list-records/related-list-records-Service_Appointments__r.json';

const RELATED_LIST_RECORD_COLLECTION_PRIVATE_FIELDS = [
    'currentPageUrl',
    'nextPageUrl',
    'previousPageUrl',
];

function base64Encode(input) {
    // using nodejs API for base64 conversion here
    return Buffer.from(input, 'utf8').toString('base64');
}

function convertToSyntheticTokens(result) {
    ['currentPageToken', 'nextPageToken', 'previousPageToken'].forEach((token) => {
        if (result[token] !== undefined && result[token] !== null) {
            result[token] = base64Encode(`client:${result[token]}`);
        }
    });
    return result;
}

// add toEqualFulfilledSnapshotWithData custom matcher
expect.extend(customMatchers);

describe('mobile runtime integration tests', () => {
    let networkAdapter: MockNimbusNetworkAdapter;
    let getRelatedListRecords;
    let durableStore: MockNimbusDurableStore;

    beforeEach(async () => {
        ({ networkAdapter, getRelatedListRecords, durableStore } = await setup());
    });
    describe('getRelatedListRecords', () => {
        it('only triggers one durable notify change event once', async () => {
            const durableChangeListener = jest.fn();
            durableStore.registerOnChangedListenerWithBatchInfo(durableChangeListener);

            networkAdapter // Set the mock response
                .setMockResponse({
                    status: 200,
                    headers: {},
                    body: JSONStringify(mockGetRelatedListRecords),
                });

            const relatedListRecordsConfig = {
                parentRecordId: mockGetRelatedListRecords.listReference.inContextOfRecordId,
                relatedListId: mockGetRelatedListRecords.listReference.relatedListId,
                fields: mockGetRelatedListRecords.fields,
            };

            const snapshot = await getRelatedListRecords(relatedListRecordsConfig);
            expect(snapshot.state).toBe('Fulfilled');

            await flushPromises();

            expect(durableChangeListener).toBeCalledTimes(1);
            expect(networkAdapter.sentRequests.length).toEqual(1);

            await resetLuvioStore();

            const durableSnapshot = await getRelatedListRecords(relatedListRecordsConfig);
            expect(durableSnapshot.state).toBe('Fulfilled');

            await flushPromises();

            expect(networkAdapter.sentRequests.length).toEqual(1);
            expect(durableChangeListener).toBeCalledTimes(1);
        });

        it('emits a value on a 404 response', async () => {
            const relatedListRecordsConfig = {
                parentRecordId: mockGetRelatedListRecords.listReference.inContextOfRecordId,
                relatedListId: mockGetRelatedListRecords.listReference.relatedListId,
                fields: mockGetRelatedListRecords.fields,
            };

            const errorResponseBody = {
                hasErrors: true,
                results: [
                    {
                        result: [
                            {
                                errorCode: 'NOT_FOUND',
                                message: 'Resource not found.',
                            },
                        ],
                        statusCode: 404,
                    },
                ],
            };

            networkAdapter.setMockResponse({
                status: 404,
                headers: {},
                body: JSONStringify(errorResponseBody),
            });

            const snapshot = await getRelatedListRecords(relatedListRecordsConfig);

            expect(snapshot.state).toBe('Error');
        });

        describe('SFS scenarios', () => {
            it('returns success - many optional fields', async () => {
                networkAdapter.setMockResponse({
                    status: 200,
                    headers: {},
                    body: JSONStringify(mockData_Service_Appointments__r),
                });

                const config = {
                    relatedListId: 'Service_Appointments__r',
                    parentRecordId: '0Hwx000000110HSCAY',
                    optionalFields: [
                        'ServiceAppointment.Id',
                        'ServiceAppointment.OwnerId',
                        'ServiceAppointment.IsDeleted',
                        'ServiceAppointment.AppointmentNumber',
                        'ServiceAppointment.CreatedDate',
                        'ServiceAppointment.CreatedById',
                        'ServiceAppointment.LastModifiedDate',
                        'ServiceAppointment.LastModifiedById',
                        'ServiceAppointment.SystemModstamp',
                        'ServiceAppointment.MayEdit',
                        'ServiceAppointment.IsLocked',
                        'ServiceAppointment.LastViewedDate',
                        'ServiceAppointment.LastReferencedDate',
                        'ServiceAppointment.ParentRecordId',
                        'ServiceAppointment.ParentRecordType',
                        'ServiceAppointment.AccountId',
                        'ServiceAppointment.ContactId',
                        'ServiceAppointment.Street',
                        'ServiceAppointment.City',
                        'ServiceAppointment.State',
                        'ServiceAppointment.PostalCode',
                        'ServiceAppointment.Country',
                        'ServiceAppointment.Latitude',
                        'ServiceAppointment.Longitude',
                        'ServiceAppointment.GeocodeAccuracy',
                        'ServiceAppointment.Description',
                        'ServiceAppointment.EarliestStartTime',
                        'ServiceAppointment.DueDate',
                        'ServiceAppointment.Duration',
                        'ServiceAppointment.ArrivalWindowStartTime',
                        'ServiceAppointment.ArrivalWindowEndTime',
                        'ServiceAppointment.Status',
                        'ServiceAppointment.SchedStartTime',
                        'ServiceAppointment.SchedEndTime',
                        'ServiceAppointment.ActualStartTime',
                        'ServiceAppointment.ActualEndTime',
                        'ServiceAppointment.ActualDuration',
                        'ServiceAppointment.DurationType',
                        'ServiceAppointment.DurationInMinutes',
                        'ServiceAppointment.ServiceTerritoryId',
                        'ServiceAppointment.Subject',
                        'ServiceAppointment.ParentRecordStatusCategory',
                        'ServiceAppointment.SACount__c',
                        'ServiceAppointment.Incomplete_Status_Count__c',
                        'ServiceAppointment.FSL__Appointment_Grade__c',
                        'ServiceAppointment.FSL__Auto_Schedule__c',
                        'ServiceAppointment.FSL__Emergency__c',
                        'ServiceAppointment.FSL__GanttColor__c',
                        'ServiceAppointment.FSL__GanttLabel__c',
                        'ServiceAppointment.FSL__InJeopardyReason__c',
                        'ServiceAppointment.FSL__InJeopardy__c',
                        'ServiceAppointment.FSL__InternalSLRGeolocation__Latitude__s',
                        'ServiceAppointment.FSL__InternalSLRGeolocation__Longitude__s',
                        'ServiceAppointment.FSL__IsFillInCandidate__c',
                        'ServiceAppointment.FSL__IsMultiDay__c',
                        'ServiceAppointment.FSL__MDS_Calculated_length__c',
                        'ServiceAppointment.FSL__MDT_Operational_Time__c',
                        'ServiceAppointment.FSL__Pinned__c',
                        'ServiceAppointment.FSL__Prevent_Geocoding_For_Chatter_Actions__c',
                        'ServiceAppointment.FSL__Related_Service__c',
                        'ServiceAppointment.FSL__Same_Day__c',
                        'ServiceAppointment.FSL__Same_Resource__c',
                        'ServiceAppointment.FSL__Schedule_Mode__c',
                        'ServiceAppointment.FSL__Schedule_over_lower_priority_appointment__c',
                        'ServiceAppointment.FSL__Time_Dependency__c',
                        'ServiceAppointment.FSL__UpdatedByOptimization__c',
                        'ServiceAppointment.FSL__Virtual_Service_For_Chatter_Action__c',
                        'ServiceAppointment.ResourceAbsenceId__c',
                        'ServiceAppointment.ServiceResourceId__c',
                        'ServiceAppointment.ProductId__c',
                        'ServiceAppointment.TimeSheetId__c',
                        'ServiceAppointment.TimeSheetEntryId__c',
                    ],
                };

                const snapshot = await getRelatedListRecords(config);
                const expected = convertToSyntheticTokens(clone(mockData_Service_Appointments__r));

                expect(snapshot).toEqualFulfilledSnapshotWithData(
                    expected,
                    RELATED_LIST_RECORD_COLLECTION_PRIVATE_FIELDS
                );
            });
        });
    });
});
