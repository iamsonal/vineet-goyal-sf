import { OperationDefinitionNode } from 'graphql/language';
import { LuvioOperationDefinitionNode } from '../ast';
import { transform as QueryTransform } from './query';

export function transform(node: OperationDefinitionNode): LuvioOperationDefinitionNode {
    const { operation } = node;
    if (operation === 'query') {
        return QueryTransform(node);
    }

    // eslint-disable-next-line @salesforce/lds/no-error-in-production
    throw new Error(`Unsupported ${operation} operation. Only query operation is supported`);
}
