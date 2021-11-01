import { getRecordTemplateClone_imperative } from 'lds-adapters-uiapi';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    expireObjectInfo,
    mockGetObjectInfoNetwork,
    mockGetRecordTemplateCloneNetwork,
    expireCloneTemplateRepresentation,
} from 'uiapi-test-util';

import GetRecord from '../../../getRecord/__karma__/lwc/record-fields';
import GetObjectInfo from '../../../getObjectInfo/__karma__/lwc/object-basic';
import GetRecordTemplateClone from '../lwc/get-record-template-clone';
import { expireRecords, mockGetRecordNetwork } from '../../../../../karma/uiapi-test-util';
import { flushPromises, stripEtags } from 'test-util';

const MOCK_PREFIX = 'wire/getRecordTemplateClone/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('GetRecordTemplateClone', () => {
    it('should make HTTP request when recordTypeId param is undefined and response contains master rtId', async () => {
        const mock = getMock('record-template-clone-Custom_Object__c');
        const recordId = mock.record.cloneSourceId;
        const config = {
            recordId,
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make another HTTP request when master recordTypeId is also the default recordTypeId', async () => {
        const mock = getMock('record-template-clone-Custom_Object__c');
        const recordId = mock.record.cloneSourceId;
        const recordTypeId = mock.record.recordTypeId;
        const config = {
            recordId,
            recordTypeId,
        };

        const config2 = {
            recordId,
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const elm2 = await setupElement(config2, GetRecordTemplateClone);
        expect(elm2.pushCount()).toBe(1);
        expect(elm2.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make another HTTP request when config is the same', async () => {
        const mock = getMock('record-template-clone-Custom_Object_2__c-optionalField-Number');
        const recordId = mock.record.cloneSourceId;
        const recordTypeId = mock.record.recordTypeId;
        const apiName = mock.record.apiName;
        const config = {
            recordId,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const wireA = await setupElement(config, GetRecordTemplateClone);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetRecordTemplateClone);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make another HTTP request when optionalFields of 2nd request is superset', async () => {
        const numberMock = getMock('record-template-clone-Custom_Object_2__c-optionalField-Number');
        const numberMockRecordId = numberMock.record.cloneSourceId;
        const numberMockRecordTypeId = numberMock.record.recordTypeId;
        const numberMockApiName = numberMock.record.apiName;
        const lookupNumberMock = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-Lookup-Number'
        );
        const lookupNumberMockRecordId = lookupNumberMock.record.cloneSourceId;
        const lookupNumberMockRecordTypeId = lookupNumberMock.record.recordTypeId;
        const lookupNumberMockApiName = lookupNumberMock.record.apiName;

        const numberConfig = {
            recordId: numberMockRecordId,
            optionalFields: [`${numberMockApiName}.Number__c`],
            recordTypeId: numberMockRecordTypeId,
        };

        const lookupNumberConfig = {
            recordId: lookupNumberMockRecordId,
            optionalFields: [
                `${lookupNumberMockApiName}.Account__c`,
                `${lookupNumberMockApiName}.Account__r.Id`,
                `${lookupNumberMockApiName}.Account__r.Name`,
                `${lookupNumberMockApiName}.Number__c`,
            ],
            recordTypeId: lookupNumberMockRecordTypeId,
        };

        const lookupNumberNetworkConfig = {
            recordId: lookupNumberMockRecordId,
            optionalFields: [
                `${lookupNumberMockApiName}.Account__c`,
                `${lookupNumberMockApiName}.Account__r.Id`,
                `${lookupNumberMockApiName}.Account__r.Name`,
                `${lookupNumberMockApiName}.CloneSourceId`,
                `${lookupNumberMockApiName}.Number__c`,
            ],
            recordTypeId: lookupNumberMockRecordTypeId,
        };

        mockGetRecordTemplateCloneNetwork(numberConfig, numberMock);
        mockGetRecordTemplateCloneNetwork(lookupNumberNetworkConfig, lookupNumberMock);

        const wireA = await setupElement(numberConfig, GetRecordTemplateClone);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

        const wireB = await setupElement(lookupNumberConfig, GetRecordTemplateClone);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(lookupNumberMock);

        expect(wireA.pushCount()).toBe(2);
    });

    it('should make another HTTP request when optionalFields for both wires are not the same set', async () => {
        const numberMock = getMock('record-template-clone-Custom_Object_2__c-optionalField-Number');
        const numberMockRecordId = numberMock.record.cloneSourceId;
        const numberMockRecordTypeId = numberMock.record.recordTypeId;
        const numberMockApiName = numberMock.record.apiName;

        const lookupMock = getMock('record-template-clone-Custom_Object_2__c-optionalField-Lookup');
        const lookupMockRecordId = lookupMock.record.cloneSourceId;
        const lookupMockRecordTypeId = lookupMock.record.recordTypeId;
        const lookupMockApiName = lookupMock.record.apiName;

        const lookupNumberMock = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-Lookup-Number'
        );
        const lookupNumberMockRecordId = lookupNumberMock.record.cloneSourceId;
        const lookupNumberMockRecordTypeId = lookupNumberMock.record.recordTypeId;
        const lookupNumberMockApiName = lookupNumberMock.record.apiName;

        const numberConfig = {
            recordId: numberMockRecordId,
            optionalFields: [`${numberMockApiName}.Number__c`],
            recordTypeId: numberMockRecordTypeId,
        };

        const lookupConfig = {
            recordId: lookupMockRecordId,
            optionalFields: [
                `${lookupMockApiName}.Account__c`,
                `${lookupMockApiName}.Account__r.Id`,
                `${lookupMockApiName}.Account__r.Name`,
            ],
            recordTypeId: lookupMockRecordTypeId,
        };

        const lookupNumberNetwork = {
            recordId: lookupNumberMockRecordId,
            optionalFields: [
                `${lookupNumberMockApiName}.Account__c`,
                `${lookupNumberMockApiName}.Account__r.Id`,
                `${lookupNumberMockApiName}.Account__r.Name`,
                `${lookupNumberMockApiName}.CloneSourceId`,
                `${lookupNumberMockApiName}.Number__c`,
            ],
            recordTypeId: lookupNumberMockRecordTypeId,
        };

        mockGetRecordTemplateCloneNetwork(numberConfig, numberMock);
        mockGetRecordTemplateCloneNetwork(lookupNumberNetwork, lookupNumberMock);

        const wireA = await setupElement(numberConfig, GetRecordTemplateClone);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

        const wireB = await setupElement(lookupConfig, GetRecordTemplateClone);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(lookupMock);

        expect(wireA.pushCount()).toBe(2);
    });

    [undefined, null].forEach((value) => {
        it(`should make another HTTP request when defaultRecordTypeId is already cached but optionalFields are not the same and 2nd recordTypeId is ${value}`, async () => {
            const numberMock = getMock(
                'record-template-clone-Custom_Object_2__c-optionalField-Number'
            );
            const numberMockRecordId = numberMock.record.cloneSourceId;
            const numberMockRecordTypeId = numberMock.record.recordTypeId;
            const numberMockApiName = numberMock.record.apiName;

            const lookupMock = getMock(
                'record-template-clone-Custom_Object_2__c-optionalField-Lookup'
            );
            const lookupMockRecordId = lookupMock.record.cloneSourceId;
            const lookupMockApiName = lookupMock.record.apiName;

            const lookupNumberMock = getMock(
                'record-template-clone-Custom_Object_2__c-optionalField-Lookup-Number'
            );
            const lookupNumberMockRecordId = lookupNumberMock.record.cloneSourceId;
            const lookupNumberMockApiName = lookupNumberMock.record.apiName;

            const numberConfig = {
                recordId: numberMockRecordId,
                optionalFields: [`${numberMockApiName}.Number__c`],
                recordTypeId: numberMockRecordTypeId,
            };

            const lookupConfig = {
                recordId: lookupMockRecordId,
                optionalFields: [
                    `${lookupMockApiName}.Account__c`,
                    `${lookupMockApiName}.Account__r.Id`,
                    `${lookupMockApiName}.Account__r.Name`,
                ],
                recordTypeId: value,
            };

            const lookupNumberNetwork = {
                recordId: lookupNumberMockRecordId,
                optionalFields: [
                    `${lookupNumberMockApiName}.Account__c`,
                    `${lookupNumberMockApiName}.Account__r.Id`,
                    `${lookupNumberMockApiName}.Account__r.Name`,
                    `${lookupNumberMockApiName}.CloneSourceId`,
                    `${lookupNumberMockApiName}.Number__c`,
                ],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCloneNetwork(numberConfig, numberMock);
            mockGetRecordTemplateCloneNetwork(lookupNumberNetwork, lookupNumberMock);

            const wireA = await setupElement(numberConfig, GetRecordTemplateClone);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

            const wireB = await setupElement(lookupConfig, GetRecordTemplateClone);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(lookupMock);

            expect(wireA.pushCount()).toBe(2);
        });
    });

    [undefined, null].forEach((value) => {
        it(`should not make another HTTP request when initial request with recordTypeId is ${value} and resulting recordTypeId is default`, async () => {
            const numberMock = getMock(
                'record-template-clone-Custom_Object_2__c-optionalField-Number'
            );
            const numberMockRecordId = numberMock.record.cloneSourceId;
            const numberMockRecordTypeId = numberMock.record.recordTypeId;
            const numberMockApiName = numberMock.record.apiName;

            const rtUndefinedConfig = {
                recordId: numberMockRecordId,
                optionalFields: [`${numberMockApiName}.Number__c`],
                recordTypeId: value,
            };

            const rtDefinedConfig = {
                recordId: numberMockRecordId,
                optionalFields: [`${numberMockApiName}.Number__c`],
                recordTypeId: numberMockRecordTypeId,
            };

            const network = {
                recordId: numberMockRecordId,
                optionalFields: [`${numberMockApiName}.Number__c`],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCloneNetwork(network, numberMock);

            const wireA = await setupElement(rtUndefinedConfig, GetRecordTemplateClone);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

            const wireB = await setupElement(rtDefinedConfig, GetRecordTemplateClone);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

            // No change expected as value did not change
            expect(wireA.pushCount()).toBe(1);
        });
    });

    it('should make HTTP request when clone defaults have expired', async () => {
        const mock = getMock('record-template-clone-Custom_Object_2__c-optionalField-Number');
        const recordId = mock.record.cloneSourceId;
        const recordTypeId = mock.record.recordTypeId;
        const apiName = mock.record.apiName;

        const config = {
            recordId,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const networkConfig = {
            recordId,
            optionalFields: [`${apiName}.CloneSourceId`, `${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCloneNetwork(config, mock);
        mockGetRecordTemplateCloneNetwork(networkConfig, mock);

        const wireA = await setupElement(config, GetRecordTemplateClone);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        expireCloneTemplateRepresentation();

        const wireB = await setupElement(config, GetRecordTemplateClone);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should not refresh when a related object info is retrieved but it not changed', async () => {
        const mockRecordCloneDefaults = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-Number'
        );
        const recordId = mockRecordCloneDefaults.record.cloneSourceId;
        const recordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const cloneDefaultsApiName = mockRecordCloneDefaults.record.apiName;

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const apiName = mockObjectInfo.apiName;

        const defaultsconfig = {
            recordId,
            optionalFields: [`${cloneDefaultsApiName}.Number__c`],
            recordTypeId,
        };

        const objectInfoConfig = {
            objectApiName: apiName,
        };

        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);
        const wireGetRecordTemplateClone = await setupElement(
            defaultsconfig,
            GetRecordTemplateClone
        );
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);

        expireObjectInfo();
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);

        await setupElement(objectInfoConfig, GetObjectInfo);

        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);
    });
});

describe('getRecordTemplateClone refreshes', () => {
    it('when a related object info changes', async () => {
        const mockRecordCloneDefaults = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-Number'
        );
        const recordId = mockRecordCloneDefaults.record.cloneSourceId;
        const recordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const cloneDefaultsApiName = mockRecordCloneDefaults.record.apiName;

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const apiName = mockObjectInfo.apiName;
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockObjectInfo.updateable = false;

        const defaultsconfig = {
            recordId,
            optionalFields: [`${cloneDefaultsApiName}.Number__c`],
            recordTypeId,
        };

        const objectInfoConfig = {
            objectApiName: apiName,
        };

        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);
        const wireGetRecordTemplateClone = await setupElement(
            defaultsconfig,
            GetRecordTemplateClone
        );
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);

        expireObjectInfo();
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);

        await setupElement(objectInfoConfig, GetObjectInfo);

        expect(wireGetRecordTemplateClone.pushCount()).toBe(2);
    });

    it('when a related spanning record changes', async () => {
        const mockRecordCloneDefaults = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-RecordType-Owner'
        );
        const templateRecordId = mockRecordCloneDefaults.record.cloneSourceId;
        const templateRecordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const templateApiName = mockRecordCloneDefaults.record.apiName;

        const mockRecord = getMock('record-RecordType');
        const recordId = mockRecord.id;
        const recordTypeName = mockRecord.fields.Name.value;
        mockRecord.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockRecord.fields.Name = {
            displayValue: null,
            value: `${recordTypeName} Updated`,
        };

        const defaultsconfig = {
            recordId: templateRecordId,
            optionalFields: [
                `${templateApiName}.Owner.Id`,
                `${templateApiName}.Owner.Name`,
                `${templateApiName}.OwnerId`,
                `${templateApiName}.RecordType.Id`,
                `${templateApiName}.RecordType.Name`,
                `${templateApiName}.RecordTypeId`,
            ],
            recordTypeId: templateRecordTypeId,
        };

        const recordConfig = {
            recordId,
            fields: ['RecordType.Id', 'RecordType.Name'],
        };

        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);
        const wireGetRecordTemplateClone = await setupElement(
            defaultsconfig,
            GetRecordTemplateClone
        );
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);

        expireRecords();
        mockGetRecordNetwork(recordConfig, mockRecord);

        await setupElement(recordConfig, GetRecord);

        expect(wireGetRecordTemplateClone.pushCount()).toBe(2);
    });
});

describe('related wire', () => {
    it('does not refresh when GetRecordTemplateClone brings back no change to object info', async () => {
        const mockRecordCloneDefaults = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-Number'
        );
        const recordId = mockRecordCloneDefaults.record.cloneSourceId;
        const recordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const cloneDefaultsApiName = mockRecordCloneDefaults.record.recordTypeId;

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const apiName = mockObjectInfo.apiName;

        const defaultsconfig = {
            recordId,
            optionalFields: [`${cloneDefaultsApiName}.Number__c`],
            recordTypeId,
        };

        const objectInfoConfig = {
            objectApiName: apiName,
        };
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);
        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);

        const wireObjectInfo = await setupElement(objectInfoConfig, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateClone);

        expect(wireObjectInfo.pushCount()).toBe(1);
    });

    it('does not refresh when GetRecordTemplateClone requests invalid optional field', async () => {
        const mockRecordCloneDefaults = getMock('record-template-clone-Custom_Object__c');
        const recordId = mockRecordCloneDefaults.record.cloneSourceId;
        const recordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const apiName = mockRecordCloneDefaults.record.apiName;

        const config = {
            recordId,
            optionalFields: [`${apiName}.InvalidField`],
            recordTypeId,
        };

        mockGetRecordTemplateCloneNetwork(config, mockRecordCloneDefaults);

        const wireGetRecordTemplateClone = await setupElement(config, GetRecordTemplateClone);
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);
        const wireGetRecordTemplateClone2 = await setupElement(config, GetRecordTemplateClone);
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);
        expect(wireGetRecordTemplateClone2.pushCount()).toBe(1);
    });

    it('refreshes when getRecordTemplateClone brings back an updated object info', async () => {
        const mockRecordCloneDefaults = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-Number'
        );
        const recordId = mockRecordCloneDefaults.record.cloneSourceId;
        const recordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const cloneDefaultsApiName = mockRecordCloneDefaults.record.apiName;

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const apiName = mockObjectInfo.apiName;

        const defaultsconfig = {
            recordId,
            optionalFields: [`${cloneDefaultsApiName}.Number__c`],
            recordTypeId,
        };

        const objectInfoConfig = {
            objectApiName: apiName,
        };
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';

        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);
        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);

        const wireObjectInfo = await setupElement(objectInfoConfig, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateClone);

        expect(wireObjectInfo.pushCount()).toBe(2);
    });

    it('refreshes when getRecordTemplateClone brings back an updated spanning record', async () => {
        const mockRecordCloneDefaults = getMock(
            'record-template-clone-Custom_Object_2__c-optionalField-RecordType-Owner'
        );
        const templateRecordId = mockRecordCloneDefaults.record.cloneSourceId;
        const templateRecordTypeId = mockRecordCloneDefaults.record.recordTypeId;
        const templateApiName = mockRecordCloneDefaults.record.apiName;
        const recordTypeName =
            mockRecordCloneDefaults.record.fields.RecordType.value.fields.Name.value;
        mockRecordCloneDefaults.record.fields.RecordType.value.fields.Name = {
            displayValue: null,
            value: `${recordTypeName} Updated`,
        };
        const defaultsconfig = {
            recordId: templateRecordId,
            optionalFields: [
                `${templateApiName}.Owner.Id`,
                `${templateApiName}.Owner.Name`,
                `${templateApiName}.OwnerId`,
                `${templateApiName}.RecordType.Id`,
                `${templateApiName}.RecordType.Name`,
                `${templateApiName}.RecordTypeId`,
            ],
            recordTypeId: templateRecordTypeId,
        };

        const mockRecord = getMock('record-RecordType');
        const recordId = mockRecord.id;
        const recordConfig = {
            recordId,
            fields: ['RecordType.Id', 'RecordType.Name'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);
        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);

        const wireGetRecord = await setupElement(recordConfig, GetRecord);
        expect(wireGetRecord.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateClone);

        expect(wireGetRecord.pushCount()).toBe(2);
    });
});

describe('refresh', () => {
    it('should refresh get record clone defaults', async () => {
        const mock = getMock('record-template-clone-Custom_Object_2__c-optionalField-Number');
        const recordId = mock.record.cloneSourceId;
        const recordTypeId = mock.record.recordTypeId;
        const apiName = mock.record.apiName;

        const refreshed = getMock('record-template-clone-Custom_Object_2__c-optionalField-Number');
        ++refreshed.record.fields.Number__c.value;

        const config = {
            recordId,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const networkConfig = {
            recordId,
            optionalFields: [`${apiName}.CloneSourceId`, `${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCloneNetwork(config, mock);
        mockGetRecordTemplateCloneNetwork(networkConfig, refreshed);

        const element = await setupElement(config, GetRecordTemplateClone);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});

describe('getRecordTemplateClone_imperative', () => {
    // TODO [W-9803760]: enable when cache-and-network policy is available
    xit('uses caller-supplied cache policy', async () => {
        const mock1 = getMock('record-template-clone-Custom_Object__c');
        const mock2 = getMock('record-template-clone-Custom_Object__c');
        mock2.record.fields.CloneSourceId.displayValue = 'foo';

        const recordId = mock1.record.cloneSourceId;
        const config = {
            recordId,
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCloneNetwork(config, [mock1, mock2]);

        const callback = jasmine.createSpy();

        // populate cache with mock1
        getRecordTemplateClone_imperative.invoke(config, undefined, callback);
        await flushPromises();

        callback.calls.reset();

        // should emit mock1 from cache, then make network call & emit mock2
        getRecordTemplateClone_imperative.subscribe(
            config,
            { cachePolicy: { type: 'cache-and-network' } },
            callback
        );
        await flushPromises();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.calls.argsFor(0)).toEqual([{ data: stripEtags(mock1), error: undefined }]);
        expect(callback.calls.argsFor(1)).toEqual([{ data: stripEtags(mock2), error: undefined }]);
    });
});
