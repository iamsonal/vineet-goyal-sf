import merge from '../merge';
import { Luvio, IngestPath, Store, Environment } from '@luvio/engine';
import { FieldValueRepresentationNormalized } from '../../../generated/types/FieldValueRepresentation';

describe('displayValue', () => {
    it('replace existing displayValue if the incoming displayValue and value are both null', () => {
        const incoming: FieldValueRepresentationNormalized = {
            displayValue: null,
            value: null,
        };
        const existing: FieldValueRepresentationNormalized = {
            displayValue: 'bar',
            value: { __ref: 'ref' },
        };

        const mockLDS = new Luvio(new Environment(new Store(), jest.fn()));
        const mockIgestPath: IngestPath = {
            fullPath: '',
            parent: {
                data: {},
                key: '',
                existing: {},
            },
        };

        const merged = merge(existing, incoming, mockLDS, mockIgestPath);
        expect(merged.displayValue).toEqual(null);
    });

    it('returns incoming displayValue if incoming and existing both have displayValue', () => {
        const incoming: FieldValueRepresentationNormalized = {
            displayValue: 'foo',
            value: { __ref: 'ref' },
        };
        const existing: FieldValueRepresentationNormalized = {
            displayValue: 'bar',
            value: { __ref: 'ref' },
        };

        const mockLDS = new Luvio(new Environment(new Store(), jest.fn()));
        const mockIgestPath: IngestPath = {
            fullPath: '',
            parent: {
                data: {},
                key: '',
                existing: {},
            },
        };

        const merged = merge(existing, incoming, mockLDS, mockIgestPath);
        expect(merged.displayValue).toEqual('foo');
    });
});
