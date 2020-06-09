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

// use mocks from getRecordTemplateCreate
const CREATE_MOCK_PREFIX = 'wire/getRecordTemplateCreate/__karma__/basic/data/';

function getCreateTemplateMock(filename) {
    const mock = globalGetMock(CREATE_MOCK_PREFIX + filename);
    return mock;
}

const recordIdGlobal = '001RM000004PkciYAC';
function getCreateTemplateMockWithSrcId(filename, recordId) {
    const mock = globalGetMock(CREATE_MOCK_PREFIX + filename);
    mock.record.fields.CloneSourceId = {
        displayValue: null,
        value: recordId ? recordId : recordIdGlobal,
    };
    return mock;
}

describe('GetRecordTemplateClone', () => {
    it('should make HTTP request when recordTypeId param is undefined and response contains master rtId', async () => {
        const mock = getCreateTemplateMockWithSrcId('record-template-create-Account');
        const config = {
            recordId: recordIdGlobal,
            recordTypeId: undefined,
        };

        mockGetRecordTemplateCloneNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateClone);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make another HTTP request when master recordTypeId is also the default recordTypeId', async () => {
        const mock = getCreateTemplateMockWithSrcId('record-template-create-Account');
        const config = {
            recordId: recordIdGlobal,
            recordTypeId: '012000000000000AAA',
        };

        const config2 = {
            recordId: recordIdGlobal,
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
        const mock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );

        const config = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
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
        const nameMock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const parentNameMock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Parent-Name'
        );

        const nameConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentNameConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name', 'Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentNameNetworkConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.CloneSourceId', 'Account.Name', 'Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCloneNetwork(nameConfig, nameMock);
        mockGetRecordTemplateCloneNetwork(parentNameNetworkConfig, parentNameMock);

        const wireA = await setupElement(nameConfig, GetRecordTemplateClone);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

        const wireB = await setupElement(parentNameConfig, GetRecordTemplateClone);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(parentNameMock);

        expect(wireA.pushCount()).toBe(2);
        nameMock.record.fields.Name.displayValue = 'Bar';
        nameMock.record.fields.Name.value = 'Bar';
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);
    });

    it('should make another HTTP request when optionalFields for both wires are not the same set', async () => {
        const nameMock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const parentMock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Parent'
        );
        const parentNameMock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Parent-Name'
        );

        const nameConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const parentNameNetwork = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.CloneSourceId', 'Account.Name', 'Account.Parent'],
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCloneNetwork(nameConfig, nameMock);
        mockGetRecordTemplateCloneNetwork(parentNameNetwork, parentNameMock);

        const wireA = await setupElement(nameConfig, GetRecordTemplateClone);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

        const wireB = await setupElement(parentConfig, GetRecordTemplateClone);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(parentMock);

        expect(wireA.pushCount()).toBe(2);
        nameMock.record.fields.Name.displayValue = 'Bar';
        nameMock.record.fields.Name.value = 'Bar';
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);
    });

    [undefined, null].forEach(value => {
        it(`should make another HTTP request when defaultRecordTypeId is already cached but optionalFields are not the same and 2nd recordTypeId is ${value}`, async () => {
            const nameMock = getCreateTemplateMockWithSrcId(
                'record-template-create-Account-optionalField-Name'
            );
            const parentMock = getCreateTemplateMockWithSrcId(
                'record-template-create-Account-optionalField-Parent'
            );
            const parentNameMock = getCreateTemplateMockWithSrcId(
                'record-template-create-Account-optionalField-Parent-Name'
            );

            const nameConfig = {
                recordId: recordIdGlobal,
                optionalFields: ['Account.Name'],
                recordTypeId: '012RM00000025SOYAY',
            };

            const parentConfig = {
                recordId: recordIdGlobal,
                optionalFields: ['Account.Parent'],
                recordTypeId: value,
            };

            const parentNameNetwork = {
                recordId: recordIdGlobal,
                optionalFields: ['Account.CloneSourceId', 'Account.Name', 'Account.Parent'],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCloneNetwork(nameConfig, nameMock);
            mockGetRecordTemplateCloneNetwork(parentNameNetwork, parentNameMock);

            const wireA = await setupElement(nameConfig, GetRecordTemplateClone);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

            const wireB = await setupElement(parentConfig, GetRecordTemplateClone);

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
            const nameMock = getCreateTemplateMockWithSrcId(
                'record-template-create-Account-optionalField-Name'
            );

            const rtUndefinedConfig = {
                recordId: recordIdGlobal,
                optionalFields: ['Account.Name'],
                recordTypeId: value,
            };

            const rtDefinedConfig = {
                recordId: recordIdGlobal,
                optionalFields: ['Account.Name'],
                recordTypeId: '012RM00000025SOYAY',
            };

            const network = {
                recordId: recordIdGlobal,
                optionalFields: ['Account.Name'],
                recordTypeId: undefined,
            };

            mockGetRecordTemplateCloneNetwork(network, nameMock);

            const wireA = await setupElement(rtUndefinedConfig, GetRecordTemplateClone);

            expect(wireA.pushCount()).toBe(1);
            expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

            const wireB = await setupElement(rtDefinedConfig, GetRecordTemplateClone);

            expect(wireB.pushCount()).toBe(1);
            expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(nameMock);

            // No change expected as value did not change
            expect(wireA.pushCount()).toBe(1);
        });
    });

    it('should make HTTP request when clone defaults have expired', async () => {
        const mock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );

        const config = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const networkConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.CloneSourceId', 'Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
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
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getCreateTemplateMock('object-info-Account');

        const defaultsconfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
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
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getCreateTemplateMock('object-info-Account');
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockObjectInfo.updateable = false;

        const defaultsconfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
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
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-RecordType-Owner'
        );
        const mockRecord = getCreateTemplateMock('record-RecordType');
        mockRecord.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockRecord.fields.Name = {
            displayValue: null,
            value: 'Business Account Updated',
        };

        const defaultsconfig = {
            recordId: recordIdGlobal,
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

        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);
        const wireGetRecordTemplateClone = await setupElement(
            defaultsconfig,
            GetRecordTemplateClone
        );
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);

        expireRecords();
        mockGetRecordNetwork(recordConfig, mockRecord);

        await setupElement(recordConfig, GetRecord);

        mockRecordCloneDefaults.record.fields.RecordType.value.fields.Name = {
            displayValue: null,
            value: 'Business Account Updated',
        };
        expect(wireGetRecordTemplateClone.pushCount()).toBe(2);
        expect(wireGetRecordTemplateClone.getWiredData()).toEqualSnapshotWithoutEtags(
            mockRecordCloneDefaults
        );
    });
});

