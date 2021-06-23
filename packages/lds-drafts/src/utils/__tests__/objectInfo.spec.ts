import { getObjectInfosForRecords } from '../objectInfo';
import { keyBuilderObjectInfo } from '@salesforce/lds-adapters-uiapi';
import OpportunityObjectInfo from './data/object-Opportunity.json';
import { ObjectKeys } from '../language';

const Opportunity = 'Opportunity';
const Account = 'Account';
const OpportunityKey = keyBuilderObjectInfo({ apiName: Opportunity });

describe('objectInfo utils tests', () => {
    describe('getObjectInfosForRecords', () => {
        it('returns objectInfo map', async () => {
            const getEntriesMock = jest.fn().mockResolvedValue({
                [OpportunityKey]: {
                    data: OpportunityObjectInfo,
                },
            });
            const ds = {
                getEntries: getEntriesMock,
            } as any;
            const result = await getObjectInfosForRecords(ds, {
                foo: { data: { apiName: Opportunity } },
            } as any);

            expect(result[Opportunity]).toBeDefined();
        });
        it('excludes missing entries', async () => {
            const getEntriesMock = jest.fn().mockResolvedValue({
                [OpportunityKey]: {
                    data: OpportunityObjectInfo,
                },
            });
            const ds = {
                getEntries: getEntriesMock,
            } as any;
            const result = await getObjectInfosForRecords(ds, {
                foo: { data: { apiName: Opportunity } },
                bar: { data: { apiName: Account } },
            } as any);

            expect(result[Opportunity]).toBeDefined();
            expect(result[Account]).toBeUndefined();
        });
        it('exludes entries with empty apiName', async () => {
            const getEntriesMock = jest.fn().mockResolvedValue({
                [OpportunityKey]: {
                    data: OpportunityObjectInfo,
                },
            });
            const ds = {
                getEntries: getEntriesMock,
            } as any;
            const result = await getObjectInfosForRecords(ds, {
                foo: { data: { apiName: Opportunity } },
                bar: { data: { something: 'else' } },
            } as any);

            expect(ObjectKeys(result).length).toBe(1);
            expect(result[Opportunity]).toBeDefined();
        });
        it('returns empty map when durable store returns undefined', async () => {
            const getEntriesMock = jest.fn().mockResolvedValue(undefined);
            const ds = {
                getEntries: getEntriesMock,
            } as any;
            const result = await getObjectInfosForRecords(ds, {
                foo: { data: { apiName: Opportunity } },
            } as any);

            expect(result).toEqual({});
        });

        it('returns empty map when durable store returns empty map', async () => {
            const getEntriesMock = jest.fn().mockResolvedValue({});
            const ds = {
                getEntries: getEntriesMock,
            } as any;
            const result = await getObjectInfosForRecords(ds, {
                foo: { data: { apiName: Opportunity } },
            } as any);

            expect(result).toEqual({});
        });
    });
});
