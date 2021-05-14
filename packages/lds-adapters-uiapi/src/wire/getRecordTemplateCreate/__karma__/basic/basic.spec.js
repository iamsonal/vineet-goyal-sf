import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    expireCreateTemplateRepresentation,
    expireCreateRecordTemplateRepresentation,
    expireObjectInfo,
    mockGetObjectInfoNetwork,
    mockGetRecordTemplateCreateNetwork,
} from 'uiapi-test-util';

import GetRecord from '../../../getRecord/__karma__/lwc/record-fields';
import GetObjectInfo from '../../../getObjectInfo/__karma__/lwc/object-basic';
import GetRecordTemplateCreate from '../lwc/get-record-template-create';
import { expireRecords, mockGetRecordNetwork } from '../../../../../karma/uiapi-test-util';

const MOCK_PREFIX = 'wire/getRecordTemplateCreate/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('GetRecordTemplateCreate', () => {
    it('should make HTTP request when recordTypeId param is undefined and response contains master rtId', async () => {
        const mock = getMock('record-template-create-Custom_Object__c');
        const config = {
            objectApiName: mock.record.apiName,
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make another HTTP request when master recordTypeId is also the default master rtId', async () => {
        const mock = getMock('record-template-create-Custom_Object__c');
        const config = {
            objectApiName: mock.record.apiName,
            recordTypeId: mock.record.recordTypeId,
        };

        const config2 = {
            objectApiName: mock.record.apiName,
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const elm2 = await setupElement(config2, GetRecordTemplateCreate);
        expect(elm2.pushCount()).toBe(1);
        expect(elm2.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should handle when optionalFields do not come back from server', async () => {
        const mock = getMock('record-template-create-Custom_Object_2__c-optionalField-Number');
        const apiName = mock.record.apiName;
        const recordTypeId = mock.record.recordTypeId;
        const config = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.MissingField`, `${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const wireA = await setupElement(config, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make another HTTP request when config is the same', async () => {
        const mock = getMock('record-template-create-Custom_Object_2__c-optionalField-Number');
        const apiName = mock.record.apiName;
        const recordTypeId = mock.record.recordTypeId;
        const config = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const wireA = await setupElement(config, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make another HTTP request when optionalFields of 2nd request is superset', async () => {
        const numberMock = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Number'
        );
        const numberMockApiName = numberMock.record.apiName;
        const numberMockRecordTypeId = numberMock.record.recordTypeId;

        const numberConfig = {
            objectApiName: numberMockApiName,
            optionalFields: [`${numberMockApiName}.Number__c`],
            recordTypeId: numberMockRecordTypeId,
        };
        const lookupNumberMock = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Lookup-Number'
        );
        const lookupMockApiName = lookupNumberMock.record.apiName;
        const lookupMockRecordTypeId = lookupNumberMock.record.recordTypeId;
        const lookupNameConfig = {
            objectApiName: lookupMockApiName,
            optionalFields: [`${lookupMockApiName}.Account__c`, `${lookupMockApiName}.Number__c`],
            recordTypeId: lookupMockRecordTypeId,
        };

        mockGetRecordTemplateCreateNetwork(numberConfig, numberMock);
        mockGetRecordTemplateCreateNetwork(lookupNameConfig, lookupNumberMock);

        const wireA = await setupElement(numberConfig, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

        const wireB = await setupElement(lookupNameConfig, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(lookupNumberMock);

        expect(wireA.pushCount()).toBe(2);
    });

    it('should make another HTTP request when optionalFields for both wires are not the same set', async () => {
        const numberMock = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Number'
        );
        const numberMockApiName = numberMock.record.apiName;
        const numberMockRecordTypeId = numberMock.record.recordTypeId;

        const numberConfig = {
            objectApiName: numberMockApiName,
            optionalFields: [`${numberMockApiName}.Number__c`],
            recordTypeId: numberMockRecordTypeId,
        };

        const lookupMock = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Lookup'
        );
        const lookupMockApiName = lookupMock.record.apiName;
        const lookupMockRecordTypeId = lookupMock.record.recordTypeId;

        const lookupConfig = {
            objectApiName: lookupMockApiName,
            optionalFields: [`${lookupMockApiName}.Account__c`],
            recordTypeId: lookupMockRecordTypeId,
        };
        const lookupNumberMock = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Lookup-Number'
        );
        const lookupNumberMockApiName = lookupNumberMock.record.apiName;
        const lookupNumberMockRecordTypeId = lookupNumberMock.record.recordTypeId;
        const lookupNumberNetwork = {
            objectApiName: lookupNumberMockApiName,
            optionalFields: [
                `${lookupNumberMockApiName}.Account__c`,
                `${lookupNumberMockApiName}.Number__c`,
            ],
            recordTypeId: lookupNumberMockRecordTypeId,
        };

        mockGetRecordTemplateCreateNetwork(numberConfig, numberMock);
        mockGetRecordTemplateCreateNetwork(lookupNumberNetwork, lookupNumberMock);

        const wireA = await setupElement(numberConfig, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

        const wireB = await setupElement(lookupConfig, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(lookupMock);

        expect(wireA.pushCount()).toBe(2);
    });

    [undefined, null].forEach((value) => {
        it(`should make another HTTP request when defaultRecordTypeId is already cached but optionalFields are not the same and 2nd recordTypeId is ${value}`, async () => {
            const numberMock = getMock(
                'record-template-create-Custom_Object_2__c-optionalField-Number'
            );
            const numberMockApiName = numberMock.record.apiName;
            const numberMockRecordTypeId = numberMock.record.recordTypeId;
            const numberConfig = {
                objectApiName: numberMockApiName,
                optionalFields: [`${numberMockApiName}.Number__c`],
                recordTypeId: numberMockRecordTypeId,
            };

            const lookupMock = getMock(
                'record-template-create-Custom_Object_2__c-optionalField-Lookup'
            );
            const lookupMockApiName = lookupMock.record.apiName;
            const lookupConfig = {
                objectApiName: lookupMockApiName,
                optionalFields: [`${lookupMockApiName}.Account__c`],
                recordTypeId: value,
            };

            const lookupNumberMock = getMock(
                'record-template-create-Custom_Object_2__c-optionalField-Lookup-Number'
            );
            const lookupNumberMockApiName = lookupNumberMock.record.apiName;
            const lookupNumberNetwork = {
                objectApiName: lookupNumberMockApiName,
                optionalFields: [
                    `${lookupNumberMockApiName}.Account__c`,
                    `${lookupNumberMockApiName}.Number__c`,
                ],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCreateNetwork(numberConfig, numberMock);
            mockGetRecordTemplateCreateNetwork(lookupNumberNetwork, lookupNumberMock);

            const wireA = await setupElement(numberConfig, GetRecordTemplateCreate);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

            const wireB = await setupElement(lookupConfig, GetRecordTemplateCreate);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(lookupMock);

            expect(wireA.pushCount()).toBe(2);
        });
    });

    [undefined, null].forEach((value) => {
        it(`should not make another HTTP request when initial request with recordTypeId is ${value} and resulting recordTypeId is default`, async () => {
            const numberMock = getMock(
                'record-template-create-Custom_Object_2__c-optionalField-Number'
            );
            const apiName = numberMock.record.apiName;
            const recordTypeId = numberMock.record.recordTypeId;

            const rtUndefinedConfig = {
                objectApiName: apiName,
                optionalFields: [`${apiName}.Number__c`],
                recordTypeId: value,
            };

            const rtDefinedConfig = {
                objectApiName: apiName,
                optionalFields: [`${apiName}.Number__c`],
                recordTypeId,
            };

            const network = {
                objectApiName: apiName,
                optionalFields: [`${apiName}.Number__c`],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCreateNetwork(network, numberMock);

            const wireA = await setupElement(rtUndefinedConfig, GetRecordTemplateCreate);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

            const wireB = await setupElement(rtDefinedConfig, GetRecordTemplateCreate);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(numberMock);

            // No change expected as value did not change
            expect(wireA.pushCount()).toBe(1);
        });
    });

    it('should make HTTP request when template representation has expired', async () => {
        const mock = getMock('record-template-create-Custom_Object_2__c-optionalField-Number');
        const apiName = mock.record.apiName;
        const recordTypeId = mock.record.recordTypeId;

        const config = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCreateNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // expire the template
        expireCreateTemplateRepresentation();

        const wireB = await setupElement(config, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make HTTP request when create record representation has expired', async () => {
        const mock = getMock('record-template-create-Custom_Object_2__c-optionalField-Number');
        const apiName = mock.record.apiName;
        const recordTypeId = mock.record.recordTypeId;

        const config = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        mockGetRecordTemplateCreateNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // expire the record
        expireCreateRecordTemplateRepresentation();

        const wireB = await setupElement(config, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should not refresh when a related object info is retrieved but it not changed', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Number'
        );
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const defaultsconfig = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const objectInfoApiName = mockObjectInfo.apiName;
        const objectInfoConfig = {
            objectApiName: objectInfoApiName,
        };

        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);
        const wireGetRecordTemplateCreate = await setupElement(
            defaultsconfig,
            GetRecordTemplateCreate
        );
        expect(wireGetRecordTemplateCreate.pushCount()).toBe(1);

        expireObjectInfo();
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);

        await setupElement(objectInfoConfig, GetObjectInfo);

        expect(wireGetRecordTemplateCreate.pushCount()).toBe(1);
    });
});

describe('getRecordTemplateCreate refreshes', () => {
    it('when a related object info changes', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Number'
        );
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const defaultsconfig = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const objectInfoApiName = mockObjectInfo.apiName;
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        const objectInfoConfig = {
            objectApiName: objectInfoApiName,
        };

        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);
        const wireGetRecordTemplateCreate = await setupElement(
            defaultsconfig,
            GetRecordTemplateCreate
        );
        expect(wireGetRecordTemplateCreate.pushCount()).toBe(1);

        expireObjectInfo();
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);

        await setupElement(objectInfoConfig, GetObjectInfo);

        expect(wireGetRecordTemplateCreate.pushCount()).toBe(2);
    });

    it('when a related spanning record changes', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-RecordType-Owner'
        );
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const defaultsconfig = {
            objectApiName: apiName,
            optionalFields: [
                `${apiName}.Owner.Id`,
                `${apiName}.Owner.Name`,
                `${apiName}.RecordType.Id`,
                `${apiName}.RecordType.Name`,
            ],
            recordTypeId,
        };

        const mockRecord = getMock('record-RecordType');
        const recordId = mockRecord.id;
        const recordTypeName = mockRecord.fields.Name.value;
        mockRecord.fields.Name = {
            displayValue: null,
            value: `${recordTypeName} Updated`,
        };
        const recordConfig = {
            recordId,
            fields: ['RecordType.Id', 'RecordType.Name'],
        };

        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);
        const wireGetRecordTemplateCreate = await setupElement(
            defaultsconfig,
            GetRecordTemplateCreate
        );
        expect(wireGetRecordTemplateCreate.pushCount()).toBe(1);

        expireRecords();
        mockGetRecordNetwork(recordConfig, mockRecord);

        await setupElement(recordConfig, GetRecord);

        expect(wireGetRecordTemplateCreate.pushCount()).toBe(2);
    });
});

