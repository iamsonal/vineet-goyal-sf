import parseAndVisit from '../dist/ldsGraphqlParser.mjs';
import { readFileSync, existsSync } from 'fs';
import { resolve as resolvePath } from 'path';

const path = process.argv[2];
if (path === undefined) {
    throw new Error(`Invalid path "${path}". Usage: "yarn parse PATH_TO_GQL_QUERY.graphql)"`);
}

if (existsSync(path) === false) {
    throw new Error(`Invalid file "${path}", "${path}" does not exist`);
}

const file = readFileSync(resolvePath(path)).toString();

const str = parseAndVisit(file);

console.log(JSON.stringify(str, null, 2));
