import { Reader, ReaderFragment } from '@luvio/engine';
import {
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import { followLink, getLuvioFieldNodeSelection } from '../type/Selection';
import { createRead as connectionCreateRead } from '../custom/connection';
import { createRead as recordCreateRead } from '../custom/record';
import { readScalarFieldSelection } from '../type/ScalarField';
import { render as renderField } from '../type/Field';
import { GraphQLVariables } from '../type/Variable';

function createCustomFieldRead(
    sel: LuvioSelectionCustomFieldNode,
    variables: GraphQLVariables
): ReaderFragment['read'] {
    if (sel.type === 'Connection') {
        return connectionCreateRead(sel, variables);
    }

    return recordCreateRead(sel, variables);
}

export function createRead(
    ast: LuvioSelectionNode | LuvioOperationDefinitionNode,
    variables: GraphQLVariables
) {
    if (ast.kind === 'CustomFieldSelection') {
        return createCustomFieldRead(ast as LuvioSelectionCustomFieldNode, variables);
    }

    if (
        ast.kind === 'FragmentSpread' ||
        ast.kind === 'InlineFragment' ||
        ast.kind === 'ScalarFieldSelection'
    ) {
        throw new Error('"FragmentSpread" and "InlineFragment" currently not supported');
    }

    return genericCreateRead(ast, variables);
}

const genericCreateRead: (
    ast: LuvioSelectionObjectFieldNode | LuvioOperationDefinitionNode,
    variables: GraphQLVariables
) => ReaderFragment['read'] = (
    ast: LuvioSelectionObjectFieldNode | LuvioOperationDefinitionNode,
    variables: GraphQLVariables
) => {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    return (source: any, builder: Reader<any>) => {
        const sink = {};
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name: fieldName, alias } = sel;
            const propertyName = alias === undefined ? fieldName : alias;
            builder.enterPath(fieldName);
            switch (sel.kind) {
                case 'ScalarFieldSelection':
                    readScalarFieldSelection(builder, source, fieldName, sink);
                    break;
                default: {
                    const data = followLink(
                        sel,
                        builder,
                        source[renderField(sel, variables)],
                        variables
                    );
                    builder.assignNonScalar(sink, propertyName, data);
                }
            }
            builder.exitPath();
        }
        return sink;
    };
};
