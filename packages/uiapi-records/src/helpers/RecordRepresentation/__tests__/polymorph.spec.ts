import polymorph from '../polymorph';
import { keyBuilder } from '../../../generated/types/RecordRepresentation';

describe('polymorph', () => {
    it('returns the same key when apiName is not Name', () => {
        const mockRecordRepresentation = { id: 'foo', apiName: 'Opportunity' };
        const regularKey = keyBuilder({ recordId: mockRecordRepresentation.id });
        const polymorphicKey = polymorph(mockRecordRepresentation as any);
        expect(polymorphicKey).toBe(regularKey);
    });

    it('returns different key when apiName is Name', () => {
        const mockRecordRepresentation = { id: 'foo', apiName: 'Name' };
        const expected = 'UiApi::RecordViewEntityRepresentation:Name:foo';
        const polymorphicKey = polymorph(mockRecordRepresentation as any);
        expect(polymorphicKey).toBe(expected);
    });
});
