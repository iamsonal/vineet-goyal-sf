/* eslint no-console: ["error", { allow: ["log", "error"] }] */

import { sql, transform } from '../dist/graphql-eval.js';
import parseAndVisit from '@salesforce/lds-graphql-parser';

import { readFileSync, existsSync } from 'fs';
import { resolve as resolvePath } from 'path';

function parse() {
    let rawJson = readFileSync('./src/__tests__/mockData/objectInfos.json');
    let infoJson = JSON.parse(rawJson);

    const path = process.argv[2];
    if (path === undefined) {
        console.error(`Invalid path "${path}". Usage: "yarn parse PATH_TO_GQL_QUERY.graphql)"`);
        return;
    }

    if (existsSync(path) === false) {
        console.error(`Invalid file "${path}", "${path}" does not exist`);
        return;
    }

    const file = readFileSync(resolvePath(path)).toString();

    const str = parseAndVisit(file);
    const result = transform(str, { objectInfoMap: infoJson });

    if (result.isSuccess === false) {
        console.error(`Could not create local eval AST: ${result.error}`);
        return;
    }

    const evalSql = sql(result.value, {
        soupColumn: 'TABLE_1_1',
        keyColumn: 'TABLE_1_0',
        soupTable: 'TABLE_1',
    });

    console.log(evalSql);
}

parse();
