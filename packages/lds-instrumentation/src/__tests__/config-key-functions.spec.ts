import {
    getLayoutConfigKey,
    getLayoutUserStateConfigKey,
    getListUiConfigKey,
    getLookupActionsConfigKey,
    getLookupRecordsConfigKey,
    getObjectInfoConfigKey,
    getPicklistValuesConfigKey,
    getPicklistValuesByRecordTypeConfigKey,
    getRecordAvatarsConfigKey,
    getRecordCreateDefaultsConfigKey,
    getRecordConfigKey,
    getRecordUiConfigKey,
} from '../config-key-functions';

describe('config key functions', () => {
    describe('getLayout', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                objectApiName: 'Opportunity',
                layoutType: 'Full',
                formFactor: 'Large',
                mode: 'View',
                recordTypeId: '012000000000000AAA',
            };
            expect(getLayoutConfigKey(config)).toEqual(
                'getLayout:Opportunity:Large:Full:View:012000000000000AAA'
            );
        });

        it('should return a correct key for a config object with missing optional parameter', () => {
            const config = {
                objectApiName: 'Opportunity',
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '012000000000000AAA',
            };
            expect(getLayoutConfigKey(config)).toEqual(
                'getLayout:Opportunity:undefined:Full:View:012000000000000AAA'
            );
        });
    });

    describe('getLayoutUserState', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                objectApiName: 'Opportunity',
                layoutType: 'Full',
                formFactor: 'Large',
                mode: 'View',
                recordTypeId: '012000000000000AAA',
            };
            expect(getLayoutUserStateConfigKey(config)).toEqual(
                'getLayoutUserState:Opportunity:Large:Full:View:012000000000000AAA'
            );
        });

        it('should return a correct key for a config object with missing optional parameter', () => {
            const config = {
                objectApiName: 'Opportunity',
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '012000000000000AAA',
            };
            expect(getLayoutUserStateConfigKey(config)).toEqual(
                'getLayoutUserState:Opportunity:undefined:Full:View:012000000000000AAA'
            );
        });
    });

    describe('getListUi', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                listViewId: '00BRM0000029bDc2AI',
                pageSize: 10,
            };
            expect(getListUiConfigKey(config)).toEqual('getListUi:00BRM0000029bDc2AI:10');
        });
    });

    describe('getLookupRecords', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                fieldApiName: 'Opportunity.AccountId',
                targetApiName: 'Account',
                requestParams: {
                    q: 'nc',
                    searchType: 'Recent',
                    pageParam: 1,
                    pageSize: 25,
                    dependentFieldBindings: null,
                    sourceRecordId: '',
                },
            };
            expect(getLookupRecordsConfigKey(config)).toEqual(
                'getLookupRecords:Opportunity:AccountId:Account:null:1:25:nc:Recent:'
            );
        });

        it('should return the same key for a config object when config has FieldId object', () => {
            const config = {
                fieldApiName: {
                    objectApiName: 'Opportunity',
                    fieldApiName: 'AccountId',
                },
                targetApiName: 'Account',
                requestParams: {
                    q: 'nc',
                    searchType: 'Recent',
                    pageParam: 1,
                    pageSize: 25,
                    dependentFieldBindings: null,
                    sourceRecordId: '',
                },
            };
            expect(getLookupRecordsConfigKey(config)).toEqual(
                'getLookupRecords:Opportunity:AccountId:Account:null:1:25:nc:Recent:'
            );
        });

        it('should return a correct key for a config object when requestParams is undefined', () => {
            const config = {
                fieldApiName: 'Opportunity.AccountId',
                targetApiName: 'Account',
            };
            expect(getLookupRecordsConfigKey(config)).toEqual(
                'getLookupRecords:Opportunity:AccountId:Account:undefined:undefined:undefined:undefined:undefined:undefined'
            );
        });
    });

    describe('getLookupActions', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                objectApiNames: ['Account', 'Opportunity'],
                actionTypes: ['StandardButton'],
                formFactor: 'Medium',
                sections: ['Page'],
            };
            expect(getLookupActionsConfigKey(config)).toEqual(
                'getLookupActions:Account,Opportunity:StandardButton:Medium:Page'
            );
        });

        it('should return the same key for a config object when ordering is different', () => {
            const config = {
                objectApiNames: ['Opportunity', 'Account'],
                actionTypes: ['StandardButton'],
                formFactor: 'Medium',
                sections: ['Page'],
            };
            expect(getLookupActionsConfigKey(config)).toEqual(
                'getLookupActions:Account,Opportunity:StandardButton:Medium:Page'
            );
        });

        it('should return a correct key for a config object with missing optional parameter', () => {
            const config = {
                objectApiNames: ['Account', 'Opportunity'],
                actionTypes: ['StandardButton'],
                sections: ['Page'],
            };
            expect(getLookupActionsConfigKey(config)).toEqual(
                'getLookupActions:Account,Opportunity:StandardButton:undefined:Page'
            );
        });
    });

    describe('getObjectInfo', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                objectApiName: 'Account',
            };
            expect(getObjectInfoConfigKey(config)).toEqual('getObjectInfo:Account');
        });
    });

    describe('getPicklistValues', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                fieldApiName: 'Account.Type',
                recordTypeId: '012000000000000AAA',
            };
            expect(getPicklistValuesConfigKey(config)).toEqual(
                'getPicklistValues:Account:Type:012000000000000AAA'
            );
        });

        it('should return the same key for a config object that has FieldId object', () => {
            const config = {
                fieldApiName: {
                    objectApiName: 'Account',
                    fieldApiName: 'Type',
                },
                recordTypeId: '012000000000000AAA',
            };
            expect(getPicklistValuesConfigKey(config)).toEqual(
                'getPicklistValues:Account:Type:012000000000000AAA'
            );
        });
    });

    describe('getPicklistValuesByRecordType', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                objectApiName: 'Account',
                recordTypeId: '012000000000000AAA',
            };

            expect(getPicklistValuesByRecordTypeConfigKey(config)).toEqual(
                'getPicklistValuesByRecordType:Account:012000000000000AAA'
            );
        });
    });

    describe('getRecordAvatars', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                recordIds: ['001xx000003GYSZAA4', '003xx000004WhEiAAK', '005xx000001X7c9AAC'],
                formFactor: 'Large',
            };
            expect(getRecordAvatarsConfigKey(config)).toEqual(
                'getRecordAvatars:001xx000003GYSZAA4,003xx000004WhEiAAK,005xx000001X7c9AAC:Large'
            );
        });

        it('should return the same key for a config object when ordering is different', () => {
            const config = {
                recordIds: ['005xx000001X7c9AAC', '001xx000003GYSZAA4', '003xx000004WhEiAAK'],
                formFactor: 'Large',
            };
            expect(getRecordAvatarsConfigKey(config)).toEqual(
                'getRecordAvatars:001xx000003GYSZAA4,003xx000004WhEiAAK,005xx000001X7c9AAC:Large'
            );
        });
    });

    // Add more cases
    describe('getRecord', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                recordId: '00x000000000000017',
                fields: ['Account.CreatedBy'],
                optionalFields: ['Account.Id', 'Account.Name'],
                layoutTypes: ['Full'],
                modes: ['View'],
            };
            expect(getRecordConfigKey(config)).toEqual(
                'getRecord:00x000000000000017:Account.CreatedBy:Account.Id,Account.Name:View:Full'
            );
        });

        it('should return the same key for a config object when ordering is different', () => {
            const config = {
                recordId: '00x000000000000017',
                fields: ['Account.CreatedBy'],
                optionalFields: ['Account.Id', 'Account.Name'],
                layoutTypes: ['Full'],
                modes: ['View'],
            };
            expect(getRecordConfigKey(config)).toEqual(
                'getRecord:00x000000000000017:Account.CreatedBy:Account.Id,Account.Name:View:Full'
            );
        });

        it('should return a correct key for a config object with missing optional parameter', () => {
            const config = {
                recordId: '00x000000000000017',
                optionalFields: ['Account.Id', 'Account.Name'],
            };
            expect(getRecordCreateDefaultsConfigKey(config)).toEqual(
                'getRecordCreateDefaults:undefined:undefined:undefined:Account.Id,Account.Name'
            );
        });
    });

    describe('getRecordCreateDefaults', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                objectApiName: 'Account',
                formFactor: 'Large',
                optionalFields: ['Account.Name', 'Account.YearStarted'],
                recordTypeId: '012000000000000AAA',
            };
            expect(getRecordCreateDefaultsConfigKey(config)).toEqual(
                'getRecordCreateDefaults:Account:Large:012000000000000AAA:Account.Name,Account.YearStarted'
            );
        });

        it('should return the same key for a config object when ordering is different', () => {
            const config = {
                objectApiName: 'Account',
                formFactor: 'Large',
                optionalFields: ['Account.YearStarted', 'Account.Name'],
                recordTypeId: '012000000000000AAA',
            };
            expect(getRecordCreateDefaultsConfigKey(config)).toEqual(
                'getRecordCreateDefaults:Account:Large:012000000000000AAA:Account.Name,Account.YearStarted'
            );
        });

        it('should return a correct key for a config object with missing optional parameter', () => {
            const config = {
                objectApiName: 'Account',
                optionalFields: ['Account.Name', 'Account.YearStarted'],
            };
            expect(getRecordCreateDefaultsConfigKey(config)).toEqual(
                'getRecordCreateDefaults:Account:undefined:undefined:Account.Name,Account.YearStarted'
            );
        });
    });

    describe('getRecordUi', () => {
        it('should return a correct key for a config object', () => {
            const config = {
                recordIds: '005B0000003g6BCIAY',
                layoutTypes: ['Full'],
                modes: ['View'],
                optionalFields: ['Account.Fax', 'Account.Industry'],
            };
            expect(getRecordUiConfigKey(config)).toEqual(
                'getRecordUi:005B0000003g6BCIAY:Full:View:Account.Fax,Account.Industry'
            );
        });

        it('should return the same key for a config object when ordering is different', () => {
            const config = {
                recordIds: '005B0000003g6BCIAY',
                layoutTypes: ['Full'],
                modes: ['View'],
                optionalFields: ['Account.Industry', 'Account.Fax'],
            };
            expect(getRecordUiConfigKey(config)).toEqual(
                'getRecordUi:005B0000003g6BCIAY:Full:View:Account.Fax,Account.Industry'
            );
        });

        it('should return a correct key for a config object with missing optional parameter', () => {
            const config = {
                recordIds: '005B0000003g6BCIAY',
                layoutTypes: ['Full'],
                optionalFields: ['Account.Fax', 'Account.Industry'],
            };
            expect(getRecordUiConfigKey(config)).toEqual(
                'getRecordUi:005B0000003g6BCIAY:Full:undefined:Account.Fax,Account.Industry'
            );
        });
    });
});
