import {
    keyBuilderFromType as generatedKeyBuilderFromType,
    RecordRepresentation,
} from '../../../generated/types/RecordRepresentation';
import { keyBuilderFromType } from '../../../overrides/types/RecordRepresentation';

describe('keyBuilderFromType', () => {
    it('returns the same key when apiName is not Name', () => {
        const mockRecordRepresentation = {
            id: 'foo',
            apiName: 'Opportunity',
        } as RecordRepresentation;
        const regularKey = generatedKeyBuilderFromType(mockRecordRepresentation);
        const polymorphicKey = keyBuilderFromType(mockRecordRepresentation);
        expect(polymorphicKey).toBe(regularKey);
    });

    it('returns different key when apiName is Name', () => {
        const mockRecordRepresentation = { id: 'foo', apiName: 'Name' } as RecordRepresentation;
        const expected = 'UiApi::RecordViewEntityRepresentation:Name:foo';
        const polymorphicKey = keyBuilderFromType(mockRecordRepresentation);
        expect(polymorphicKey).toBe(expected);
    });
});
