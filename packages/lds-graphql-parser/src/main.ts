import { parse } from 'graphql/language';
import { LuvioDocumentNode } from './ast';
import { fieldVisitor } from './visitor';

function parseAndVisit(source: string): LuvioDocumentNode {
    const ast = parse(source);
    return fieldVisitor(ast);
}

export default parseAndVisit;

// type exports
export { LuvioDocumentNode };
