import { OperationDefinitionNode } from 'graphql/language';
import { LuvioOperationDefinitionNode } from '../ast';
import { transform as QueryTransform } from './query';

export function transform(node: OperationDefinitionNode): LuvioOperationDefinitionNode {
    const { operation } = node;
    if (operation === 'query') {
        return QueryTransform(node);
    }

    throw new Error('Only query operation is supported');
}
