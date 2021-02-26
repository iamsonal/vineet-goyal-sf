import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireQuickActionDefaults, mockGetQuickActionDefaultsNetwork } from 'uiapi-test-util';
import QuickActionDefaults from '../lwc/get-quick-action-defaults';

const MOCK_PREFIX = 'wire/getQuickActionDefaults/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('quick_action_defaults');
        const config = {
            actionApiName: mockData.actionApiName,
        };
        mockGetQuickActionDefaultsNetwork(config, mockData);

        const element = await setupElement(config, QuickActionDefaults);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('fetches data from network along with fields', async () => {
        const mockData = getMock('quick_action_defaults_fields');
        const config = {
            actionApiName: mockData.actionApiName,
            optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
        };
        mockGetQuickActionDefaultsNetwork(config, mockData);

        const element = await setupElement(config, QuickActionDefaults);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    describe('caching', () => {
        it('returns cached result when cached data is available', async () => {
            const mockData = getMock('quick_action_defaults_fields');
            const config = {
                actionApiName: mockData.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
            };
            mockGetQuickActionDefaultsNetwork(config, mockData);

            // populate cache
            const element1 = await setupElement(config, QuickActionDefaults);
            expect(element1.pushCount()).toBe(1);
            // second component should have the cached data without hitting network
            const element2 = await setupElement(config, QuickActionDefaults);
            expect(element2.pushCount()).toBe(1);
            expect(element1.pushCount()).toBe(1);
            expect(element2.getWiredData()).toEqualActionsSnapshot(mockData);
        });

        it('retrieves data from network when cached data is expired', async () => {
            const mockData = getMock('quick_action_defaults_fields');
            const updatedData = getMock('quick_action_defaults_fields');
            Object.assign(updatedData, {
                eTag: mockData.eTag + '999',
            });
            const config = {
                actionApiName: mockData.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
            };
            mockGetQuickActionDefaultsNetwork(config, [mockData, updatedData]);

            // populate cache
            const element1 = await setupElement(config, QuickActionDefaults);
            expect(element1.pushCount()).toBe(1);
            // expire cache
            expireQuickActionDefaults();

            // second component should retrieve from network with updated data
            const element2 = await setupElement(config, QuickActionDefaults);

            expect(element2.pushCount()).toBe(1);
            expect(element1.pushCount()).toBe(1);
            expect(element2.getWiredData()).toEqualActionsSnapshot(updatedData);
        });

        it('should make correct HTTP requests for multiple requests with same actionApiName and different optionalFields', async () => {
            const mockA = getMock('quick_action_defaults_field_make');
            const mockB = getMock('quick_action_defaults_field_model');
            const configA = {
                actionApiName: mockA.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c'],
            };
            const configB = {
                actionApiName: mockB.actionApiName,
                optionalFields: ['Custom_Object_2__c.Model__c'],
            };

            mockGetQuickActionDefaultsNetwork(configA, mockA);
            mockGetQuickActionDefaultsNetwork(configB, mockB);

            const elmA = await setupElement(configA, QuickActionDefaults);
            const elmB = await setupElement(configB, QuickActionDefaults);

            // Without the fix added in W-7081913, this test would fail because the network mocks would be hit more than once.
            expect(elmA.pushCount()).toBe(1);
            expect(elmA.getWiredData()).toEqualActionsSnapshot(mockA);
            expect(elmB.pushCount()).toBe(1);
            expect(elmB.getWiredData()).toEqualActionsSnapshot(mockB);
        });

        it('should make another HTTP request when actionApiName is already cached but optionalFields are not the same', async () => {
            const mockData1 = getMock('quick_action_defaults_fields');
            const config1 = {
                actionApiName: mockData1.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
            };
            const mockData2 = getMock('quick_action_defaults_field_number');
            const config2 = {
                actionApiName: mockData2.actionApiName,
                optionalFields: ['Custom_Object_2__c.Number__c'],
            };

            mockGetQuickActionDefaultsNetwork(config1, mockData1);
            mockGetQuickActionDefaultsNetwork(config2, mockData2);

            const wireA = await setupElement(config1, QuickActionDefaults);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData1);

            const wireB = await setupElement(config2, QuickActionDefaults);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualActionsSnapshot(mockData2);
        });

        it('should make another HTTP request when optionalFields of 2nd request is superset', async () => {
            const mockData1 = getMock('quick_action_defaults_field_make');
            const config1 = {
                actionApiName: mockData1.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c'],
            };

            const mockData2 = getMock('quick_action_defaults_fields');
            const config2 = {
                actionApiName: mockData2.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
            };

            mockGetQuickActionDefaultsNetwork(config1, mockData1);
            mockGetQuickActionDefaultsNetwork(config2, mockData2);

            const wireA = await setupElement(config1, QuickActionDefaults);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData1);

            const wireB = await setupElement(config2, QuickActionDefaults);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualActionsSnapshot(mockData2);
        });
    });

    describe('data emit', () => {
        it('emits updated data to wire with same config', async () => {
            const mockData = getMock('quick_action_defaults_fields');
            const updatedData = getMock('quick_action_defaults_fields');
            Object.assign(updatedData, {
                eTag: mockData.eTag + '999',
            });
            updatedData.fields['Make__c'].value = 'Ford1';
            const config = {
                actionApiName: mockData.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
            };
            mockGetQuickActionDefaultsNetwork(config, [mockData, updatedData]);

            const element1 = await setupElement(config, QuickActionDefaults);
            expireQuickActionDefaults();

            // fetches updated data from network
            const element2 = await setupElement(config, QuickActionDefaults);

            expect(element1.pushCount()).toBe(1);
            expect(element1.getWiredData()).toEqualActionsSnapshot(mockData);
            expect(element2.pushCount()).toBe(1);
            expect(element2.getWiredData()).toEqualActionsSnapshot(updatedData);
        });

        it('should not emit data to wires if data from network is same', async () => {
            const mockData = getMock('quick_action_defaults_fields');
            const config = {
                actionApiName: mockData.actionApiName,
                optionalFields: ['Custom_Object_2__c.Make__c', 'Custom_Object_2__c.Model__c'],
            };
            mockGetQuickActionDefaultsNetwork(config, [mockData, mockData]);

            const element = await setupElement(config, QuickActionDefaults);
            expireQuickActionDefaults();

            // fetches updated data from network
            await setupElement(config, QuickActionDefaults);

            expect(element.pushCount()).toBe(1);
            expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
        });

        it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
            const mockError = getMock('quick_action_defaults_error');

            const config = {
                actionApiName: 'Create_Custom_Object_3',
            };
            mockGetQuickActionDefaultsNetwork(config, {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            });

            const element = await setupElement(config, QuickActionDefaults);

            expect(element.pushCount()).toBe(1);
            expect(element.getWiredError()).toContainErrorResponse(mockError);

            const elementB = await setupElement(config, QuickActionDefaults);

            expect(elementB.pushCount()).toBe(1);
            expect(elementB.getWiredError()).toContainErrorResponse(mockError);
        });

        it('should refresh when ingested error exceeds ttl', async () => {
            const mock = getMock('quick_action_defaults');
            const mockError = getMock('quick_action_defaults_error');

            const config = {
                actionApiName: 'NewContact',
            };
            mockGetQuickActionDefaultsNetwork(config, [
                {
                    status: 404,
                    statusText: 'Not Found',
                    ok: false,
                    reject: true,
                    data: mockError,
                },
                mock,
            ]);

            const element = await setupElement(config, QuickActionDefaults);

            expect(element.pushCount()).toBe(1);
            expect(element.getWiredError()).toContainErrorResponse(mockError);

            expireQuickActionDefaults();

            const elementB = await setupElement(config, QuickActionDefaults);

            expect(elementB.pushCount()).toBe(1);
            expect(elementB.getWiredError()).toBeUndefined();
            expect(elementB.getWiredData()).toEqualActionsSnapshot(mock);
        });
    });
});