describe('related wire', () => {
    it('does not refresh when GetRecordTemplateCreate brings back no change to object info', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Number'
        );
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const defaultsconfig = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const objectInfoApiName = mockObjectInfo.apiName;
        const objectInfoConfig = {
            objectApiName: objectInfoApiName,
        };
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);
        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);

        const wireObjectInfo = await setupElement(objectInfoConfig, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateCreate);

        expect(wireObjectInfo.pushCount()).toBe(1);
    });

    it('does not refresh when GetRecordTemplateCreate requests invalid optional field', async () => {
        const mockGetRecordTemplateCreate = getMock('record-template-create-Custom_Object__c');
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const config = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.InvalidField`],
            recordTypeId,
        };
        mockGetRecordTemplateCreateNetwork(config, mockGetRecordTemplateCreate);

        const wireGetRecordTemplateCreate = await setupElement(config, GetRecordTemplateCreate);
        expect(wireGetRecordTemplateCreate.pushCount()).toBe(1);
        const wireGetRecordTemplateCreate2 = await setupElement(config, GetRecordTemplateCreate);
        expect(wireGetRecordTemplateCreate.pushCount()).toBe(1);
        expect(wireGetRecordTemplateCreate2.pushCount()).toBe(1);
    });

    it('refreshes when getRecordTemplateCreate brings back an updated object info', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-Number'
        );
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const defaultsconfig = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const mockObjectInfo = getMock('object-info-Custom_Object_2__c');
        const objectInfoApiName = mockObjectInfo.apiName;
        const objectInfoConfig = {
            objectApiName: objectInfoApiName,
        };
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';

        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);
        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);

        const wireObjectInfo = await setupElement(objectInfoConfig, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateCreate);

        expect(wireObjectInfo.pushCount()).toBe(2);
    });

    it('refreshes when getRecordTemplateCreate brings back an updated spanning record', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Custom_Object_2__c-optionalField-RecordType-Owner'
        );
        const apiName = mockGetRecordTemplateCreate.record.apiName;
        const recordTypeId = mockGetRecordTemplateCreate.record.recordTypeId;
        const defaultsconfig = {
            objectApiName: apiName,
            optionalFields: [
                `${apiName}.Owner.Id`,
                `${apiName}.Owner.Name`,
                `${apiName}.RecordType.Id`,
                `${apiName}.RecordType.Name`,
            ],
            recordTypeId,
        };
        const mockRecord = getMock('record-RecordType');
        const recordId = mockRecord.id;
        const recordTypeName = mockRecord.fields.Name.value;
        const recordConfig = {
            recordId,
            fields: ['RecordType.Id', 'RecordType.Name'],
        };
        mockGetRecordTemplateCreate.record.fields.RecordType.value.fields.Name = {
            displayValue: null,
            value: `${recordTypeName} Updated`,
        };
        mockGetRecordTemplateCreate.record.fields.RecordType.value.weakEtag = ++mockRecord.weakEtag;

        mockGetRecordNetwork(recordConfig, mockRecord);
        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);

        const wireGetRecord = await setupElement(recordConfig, GetRecord);
        expect(wireGetRecord.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateCreate);

        expect(wireGetRecord.pushCount()).toBe(2);
    });
});

describe('refresh', () => {
    it('should refresh get record create defaults', async () => {
        const mock = getMock('record-template-create-Custom_Object_2__c-optionalField-Number');
        const apiName = mock.record.apiName;
        const recordTypeId = mock.record.recordTypeId;
        const config = {
            objectApiName: apiName,
            optionalFields: [`${apiName}.Number__c`],
            recordTypeId,
        };

        const refreshed = getMock('record-template-create-Custom_Object_2__c-optionalField-Number');
        refreshed.record.fields.Number__c.value++;

        mockGetRecordTemplateCreateNetwork(config, [mock, refreshed]);

        const element = await setupElement(config, GetRecordTemplateCreate);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});
