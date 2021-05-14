const FIELD_VALUE_REPRESENTATION_REGEXP = /FieldValueRepresentation/;

function resolveDeclaredShape(shape, state) {
    const { modelInfo } = state;
    const { inherits, isLink, properties } = shape;
    const { declaredShapeDefinitions } = modelInfo;
    if (declaredShapeDefinitions[shape.id]) {
        return shape;
    }

    if (inherits && inherits.length) {
        return resolveDeclaredShape(inherits[0], state);
    }

    if (isLink) {
        return resolveDeclaredShape(shape.linkTarget, state);
    }

    if (properties && properties.length) {
        return resolveDeclaredShape(properties[0].range, state);
    }
}

function traverseShape(shape, state) {
    if (shape.isLink) {
        return traverseShape(shape.linkTarget, state);
    }

    switch (shape.shapeType) {
        case 2:
            return traverseNodeShape(shape, state);
    }
}

function traverseNodeShape(shape, state) {
    const { modelInfo, fieldValueRepId } = state;
    let containsFields = false;
    const filter = shape.properties
        .filter((prop) => {
            // filter out non-normalizable shapes
            return modelInfo.normalizableShapeDefinitions[prop.range.id] !== undefined;
        })
        .map((prop) => {
            const { range, name: propertyName } = prop;
            const resolved = resolveDeclaredShape(range, state);
            if (resolved === undefined) {
                return;
            }

            const { id: rangeId, name: shapeName } = resolved;
            // Check if this property references fields
            if (rangeId === fieldValueRepId) {
                containsFields = true;
                return {
                    isFieldsProperty: true,
                    name: propertyName,
                };
            }

            const value = traverseShape(range, state);
            if (value === undefined) {
                // This path DOES NOT contain any fields,
                // it is just a "simple" normalizable property
                return {
                    isFieldsProperty: false,
                    containsFields: false,
                    name: propertyName,
                    shapeName,
                    shapeId: rangeId,
                };
            }

            containsFields = true;
            // This path DOES contain fields,
            return {
                isFieldsProperty: false,
                containsFields: true,
                name: propertyName,
                shapeId: rangeId,
                shapeName,
                shape: value,
            };
        })
        .filter((val) => val !== undefined);

    return containsFields === false
        ? undefined
        : {
              ...shape,
              properties: filter,
          };
}

function parse(modelInfo) {
    const { declaredShapeDefinitions } = modelInfo;
    const declaredShapeDefinitionKeys = Object.keys(declaredShapeDefinitions);
    const fieldValueRepId = declaredShapeDefinitionKeys.find((id) =>
        FIELD_VALUE_REPRESENTATION_REGEXP.test(id)
    );

    const shapesWithFields = {};
    declaredShapeDefinitionKeys.forEach((id) => {
        if (id === fieldValueRepId) {
            return;
        }

        const shape = declaredShapeDefinitions[id];
        const fieldsDef = traverseShape(shape, {
            fieldValueRepId,
            modelInfo,
            shapesWithFields,
        });
        if (fieldsDef !== undefined) {
            shapesWithFields[id] = fieldsDef;
        }
    });

    const resourcesWithFields = modelInfo.resources.reduce((acc, resource) => {
        const { returnShape } = resource;
        if (returnShape === undefined) {
            return acc;
        }

        if (shapesWithFields[returnShape.id] !== undefined) {
            acc[resource.id] = resource;
        }
        return acc;
    }, {});

    return {
        shapesWithFields,
        resourcesWithFields,
    };
}

module.exports = { parse };
