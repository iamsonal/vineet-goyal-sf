import {
    ModelInfo,
    ParseError,
    PluginResult,
    NodeShapeDefinition,
    ShapeDefinition,
    ShapeTypes,
    ShapePrivate,
    ArrayShapeDefinition,
    UnionShapeDefinition,
} from '@luvio/compiler';

function validateUnion(
    node: UnionShapeDefinition,
    shapePrivate: ShapePrivate,
    parseErrors: ParseError[],
    visitedNodes: Record<string, boolean>
) {
    const { anyOf } = node;
    anyOf.forEach(member => {
        if (member.shapeType === ShapeTypes.NodeShape) {
            validateNode(member as NodeShapeDefinition, shapePrivate, parseErrors, visitedNodes);
        }
    });
}

function validateArray(
    node: ArrayShapeDefinition,
    shapePrivate: ShapePrivate,
    parseErrors: ParseError[],
    visitedNodes: Record<string, boolean>
) {
    const { items } = node;
    if (items.shapeType === ShapeTypes.NodeShape) {
        validateNode(items as NodeShapeDefinition, shapePrivate, parseErrors, visitedNodes);
    }
}

function validateNode(
    node: NodeShapeDefinition,
    shapePrivate: ShapePrivate,
    parseErrors: ParseError[],
    visitedNodes: Record<string, boolean>
) {
    const { id, name, properties } = node;

    if (visitedNodes[id] !== undefined) {
        return;
    }

    visitedNodes[id] = true;
    properties.forEach(property => {
        const { shapeType, name: propertyName } = property;
        if (shapeType === ShapeTypes.ArrayShape) {
            validateArray(
                (property as ShapeDefinition) as ArrayShapeDefinition,
                shapePrivate,
                parseErrors,
                visitedNodes
            );
        } else if (shapeType === ShapeTypes.NodeShape) {
            validateNode(
                (property as ShapeDefinition) as NodeShapeDefinition,
                shapePrivate,
                parseErrors,
                visitedNodes
            );
        } else if (shapeType === ShapeTypes.UnionShape) {
            validateUnion(
                (property as ShapeDefinition) as UnionShapeDefinition,
                shapePrivate,
                parseErrors,
                visitedNodes
            );
        } else {
            if (propertyName === 'eTag') {
                const privates = shapePrivate[id];
                if (privates === undefined || !privates.includes('eTag')) {
                    parseErrors.push(
                        Object.assign(
                            new Error(
                                `eTag of shape ${name} not marked with (lds.private) annotation.`
                            ),
                            {
                                line: 0,
                                column: 0,
                            }
                        )
                    );
                }
            }
        }
    });
}

/**
 * validate eTag property annotated with (lds.private) for resource annotated with (lds.adapter) return shapes
 */
function validateEtagIsPrivate(modelInfo: ModelInfo): ParseError[] {
    const { shapePrivate, resources } = modelInfo;
    const parseErrors: ParseError[] = [];
    const visitedNodes: Record<string, boolean> = {};

    resources.forEach(resource => {
        const { adapter, returnShape } = resource;
        if (adapter !== undefined && returnShape !== undefined) {
            validateNode(returnShape, shapePrivate, parseErrors, visitedNodes);
        }
    });

    return parseErrors;
}

export function validate(modelInfo: ModelInfo): Promise<PluginResult> {
    const errors = [...validateEtagIsPrivate(modelInfo)];

    if (errors.length === 0) {
        return Promise.resolve({
            hasErrors: false,
        });
    }

    return Promise.resolve({
        hasErrors: true,
        errors,
    });
}
