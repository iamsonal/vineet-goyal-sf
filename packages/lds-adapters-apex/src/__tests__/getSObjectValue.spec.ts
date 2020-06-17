import { getSObjectValue } from '../lds-apex-static-utils';
import { ApexSObject } from '../types';

describe('getSObjectValue', () => {
    it.each([
        ['string', 'Account.Name'],
        ['fieldId', { fieldApiName: 'Name', objectApiName: 'Account' }],
    ])('returns field value for non-spanning %s', (_type, field) => {
        const sobject: ApexSObject = { Name: 'Acme' };
        expect(getSObjectValue(sobject, field)).toBe('Acme');
    });

    it.each([
        ['string', 'Account.Other'],
        ['fieldId', { fieldApiName: 'Other', objectApiName: 'Account' }],
    ])('returns undefined for non-existent non-spanning %s', (_type, field) => {
        const sobject: ApexSObject = { Name: 'Acme' };
        expect(getSObjectValue(sobject, field)).toBeUndefined();
    });

    it.each([
        ['string', 'Opportunity.Account.CreatedBy.CreatedBy.Name'],
        [
            'fieldId',
            { fieldApiName: 'Account.CreatedBy.CreatedBy.Name', objectApiName: 'Opportunity' },
        ],
    ])('returns field value for leaf spanning %s', (_type, field) => {
        const sobject: ApexSObject = {
            Account: {
                CreatedBy: {
                    CreatedBy: {
                        Name: 'Frank',
                    },
                    Name: 'Sam',
                },
            },
        };
        expect(getSObjectValue(sobject, field)).toBe('Frank');
    });

    it.each([
        ['string', 'Opportunity.Account.CreatedBy'],
        ['fieldId', { fieldApiName: 'Account.CreatedBy', objectApiName: 'Opportunity' }],
    ])('returns field value for non-leaf spanning %s', (_type, field) => {
        const sobject: ApexSObject = {
            Account: {
                CreatedBy: {
                    CreatedBy: {
                        Name: 'Frank',
                    },
                    Name: 'Sam',
                },
            },
        };
        expect(getSObjectValue(sobject, field)).toEqual({
            CreatedBy: { Name: 'Frank' },
            Name: 'Sam',
        });
    });

    it.each([
        ['string', 'Opportunity.Account.LastModifiedBy.Name'],
        ['fieldId', { fieldApiName: 'Account.LastModifiedBy.Name', objectApiName: 'Opportunity' }],
    ])('returns undefined for non-existent spanning %s', (_type, field) => {
        const sobject: ApexSObject = {
            Account: {
                CreatedBy: {
                    CreatedBy: {
                        Name: 'Frank',
                    },
                    Name: 'Sam',
                },
            },
        };
        expect(getSObjectValue(sobject, field)).toBeUndefined();
    });

    it('returns undefined if sObject is not an object', () => {
        const fieldId = { fieldApiName: 'Name', objectApiName: 'Account' };
        expect(getSObjectValue(undefined, fieldId)).toBeUndefined();
        expect(getSObjectValue(null, fieldId)).toBeUndefined();
        expect(getSObjectValue([], fieldId)).toBeUndefined();
        expect(getSObjectValue('', fieldId)).toBeUndefined();
    });
});
