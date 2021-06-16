import { ScopedFields, ScopedFieldsCollection } from '../ScopedFields';

describe('ScopedFields', () => {
    describe('ScopedFields.fromQueryParameterValue', () => {
        it('return undefined for null parameter value', () => {
            const result = ScopedFields.fromQueryParameterValue(null);
            expect(result).toBe(undefined);
        });
        it('return undefined for empty query parameter value', () => {
            const result = ScopedFields.fromQueryParameterValue('');
            expect(result).toBe(undefined);
        });

        it('return valid for unscoped field', () => {
            const field = 'Contact.Id';
            const result = ScopedFields.fromQueryParameterValue(field);
            expect(result.toQueryParameterValue()).toBe(field);
            expect(result.toQueryParams()).toEqual([field]);
        });

        it('return valid for unscoped fields', () => {
            const fields = 'Contact.Id,Contact.Name';
            const result = ScopedFields.fromQueryParameterValue(fields);
            expect(result.toQueryParameterValue()).toBe(fields);
            expect(result.toQueryParams()).toEqual(['Contact.Id', 'Contact.Name']);
        });

        it('return valid for scoped field', () => {
            const fields = 'Contacts:Contact.Id';
            const result = ScopedFields.fromQueryParameterValue(fields);
            expect(result.toQueryParameterValue()).toBe(fields);
            expect(result.toQueryParams()).toBe(fields);
        });

        it('return valid for scoped fields', () => {
            const fields = 'Contacts:Contact.Id,Contact.Name';
            const result = ScopedFields.fromQueryParameterValue(fields);
            expect(result.toQueryParameterValue()).toBe(fields);
            expect(result.toQueryParams()).toBe(fields);
        });
    });

    describe('ScopedFieldsCollection.fromQueryParameterValue', () => {
        it('return empty collection for empty query parameter value', () => {
            const result = ScopedFieldsCollection.fromQueryParameterValue(null);
            expect(result.toQueryParameterValue()).toBe('');
        });

        it('return empty collection for blank query parameter value', () => {
            const result = ScopedFieldsCollection.fromQueryParameterValue('');
            expect(result.toQueryParameterValue()).toBe('');
        });

        it('return valid for unscoped field', () => {
            const result = ScopedFieldsCollection.fromQueryParameterValue('Contact.Id');
            expect(result.toQueryParameterValue()).toBe('Contact.Id');
        });

        it('return valid for unscoped fields', () => {
            const result =
                ScopedFieldsCollection.fromQueryParameterValue('Contact.Id,Contact.Name');
            expect(result.toQueryParameterValue()).toBe('Contact.Id,Contact.Name');
        });

        it('return valid object for one relative list id, one field', () => {
            const oneListIdOneField = 'Contacts:Contact.Id';
            const result = ScopedFieldsCollection.fromQueryParameterValue(oneListIdOneField);
            expect(result.toQueryParameterValue()).toBe(oneListIdOneField);
        });

        it('return valid object for one relative list id, multiple fields', () => {
            const oneListIdMultipleFields = 'Contacts:Contact.Id,Contact.Name,Contact.Name2';
            const result = ScopedFieldsCollection.fromQueryParameterValue(oneListIdMultipleFields);
            expect(result.toQueryParameterValue()).toBe(oneListIdMultipleFields);
        });

        it('return valid object for mutiple relative list id, one field each', () => {
            const multipleListIdOneField = 'Contacts:Contact.Id;Opportunities:Opportunity.Id';
            const result = ScopedFieldsCollection.fromQueryParameterValue(multipleListIdOneField);
            expect(result.toQueryParameterValue()).toBe(multipleListIdOneField);
        });

        it('return valid object for mutiple relative list id, multiple fields each', () => {
            const multipleListIdMultipleField =
                'Contacts:Contact.Id,Contact.Name;Opportunities:Opportunity.Id,Opportunity.Name';
            const result = ScopedFieldsCollection.fromQueryParameterValue(
                multipleListIdMultipleField
            );
            expect(result.toQueryParameterValue()).toBe(multipleListIdMultipleField);
        });
    });

    describe('ScopedFieldsCollection.merge', () => {
        it(`merge scoped source into targe ok`, () => {
            const target = ScopedFieldsCollection.fromQueryParameterValue(
                'Contacts:Contact.Id,Contact.Name;Opportunities:Opportunity.Id'
            );
            const source = ScopedFieldsCollection.fromQueryParameterValue(
                'Contacts:Contact.Id;Opportunities:Opportunity.Id,Opportunity.Name'
            );

            target.merge(source);

            expect(target.toQueryParameterValue()).toBe(
                'Contacts:Contact.Id,Contact.Name;Opportunities:Opportunity.Id,Opportunity.Name'
            );
        });

        it(`merge unscoped source into targe ok`, () => {
            const target =
                ScopedFieldsCollection.fromQueryParameterValue('Contact.Id,Contact.Name');
            const source = ScopedFieldsCollection.fromQueryParameterValue(
                'Contact.Id,Contact.Phone'
            );

            target.merge(source);

            expect(target.toQueryParameterValue()).toBe('Contact.Id,Contact.Name,Contact.Phone');
        });
    });

    describe('ScopedFieldsCollection.split', () => {
        const maxLengthAllowed = 30;

        it(`null should not be splitted`, () => {
            const result =
                ScopedFieldsCollection.fromQueryParameterValue(null).split(maxLengthAllowed);

            expect(result.length).toBe(0);
        });

        it(`empty string should not be splitted`, () => {
            const result =
                ScopedFieldsCollection.fromQueryParameterValue('').split(maxLengthAllowed);

            expect(result.length).toBe(0);
        });

        it(`short one should not be splitted`, () => {
            const result =
                ScopedFieldsCollection.fromQueryParameterValue('Note.Id,Note.Name').split(
                    maxLengthAllowed
                );

            expect(result.length).toBe(1);
            expect(result[0].toQueryParameterValue()).toBe('Note.Id,Note.Name');
        });

        it(`scoped short one should not be splitted`, () => {
            const result =
                ScopedFieldsCollection.fromQueryParameterValue('Notes:Note.Id,Note.Id2').split(
                    maxLengthAllowed
                );

            expect(result.length).toBe(1);
            expect(result[0].toQueryParameterValue()).toBe('Notes:Note.Id,Note.Id2');
        });

        it(`long one should be splitted`, () => {
            const result = ScopedFieldsCollection.fromQueryParameterValue(
                'Note.Id1,Note.Id2,Note.Id3,Note.Id4'
            ).split(maxLengthAllowed);

            expect(result.length).toBe(2);
            expect(result[0].toQueryParameterValue()).toBe('Note.Id1,Note.Id2,Note.Id3');
            expect(result[1].toQueryParameterValue()).toBe('Note.Id4');
        });

        it(`scoped long one should be splitted`, () => {
            const result = ScopedFieldsCollection.fromQueryParameterValue(
                'Notes:Note.Id1,Note.Id2,Note.Id3,Note.Id4'
            ).split(maxLengthAllowed);

            expect(result.length).toBe(2);
            expect(result[0].toQueryParameterValue()).toBe('Notes:Note.Id1,Note.Id2');
            expect(result[1].toQueryParameterValue()).toBe('Notes:Note.Id3,Note.Id4');
        });

        it(`multiple scoped long one should be splitted`, () => {
            const result = ScopedFieldsCollection.fromQueryParameterValue(
                'Notes:Note.Id1,Note.Id2;Contacts:Contact.Id'
            ).split(maxLengthAllowed);

            expect(result.length).toBe(2);
            expect(result[0].toQueryParameterValue()).toBe('Notes:Note.Id1,Note.Id2');
            expect(result[1].toQueryParameterValue()).toBe('Contacts:Contact.Id');
        });
    });
});
