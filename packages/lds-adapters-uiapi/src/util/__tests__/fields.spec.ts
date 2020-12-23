import { RecordRepresentation } from '../../generated/types/RecordRepresentation';
import { extractFields } from '../fields';

const record: RecordRepresentation = {
    apiName: 'Opportunity',
    childRelationships: {},
    eTag: '7f6eb86a91a64f470a43741c9cd6dd07',
    fields: {
        Account: {
            displayValue: '1st Detect',
            value: {
                apiName: 'Account',
                childRelationships: {},
                eTag: '920a31fd113fd88cf161f2c7e07190c7',
                fields: {
                    Id: {
                        displayValue: 'displayValue',
                        value: '001300000025tkPAAQ',
                    },
                    Name: {
                        displayValue: 'displayValue',
                        value: '1st Detect',
                    },
                    RecordTypeId: {
                        displayValue: 'displayValue',
                        value: '0123000000009GvAAI',
                    },
                },
                id: '001300000025tkPAAQ',
                lastModifiedById: '00530000007RGDvAAO',
                lastModifiedDate: '2019-06-12T12:20:33.000Z',
                recordTypeInfo: {
                    available: true,
                    defaultRecordTypeMapping: true,
                    master: false,
                    name: 'Sales',
                    recordTypeId: '0123000000009GvAAI',
                },
                systemModstamp: '2019-06-12T12:20:33.000Z',
                weakEtag: 0,
                recordTypeId: null,
            },
        },
        AccountId: {
            displayValue: 'displayValue',
            value: '001300000025tkPAAQ',
        },
        CreatedBy: {
            displayValue: 'OrderSummary API - DO NOT TOUCH',
            value: {
                apiName: 'User',
                childRelationships: {},
                eTag: '6ba0a61d66614db5fed84dced6d1bd31',
                fields: {
                    Id: {
                        displayValue: 'displayValue',
                        value: '00530000001h099AAA',
                    },
                    Name: {
                        displayValue: 'displayValue',
                        value: 'OrderSummary API - DO NOT TOUCH',
                    },
                },
                id: '00530000001h099AAA',
                lastModifiedById: '00530000004vc2PAAQ',
                lastModifiedDate: '2014-05-23T23:19:16.000Z',
                recordTypeInfo: {
                    available: true,
                    defaultRecordTypeMapping: false,
                    master: false,
                    name: 'Renewal/Attrition',
                    recordTypeId: '01230000000010MAAQ',
                },
                systemModstamp: '2019-06-17T04:29:27.000Z',
                weakEtag: 0,
                recordTypeId: null,
            },
        },
        IsDeleted: {
            displayValue: 'displayValue',
            value: null,
        },
        IsPremier_Attached__c: {
            displayValue: 'displayValue',
            value: null,
        },
    },
    id: '0060M000013GTBdQAO',
    lastModifiedById: '0053000000BQA4RAAX',
    lastModifiedDate: '2017-09-07T23:58:49.000Z',
    recordTypeInfo: {
        available: true,
        defaultRecordTypeMapping: false,
        master: false,
        name: 'Renewal/Attrition',
        recordTypeId: '01230000000010MAAQ',
    },
    systemModstamp: '2018-02-06T12:02:25.000Z',
    weakEtag: 0,
    recordTypeId: null,
};

describe('extractRecordFields', () => {
    it('should return the correct fields from the passed RecordRepresentation', () => {
        const fields = extractFields(record);
        expect(fields).toEqual([
            'Opportunity.Account.Id',
            'Opportunity.Account.Name',
            'Opportunity.Account.RecordTypeId',
            'Opportunity.AccountId',
            'Opportunity.CreatedBy.Id',
            'Opportunity.CreatedBy.Name',
            'Opportunity.IsDeleted',
            'Opportunity.IsPremier_Attached__c',
        ]);
    });
});
