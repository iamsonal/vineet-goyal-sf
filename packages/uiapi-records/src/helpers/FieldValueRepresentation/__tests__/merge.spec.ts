import merge from '../merge';
import { LDS, IngestPath, Store } from '@ldsjs/engine';
import { FieldValueRepresentationNormalized } from '../../../generated/types/FieldValueRepresentation';

describe('displayValue', () => {
    it('returns non-null existing displayValue if incoming has null displayValue', () => {
        const incoming: FieldValueRepresentationNormalized = {
            displayValue: null,
            value: {},
        };
        const existing: FieldValueRepresentationNormalized = {
            displayValue: 'foo',
            value: {},
        };

        const mockLDS = new LDS(new Store(), jest.fn());
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

    it('returns non-null incoming displayValue if existing has null displayValue', () => {
        const incoming: FieldValueRepresentationNormalized = {
            displayValue: 'foo',
            value: {},
        };
        const existing: FieldValueRepresentationNormalized = {
            displayValue: null,
            value: {},
        };

        const mockLDS = new LDS(new Store(), jest.fn());
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

    it('returns incoming displayValue if incoming and existing both have displayValue', () => {
        const incoming: FieldValueRepresentationNormalized = {
            displayValue: 'foo',
            value: {},
        };
        const existing: FieldValueRepresentationNormalized = {
            displayValue: 'bar',
            value: {},
        };

        const mockLDS = new LDS(new Store(), jest.fn());
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
