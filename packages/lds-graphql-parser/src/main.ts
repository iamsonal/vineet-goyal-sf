import { parse } from 'graphql/language';
import { LuvioDocumentNode } from './ast';
import { transform } from './document';

function parseAndVisit(source: string): LuvioDocumentNode {
    const ast = parse(source);
    return transform(ast);
}

export default parseAndVisit;

// type exports
export { LuvioDocumentNode };
