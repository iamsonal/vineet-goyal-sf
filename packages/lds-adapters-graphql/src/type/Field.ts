import type { LuvioFieldNode } from '@luvio/graphql-parser';
import type { SerializationOptions } from './Argument';
import { serialize as serializeArgument, render as renderArguments } from './Argument';
import type { GraphQLVariables } from './Variable';

export function serialize(sel: LuvioFieldNode) {
    return serializeField(sel, { render: false });
}

export function render(sel: LuvioFieldNode, variables: GraphQLVariables) {
    return serializeField(sel, { render: true, variables });
}

function serializeField(sel: LuvioFieldNode, option: SerializationOptions) {
    const { name: fieldName } = sel;
    if (sel.kind === 'ScalarFieldSelection') {
        return fieldName;
    }

    const { arguments: selectionArguments } = sel;
    if (selectionArguments === undefined || selectionArguments.length === 0) {
        return fieldName;
    }

    return `${fieldName}(${
        option.render === true
            ? renderArguments(selectionArguments, option.variables)
            : serializeArgument(selectionArguments)
    })`;
}
