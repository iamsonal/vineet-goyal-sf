import {
    parse,
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    StringValueNode,
} from 'graphql/language';
import {
    LuvioDocumentNode,
    LuvioArgumentNode,
    LuvioDefinitionNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
    LuvioFieldNode,
    LuvioVariableDefinitionNode,
    LuvioVariableNode,
    LuvioNamedTypeNode,
    LuvioListTypeNode,
    LuvioListValueNode,
    LuvioTypeNode,
} from './ast';
import { transform } from './document';

function parseAndVisit(source: string): LuvioDocumentNode {
    const ast = parse(source);
    return transform(ast);
}

export default parseAndVisit;

// type exports
export {
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    StringValueNode,
    LuvioDocumentNode,
    LuvioArgumentNode,
    LuvioDefinitionNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
    LuvioFieldNode,
    LuvioVariableDefinitionNode,
    LuvioVariableNode,
    LuvioNamedTypeNode,
    LuvioListTypeNode,
    LuvioListValueNode,
    LuvioTypeNode,
};
