import {
    keyBuilderFromType,
    RecordRepresentation,
} from '../../../generated/types/RecordRepresentation';

describe('keyBuilderFromType', () => {
    it('returns RecordRepresentation key when apiName is not Name', () => {
        const mockRecordRepresentation = {
            id: 'foo',
            apiName: 'Opportunity',
        } as RecordRepresentation;
        const expected = 'UiApi::RecordRepresentation:foo';
        const key = keyBuilderFromType(mockRecordRepresentation);
        expect(key).toBe(expected);
    });

    it('returns RecordViewEntityRepresentation key when apiName is Name', () => {
        const mockRecordRepresentation = { id: 'foo', apiName: 'Name' } as RecordRepresentation;
        const expected = 'UiApi::RecordViewEntityRepresentation:Name:foo';
        const key = keyBuilderFromType(mockRecordRepresentation);
        expect(key).toBe(expected);
    });
});
