import { StoreLink } from '@luvio/engine';
import {
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
} from '@luvio/graphql-parser';
import { render as renderFieldNode } from '../type/Field';
import { getLuvioFieldNodeSelection } from '../type/Selection';
import { GraphQLVariables } from '../type/Variable';

type LuvioNormalizedSelectionNode = LuvioSelectionObjectFieldNode | LuvioSelectionCustomFieldNode;

function resolveValue<T>(
    ast: LuvioNormalizedSelectionNode | LuvioSelectionScalarFieldNode,
    variables: GraphQLVariables,
    source: Record<string, unknown>
): T {
    const { alias } = ast;
    const propertyName = renderFieldNode(ast, variables);

    if (process.env.NODE_ENV !== 'production') {
        if (alias !== undefined && alias in source) {
            throw new Error(
                `Invalid alias "${alias}" passed to "equal" function. All aliases need to be normalized before calling equal`
            );
        }
    }

    return source[propertyName] as T;
}

function linkEquals(
    ast: LuvioNormalizedSelectionNode,
    variables: GraphQLVariables,
    existing: Record<string, StoreLink | undefined>,
    incoming: typeof existing
): boolean {
    const value = resolveValue<StoreLink>(ast, variables, existing);
    if (value === undefined) {
        return false;
    }
    const incomingLink = resolveValue<StoreLink>(ast, variables, incoming);

    if (process.env.NODE_ENV !== 'production') {
        if (incomingLink === undefined) {
            throw new Error('Unexpected undefined link');
        }
    }

    return value.__ref === incomingLink.__ref;
}

export function scalarFieldEquals(
    ast: LuvioSelectionScalarFieldNode,
    variables: GraphQLVariables,
    existing: Record<string, unknown>,
    incoming: typeof existing
): boolean {
    const { name } = ast;
    const value = existing[name];
    if (value === undefined) {
        return false;
    }
    return value === resolveValue(ast, variables, incoming);
}

export function equals<T extends Record<string, unknown | StoreLink>>(
    ast: { luvioSelections?: LuvioSelectionNode[] },
    variables: GraphQLVariables,
    existing: T,
    incoming: typeof existing
): boolean {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;

    for (let i = 0, len = selections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(selections[i]);
        if (sel.kind === 'ScalarFieldSelection') {
            if (scalarFieldEquals(sel, variables, existing, incoming) === false) {
                return false;
            }
        } else {
            if (
                linkEquals(
                    sel,
                    variables,
                    existing as Record<string, StoreLink>,
                    incoming as Record<string, StoreLink>
                ) === false
            ) {
                return false;
            }
        }
    }
    return true;
}