describe('related wire', () => {
    it('does not refresh when GetRecordTemplateClone brings back no change to object info', async () => {
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getCreateTemplateMock('object-info-Account');

        const defaultsconfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
        };
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);
        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);

        const wireObjectInfo = await setupElement(objectInfoConfig, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateClone);

        expect(wireObjectInfo.pushCount()).toBe(1);
    });

    it('does not refresh when GetRecordTemplateClone requests invalid optional field', async () => {
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account'
        );

        const config = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.InvalidField'],
            recordTypeId: '012000000000000AAA',
        };
        mockGetRecordTemplateCloneNetwork(config, mockRecordCloneDefaults);

        const wireGetRecordTemplateClone = await setupElement(config, GetRecordTemplateClone);
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);
        const wireGetRecordTemplateClone2 = await setupElement(config, GetRecordTemplateClone);
        expect(wireGetRecordTemplateClone.pushCount()).toBe(1);
        expect(wireGetRecordTemplateClone2.pushCount()).toBe(1);
    });

    it('refreshes when getRecordTemplateClone brings back an updated object info', async () => {
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const mockObjectInfo = getCreateTemplateMock('object-info-Account');

        const defaultsconfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const objectInfoConfig = {
            objectApiName: 'Account',
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
        const mockRecordCloneDefaults = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-RecordType-Owner'
        );
        const mockRecord = getCreateTemplateMock('record-RecordType');
        mockRecordCloneDefaults.record.fields.RecordType.value.fields.Name = {
            displayValue: null,
            value: 'Business Account Updated',
        };

        const defaultsconfig = {
            recordId: recordIdGlobal,
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
        mockGetRecordTemplateCloneNetwork(defaultsconfig, mockRecordCloneDefaults);

        const wireGetRecord = await setupElement(recordConfig, GetRecord);
        expect(wireGetRecord.pushCount()).toBe(1);

        await setupElement(defaultsconfig, GetRecordTemplateClone);

        expect(wireGetRecord.pushCount()).toBe(2);
    });
});

describe('refresh', () => {
    it('should refresh get record clone defaults', async () => {
        const mock = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        const refreshed = getCreateTemplateMockWithSrcId(
            'record-template-create-Account-optionalField-Name'
        );
        refreshed.record.fields.Name = {
            displayValue: 'Bar',
            value: 'Bar',
        };

        const config = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
        };

        const networkConfig = {
            recordId: recordIdGlobal,
            optionalFields: ['Account.CloneSourceId', 'Account.Name'],
            recordTypeId: '012RM00000025SOYAY',
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
