const path = require('path');

const { createImportsMap } = require('./create-import-context');
const { parse } = require('./parse-fields');

// Adapter Generation
const { generateFieldsAdapterFragment } = require('./adapter/generate-fields-fragment');
const { generateFieldsIngestSuccess } = require('./adapter/generate-fields-ingest-success');
const {
    generateResolveUnfulfilledSnapshot,
} = require('./adapter/generate-fields-resolve-unfulfilled-snapshot');

// Resource Generation
const { generateResourceIngestSuccess } = require('./resource/generate-ingest-success');
const { generateResourceFieldsSelect } = require('./resource/generate-fields-select');

// Shape Generation
const { generateFieldsIngest } = require('./shape/generate-ingest-fields');
const { generateShapeFieldsSelect } = require('./shape/generate-select-fields');

let fieldsAst;

const adaptersWithFieldDefinitions = {
    getRecordTemplateClone: {
        optionalFields: {
            configName: 'optionalFields',
        },
        fields: null,
    },
    getRecordTemplateCreate: {
        optionalFields: {
            configName: 'optionalFields',
        },
        fields: null,
    },
    getRecord: {
        optionalFields: {
            configName: 'optionalFields',
        },
        fields: {
            configName: 'fields',
        },
    },
    getQuickActionDefaults: {
        optionalFields: {
            configName: 'optionalFields',
        },
        fields: null,
    },
};

function generateShape(shape, outputDir, createGenerationContext, modelInfo) {
    const generatedShapesDir = path.join(outputDir, 'types', `${shape.name}.ts`);

    const context = createGenerationContext(generatedShapesDir);
    const importsMap = createImportsMap(context.importContext);
    const code = [
        generateFieldsIngest(shape, {
            modelInfo,
            generationContext: context,
            propertyName: null,
            importsMap,
            fieldsAst,
        }),
        generateShapeFieldsSelect(shape, {
            modelInfo,
            generationContext: context,
            propertyName: null,
            importsMap,
            fieldsAst,
        }),
    ];

    context.write(code.join('\n\n'));
}

function generateResource(resource, def, outputDir, createGenerationContext, modelInfo) {
    const generatedResourcesDir = path.join(outputDir, 'resources', `${resource.name}.ts`);

    const context = createGenerationContext(generatedResourcesDir);
    const importsMap = createImportsMap(context.importContext);
    const state = {
        modelInfo,
        generationContext: context,
        propertyName: null,
        importsMap,
        fieldsAst,
        def,
    };
    const code = [
        generateResourceIngestSuccess(resource, state),
        generateResourceFieldsSelect(resource, state),
    ];
    context.write(code.join('\n\n'));
}

function generateAdapter(adapter, resource, def, outputDir, createGenerationContext, modelInfo) {
    const adapterDir = path.join(outputDir, 'adapters', `${adapter.name}.ts`);
    const adapterContext = createGenerationContext(adapterDir);
    const adapterImportsMap = createImportsMap(adapterContext.importContext);
    const state = {
        modelInfo,
        generationContext: adapterContext,
        importsMap: adapterImportsMap,
    };
    const code = [
        generateFieldsAdapterFragment(adapter, resource, def, state),
        generateFieldsIngestSuccess(adapter, resource, def, state),
        generateResolveUnfulfilledSnapshot(adapter, resource, def, state),
    ];

    adapterContext.write(code.join('\n\n'));
}

function getSuffix(id) {
    const split = id.split('#');
    return split[1].replace('/luvio', '');
}

function linkFieldImports(fieldsAst, addImportOverride) {
    const { resourcesWithFields } = fieldsAst;
    Object.keys(resourcesWithFields).forEach(resourceId => {
        const resource = resourcesWithFields[resourceId];
        const { adapter } = resource;
        if (adapter === undefined) {
            return;
        }

        const def = adaptersWithFieldDefinitions[adapter.name];
        if (def === undefined) {
            return;
        }
        const resourceSuffix = getSuffix(resourceId);
        [
            {
                generatedIdentifier: 'select',
                targetIdentifier: 'selectFields',
            },
        ].forEach(({ generatedIdentifier, targetIdentifier }) => {
            addImportOverride(
                resourceSuffix,
                path.resolve('src', 'generated', 'fields', 'resources', resource.name),
                generatedIdentifier,
                targetIdentifier
            );
        });

        const adapterSuffix = getSuffix(adapter.id);
        [
            {
                generatedIdentifier: 'adapterFragment',
                targetIdentifier: 'adapterFragment',
            },
            {
                generatedIdentifier: 'buildNetworkSnapshot',
                targetIdentifier: 'buildNetworkSnapshot',
            },
            {
                generatedIdentifier: 'resolveUnfulfilledSnapshot',
                targetIdentifier: 'resolveUnfulfilledSnapshot',
            },
        ].forEach(({ generatedIdentifier, targetIdentifier }) => {
            addImportOverride(
                adapterSuffix,
                path.resolve('src', 'generated', 'fields', 'adapters', adapter.name),
                generatedIdentifier,
                targetIdentifier
            );
        });
    });
}

module.exports = {
    validate: (modelInfo, addImportOverride) => {
        fieldsAst = parse(modelInfo);
        linkFieldImports(fieldsAst, addImportOverride);
    },

    afterGenerate: (compilerConfig, modelInfo, createGenerationContext) => {
        const generatedFieldsDir = path.join(compilerConfig.outputDir, 'fields');
        const { shapesWithFields, resourcesWithFields } = fieldsAst;
        Object.keys(shapesWithFields).forEach(shapeId => {
            generateShape(
                shapesWithFields[shapeId],
                generatedFieldsDir,
                createGenerationContext,
                modelInfo
            );
        });

        Object.keys(resourcesWithFields).forEach(resourceId => {
            const resource = resourcesWithFields[resourceId];
            const { adapter } = resource;
            if (adapter === undefined) {
                return;
            }

            const def = adaptersWithFieldDefinitions[adapter.name];
            if (def === undefined) {
                return;
            }

            generateResource(resource, def, generatedFieldsDir, createGenerationContext, modelInfo);
            generateAdapter(
                adapter,
                resource,
                def,
                generatedFieldsDir,
                createGenerationContext,
                modelInfo
            );
        });
    },
};
