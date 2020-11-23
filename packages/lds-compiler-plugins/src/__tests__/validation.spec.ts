import { validate } from '../validation';
import { ShapeTypes } from '@luvio/compiler';

describe('validation plugin', () => {
    it('validates eTag property is annotated with (lds.private)', async () => {
        const mockProperty = {
            name: 'eTag',
        };
        const mockProperties = [mockProperty];
        const mockShape = {
            id: 'foo',
            name: 'foo_name',
            properties: mockProperties,
        };
        const mockResource = {
            adapter: 'fooAdapter',
            returnShape: mockShape,
        };
        const mockResources = [mockResource];
        const mockShapePrivate = {
            foo: ['eTag'],
        };
        const mockModelInfo = {
            resources: mockResources,
            shapePrivate: mockShapePrivate,
        };
        const results = await validate(mockModelInfo as any);
        expect(results.hasErrors).toBe(false);
    });

    it('returns parse errors when eTag property is not annotated with (lds.private', async () => {
        const mockProperty = {
            name: 'eTag',
        };
        const mockProperties = [mockProperty];
        const mockShape = {
            id: 'foo',
            name: 'foo_name',
            properties: mockProperties,
        };
        const mockResource = {
            adapter: 'fooAdapter',
            returnShape: mockShape,
        };
        const mockResources = [mockResource];
        const mockShapePrivate = {
            foo: ['bar'],
        };
        const mockModelInfo = {
            resources: mockResources,
            shapePrivate: mockShapePrivate,
        };
        const { hasErrors, errors } = await validate(mockModelInfo as any);
        expect(hasErrors).toBe(true);
        expect(errors[0].message).toBe(
            'eTag of shape foo_name not marked with (lds.private) annotation.'
        );
    });

    it('validates eTag property of child node shape', async () => {
        const mockProperty = {
            name: 'eTag',
        };
        const mockProperties = [mockProperty];
        const mockChildShape = {
            id: 'foo_child',
            name: 'foo_child_name',
            shapeType: ShapeTypes.NodeShape,
            properties: mockProperties,
        };
        const mockShape = {
            id: 'foo',
            name: 'foo_name',
            properties: [mockChildShape],
        };
        const mockResource = {
            adapter: 'fooAdapter',
            returnShape: mockShape,
        };
        const mockResources = [mockResource];
        const mockShapePrivate = {
            foo_child: ['eTag'],
        };
        const mockModelInfo = {
            resources: mockResources,
            shapePrivate: mockShapePrivate,
        };
        const results = await validate(mockModelInfo as any);
        expect(results.hasErrors).toBe(false);
    });

    it('validates eTag property of child array shape', async () => {
        const mockProperty = {
            name: 'eTag',
        };
        const mockProperties = [mockProperty];
        const mockChildShape = {
            id: 'foo_child',
            name: 'foo_child_name',
            shapeType: ShapeTypes.NodeShape,
            properties: mockProperties,
        };
        const mockArrayShape = {
            items: mockChildShape,
            shapeType: ShapeTypes.ArrayShape,
        };
        const mockShape = {
            id: 'foo',
            name: 'foo_name',
            properties: [mockArrayShape],
        };
        const mockResource = {
            adapter: 'fooAdapter',
            returnShape: mockShape,
        };
        const mockResources = [mockResource];
        const mockShapePrivate = {
            foo_child: ['eTag'],
        };
        const mockModelInfo = {
            resources: mockResources,
            shapePrivate: mockShapePrivate,
        };
        const results = await validate(mockModelInfo as any);
        expect(results.hasErrors).toBe(false);
    });

    it('validates eTag property of child union shape', async () => {
        const mockProperty = {
            name: 'eTag',
        };
        const mockProperties = [mockProperty];
        const mockChildShape = {
            id: 'foo_child',
            name: 'foo_child_name',
            shapeType: ShapeTypes.NodeShape,
            properties: mockProperties,
        };
        const mockUnionShape = {
            anyOf: [mockChildShape, { shapeType: ShapeTypes.NilShape }],
            shapeType: ShapeTypes.UnionShape,
        };
        const mockShape = {
            id: 'foo',
            name: 'foo_name',
            properties: [mockUnionShape],
        };
        const mockResource = {
            adapter: 'fooAdapter',
            returnShape: mockShape,
        };
        const mockResources = [mockResource];
        const mockShapePrivate = {
            foo_child: ['eTag'],
        };
        const mockModelInfo = {
            resources: mockResources,
            shapePrivate: mockShapePrivate,
        };
        const results = await validate(mockModelInfo as any);
        expect(results.hasErrors).toBe(false);
    });
});
