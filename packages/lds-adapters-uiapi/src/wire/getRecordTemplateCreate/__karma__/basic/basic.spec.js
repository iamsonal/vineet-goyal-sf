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
        const mock = getMock('record-template-create-Account');
        const config = {
            objectApiName: 'Account',
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make another HTTP request when master recordTypeId is also the default master rtId', async () => {
        const mock = getMock('record-template-create-Account');
        const config = {
            objectApiName: 'Account',
            recordTypeId: '012000000000000AAA',
        };

        const config2 = {
            objectApiName: 'Account',
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

    it('should not make another HTTP request when config is the same', async () => {
        const mock = getMock('record-template-create-Account-optionalField-Name');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
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
        const nameMock = getMock('record-template-create-Account-optionalField-Name');
        const parentNameMock = getMock('record-template-create-Account-optionalField-Parent-Name');

        const nameConfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentNameConfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name', 'Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCreateNetwork(nameConfig, nameMock);
        mockGetRecordTemplateCreateNetwork(parentNameConfig, parentNameMock);

        const wireA = await setupElement(nameConfig, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

        const wireB = await setupElement(parentNameConfig, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(parentNameMock);

        expect(wireA.pushCount()).toBe(2);
        nameMock.record.fields.Name.displayValue = 'Bar';
        nameMock.record.fields.Name.value = 'Bar';
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);
    });

    it('should make another HTTP request when optionalFields for both wires are not the same set', async () => {
        const nameMock = getMock('record-template-create-Account-optionalField-Name');
        const parentMock = getMock('record-template-create-Account-optionalField-Parent');
        const parentNameMock = getMock('record-template-create-Account-optionalField-Parent-Name');

        const nameConfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentConfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentNameNetwork = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name', 'Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCreateNetwork(nameConfig, nameMock);
        mockGetRecordTemplateCreateNetwork(parentNameNetwork, parentNameMock);

        const wireA = await setupElement(nameConfig, GetRecordTemplateCreate);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

        const wireB = await setupElement(parentConfig, GetRecordTemplateCreate);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(parentMock);

        expect(wireA.pushCount()).toBe(2);
        nameMock.record.fields.Name.displayValue = 'Bar';
        nameMock.record.fields.Name.value = 'Bar';
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);
    });

    [undefined, null].forEach(value => {
        it(`should make another HTTP request when defaultRecordTypeId is already cached but optionalFields are not the same and 2nd recordTypeId is ${value}`, async () => {
            const nameMock = getMock('record-template-create-Account-optionalField-Name');
            const parentMock = getMock('record-template-create-Account-optionalField-Parent');
            const parentNameMock = getMock(
                'record-template-create-Account-optionalField-Parent-Name'
            );

            const nameConfig = {
                objectApiName: 'Account',
                optionalFields: ['Account.Name'],
                recordTypeId: '012RM00000025SOYAY',
            };

            const parentConfig = {
                objectApiName: 'Account',
                optionalFields: ['Account.Parent'],
                recordTypeId: value,
            };

            const parentNameNetwork = {
                objectApiName: 'Account',
                optionalFields: ['Account.Name', 'Account.Parent'],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCreateNetwork(nameConfig, nameMock);
            mockGetRecordTemplateCreateNetwork(parentNameNetwork, parentNameMock);

            const wireA = await setupElement(nameConfig, GetRecordTemplateCreate);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

            const wireB = await setupElement(parentConfig, GetRecordTemplateCreate);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(parentMock);

            expect(wireA.pushCount()).toBe(2);
            nameMock.record.fields.Name.displayValue = 'Bar';
            nameMock.record.fields.Name.value = 'Bar';
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);
        });
    });

    [undefined, null].forEach(value => {
        it(`should not make another HTTP request when initial request with recordTypeId is ${value} and resulting recordTypeId is default`, async () => {
            const nameMock = getMock('record-template-create-Account-optionalField-Name');

            const rtUndefinedConfig = {
                objectApiName: 'Account',
                optionalFields: ['Account.Name'],
                recordTypeId: value,
            };

            const rtDefinedConfig = {
                objectApiName: 'Account',
                optionalFields: ['Account.Name'],
                recordTypeId: '012RM00000025SOYAY',
            };

            const network = {
                objectApiName: 'Account',
                optionalFields: ['Account.Name'],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCreateNetwork(network, nameMock);

            const wireA = await setupElement(rtUndefinedConfig, GetRecordTemplateCreate);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

            const wireB = await setupElement(rtDefinedConfig, GetRecordTemplateCreate);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

            // No change expected as value did not change
            expect(wireA.pushCount()).toBe(1);
        });
    });

    it('should make HTTP request when template representation has expired', async () => {
        const mock = getMock('record-template-create-Account-optionalField-Name');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
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
        const mock = getMock('record-template-create-Account-optionalField-Name');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
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
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getMock('object-info-Account');

        const defaultsconfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
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
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getMock('object-info-Account');
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockObjectInfo.updateable = false;

        const defaultsconfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
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
            'record-template-create-Account-optionalField-RecordType-Owner'
        );
        const mockRecord = getMock('record-RecordType');
        mockRecord.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockRecord.fields.Name = {
            displayValue: null,
            value: 'Business Account Updated',
        };

        const defaultsconfig = {
            objectApiName: 'Account',
            optionalFields: [
                'Account.Owner.Id',
                'Account.Owner.Name',
                'Account.RecordType.Id',
                'Account.RecordType.Name',
            ],
            recordTypeId: '012RM00000025SOYAY',
        };

        const recordConfig = {
            recordId: '012RM00000025SOYAY',
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

        mockGetRecordTemplateCreate.record.fields.RecordType.value.fields.Name = {
            displayValue: null,
            value: 'Business Account Updated',
        };
        expect(wireGetRecordTemplateCreate.pushCount()).toBe(2);
        expect(wireGetRecordTemplateCreate.getWiredData()).toEqualSnapshotWithoutEtags(
            mockGetRecordTemplateCreate
        );
    });
});

describe('related wire', () => {
    it('does not refresh when GetRecordTemplateCreate brings back no change to object info', async () => {
        const mockGetRecordTemplateCreate = getMock(
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getMock('object-info-Account');

        const defaultsconfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
        };
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);
        mockGetRecordTemplateCreateNetwork(defaultsconfig, mockGetRecordTemplateCreate);

        const wireObjectInfo = await setupElement(objectInfoConfig, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateCreate);

        expect(wireObjectInfo.pushCount()).toBe(1);
    });

    it('does not refresh when GetRecordTemplateCreate requests invalid optional field', async () => {
        const mockGetRecordTemplateCreate = getMock('record-template-create-Account');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.InvalidField'],
            recordTypeId: '012000000000000AAA',
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
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getMock('object-info-Account');

        const defaultsconfig = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
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
            'record-template-create-Account-optionalField-RecordType-Owner'
        );
        const mockRecord = getMock('record-RecordType');
        mockGetRecordTemplateCreate.record.fields.RecordType.value.fields.Name = {
            displayValue: null,
            value: 'Business Account Updated',
        };

        const defaultsconfig = {
            objectApiName: 'Account',
            optionalFields: [
                'Account.Owner.Id',
                'Account.Owner.Name',
                'Account.RecordType.Id',
                'Account.RecordType.Name',
            ],
            recordTypeId: '012RM00000025SOYAY',
        };

        const recordConfig = {
            recordId: '012RM00000025SOYAY',
            fields: ['RecordType.Id', 'RecordType.Name'],
        };
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
        const mock = getMock('record-template-create-Account-optionalField-Name');
        const refreshed = getMock('record-template-create-Account-optionalField-Name');
        refreshed.record.fields.Name = {
            displayValue: 'Bar',
            value: 'Bar',
        };

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCreateNetwork(config, [mock, refreshed]);

        const element = await setupElement(config, GetRecordTemplateCreate);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});
