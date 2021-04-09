import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    StringValueNode,
    LuvioArgumentNode,
    LuvioDefinitionNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
} from '@salesforce/lds-graphql-parser';

const RECORD_ID_FIELD = 'Id';
const RECORD_WEAK_ETAG_FIELD = 'WeakEtag';

const { keys } = Object;

function serializeValueNode(valueDefinition: LuvioValueNode) {
    const { kind } = valueDefinition;
    switch (kind) {
        case 'ObjectValue':
            return serializeObjectValueNode(valueDefinition as LuvioObjectValueNode);
        case 'StringValue':
            return serializeStringValueNode(valueDefinition as StringValueNode);
        case 'NullValue':
            return 'null';
        case 'FloatValue':
            return (valueDefinition as FloatValueNode).value;
        case 'IntValue':
            return (valueDefinition as IntValueNode).value;
        case 'BooleanValue':
            return (valueDefinition as BooleanValueNode).value;
    }

    throw new Error(`Unable to serialize graphql query, unsupported value node "${kind}"`);
}

function serializeStringValueNode(literalValueNode: StringValueNode) {
    return `"${literalValueNode.value}"`;
}

function serializeObjectValueNode(objectValueDefinition: LuvioObjectValueNode) {
    const { fields } = objectValueDefinition;
    let str = '';
    const fieldKeys = keys(fields);
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str = `${str} { ${fieldKey}: ${serializeValueNode(fields[fieldKey])} }`;
    }
    return str;
}

function serializeArguments(argDefinitions: LuvioArgumentNode[] | undefined) {
    if (argDefinitions === undefined) {
        return '';
    }

    let str = '';
    for (let i = 0, len = argDefinitions.length; i < len; i += 1) {
        const def = serializeArgument(argDefinitions[i]);
        str = `${str}${def}`;
    }
    return str;
}

function serializeArgument(argDefinition: LuvioArgumentNode) {
    const { name, value } = argDefinition;
    return `${name}: ${serializeValueNode(value)}`;
}

function serializeSelections(selections: LuvioSelectionNode[] | undefined) {
    if (selections === undefined) {
        return '';
    }
    let str = '';
    for (let i = 0, len = selections.length; i < len; i += 1) {
        const def = serializeFieldNode(selections[i]);
        str = `${str}${def}`;
    }

    return str;
}

const RECORD_ID_SCALAR_FIELD_SELECTION: LuvioSelectionScalarFieldNode = {
    kind: 'ScalarFieldSelection',
    name: RECORD_ID_FIELD,
};

const RECORD_WEAK_ETAG_FIELD_SELECTION: LuvioSelectionScalarFieldNode = {
    kind: 'ScalarFieldSelection',
    name: RECORD_WEAK_ETAG_FIELD,
};

const REQUIRED_RECORD_FIELDS: {
    fieldNames: string[];
    selections: { [key: string]: LuvioSelectionScalarFieldNode };
} = {
    fieldNames: [RECORD_ID_FIELD, RECORD_WEAK_ETAG_FIELD],
    selections: {
        [RECORD_ID_FIELD]: RECORD_ID_SCALAR_FIELD_SELECTION,
        [RECORD_WEAK_ETAG_FIELD]: RECORD_WEAK_ETAG_FIELD_SELECTION,
    },
};

const {
    fieldNames: REQUIRED_FIELD_NAMES,
    selections: REQUIRED_RECORD_SELECTIONS,
} = REQUIRED_RECORD_FIELDS;
const { length: REQUIRED_RECORD_FIELDS_LEN } = REQUIRED_FIELD_NAMES;

function serializeRequiredRecordFields(currentString: string, presentFields: Record<string, true>) {
    let str = '';
    for (let i = 0; i < REQUIRED_RECORD_FIELDS_LEN; i += 1) {
        const fieldName = REQUIRED_FIELD_NAMES[i];
        if (presentFields[fieldName] !== true) {
            str = `${str}${serializeScalarFieldNode(REQUIRED_RECORD_SELECTIONS[fieldName])}`;
        }
    }
    return `${str}${currentString}`;
}

function serializeRecordSelections(selections: LuvioSelectionNode[] | undefined) {
    if (selections === undefined) {
        return '';
    }
    let str = '';
    const fields: Record<string, true> = {};
    for (let i = 0, len = selections.length; i < len; i += 1) {
        const sel = selections[i];
        fields[(sel as any).name] = true;
        const def = serializeFieldNode(sel);
        str = `${str}${def}`;
    }

    return serializeRequiredRecordFields(str, fields);
}

function serializeFieldNode(def: LuvioSelectionNode) {
    const { kind } = def;
    switch (kind) {
        case 'ObjectFieldSelection':
            return serializeObjectFieldNode(def as LuvioSelectionObjectFieldNode);
        case 'CustomFieldSelection':
            return serializeCustomFieldNode(def as LuvioSelectionCustomFieldNode);
        case 'ScalarFieldSelection':
            return serializeScalarFieldNode(def as LuvioSelectionScalarFieldNode);
    }

    throw new Error(`Unable to serialize graphql query, unsupported field node "${kind}"`);
}

function serializeScalarFieldNode(def: LuvioSelectionScalarFieldNode) {
    return `${def.name}, `;
}

function serializeObjectFieldNode(def: LuvioSelectionObjectFieldNode) {
    const { luvioSelections } = def;
    return `${def.name} { ${serializeSelections(luvioSelections)} }`;
}

function serializeCustomFieldConnection(def: LuvioSelectionCustomFieldNode) {
    const { name, luvioSelections, arguments: args } = def;
    return `${name}(${serializeArguments(args)}) { ${serializeSelections(luvioSelections)} }`;
}

function serializeCustomFieldRecord(def: LuvioSelectionCustomFieldNode) {
    const { name, luvioSelections } = def;
    return `${name} { ${serializeRecordSelections(luvioSelections)} }`;
}

function serializeCustomFieldNode(def: LuvioSelectionCustomFieldNode) {
    const { type } = def;

    switch (type) {
        case 'Connection':
            return serializeCustomFieldConnection(def);
        case 'Record':
            return serializeCustomFieldRecord(def);
    }

    throw new Error(`Unable to serialize graphql query, unsupported CustomField type "${type}"`);
}

function serializeOperationNode(def: LuvioDefinitionNode) {
    const { kind } = def;
    switch (kind) {
        case 'OperationDefinition':
            return serializeOperationDefinition(def as LuvioOperationDefinitionNode);
    }

    throw new Error(
        `Unable to serialize graphql query, unsupported OperationDefinition type "${kind}"`
    );
}

function serializeOperationDefinition(def: LuvioOperationDefinitionNode) {
    const { operation, luvioSelections } = def;
    return `${operation} { ${serializeSelections(luvioSelections)} }`;
}

export function astToString(ast: LuvioDocumentNode) {
    const { definitions } = ast;
    let str = '';
    for (let i = 0, len = definitions.length; i < len; i += 1) {
        const def = serializeOperationNode(definitions[i]);
        str = `${str}${def}`;
    }

    return str;
}
