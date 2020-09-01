// @ts-check

/**
 * @typedef {import("@ldsjs/compiler").CompilerConfig} CompilerConfig
 * @typedef {import("@ldsjs/compiler").ShapeDefinition} ShapeDefinition
 * @typedef {import("@ldsjs/compiler").ArrayShapeDefinition} ArrayShapeDefinition
 * @typedef {import("@ldsjs/compiler").NodeShapeDefinition} NodeShapeDefinition
 * @typedef {import("@ldsjs/compiler").ModelInfo} ModelInfo
 * @typedef {{name: string, method: string}} AdapterInfo
 * @typedef {{[key:string]: "object" | "map" | "array"}} RecordPathMap
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const dedent = require('dedent');

const RECORD_REPRESENTATION = 'RecordRepresentation';
const REVIVE_RECORDS_FROM_DURABLE_STORE = 'reviveRecordsFromDurableStore';
const CAN_REVIVE = 'canRevive';
const REVIVE = 'revive';
const RESPONSE_FIELD = 'response';
const REQUEST_FIELD = 'request';
const STORE_FIELD = 'store';
const DURABLE_STORE_FIELD = 'durableStore';

/**
 * @param {string} path
 * @returns {string}
 */
function replacePath(path) {
    return `'${path.replace(/{(\w+)}/g, (_, match) => {
        return `' + ${REQUEST_FIELD}.urlParams["${match}"] + '`;
    })}'`;
}

/**
 * Recursively searches for RecordRepresentations in a node
 * The records will either be single reps, in a map or an array.
 * @param {ShapeDefinition} shape
 * @param {ModelInfo} modelInfo
 * @param {string} currentPath
 * @param {RecordPathMap} recordLocations
 * @returns {void}
 */
function recursivelyFindRecordReps(shape, modelInfo, currentPath, recordLocations) {
    if (shape.name === RECORD_REPRESENTATION) {
        // found a record, insert an entry into the record Locations
        recordLocations[currentPath] = 'object';
        return;
    }
    if (shape.isLink) {
        if (shape.linkLabel === RECORD_REPRESENTATION) {
            return;
        }
        recursivelyFindRecordReps(
            /** @type {ShapeDefinition} */ (shape.linkTarget),
            modelInfo,
            currentPath,
            recordLocations
        );
    } else {
        const properties = /**@type {NodeShapeDefinition}*/ (shape).properties;
        if (properties === undefined) {
            return;
        }
        for (const prop of properties) {
            const range = prop.range;
            const items = /**@type {ArrayShapeDefinition}*/ (range).items;
            if (prop.name === '//') {
                if (range.isLink) {
                    const linkLabel = range.linkLabel;
                    if (linkLabel === RECORD_REPRESENTATION) {
                        recordLocations[currentPath] = 'map';
                    }
                }
            } else if (items !== undefined) {
                if (items.isLink) {
                    if (items.linkLabel === RECORD_REPRESENTATION) {
                        recordLocations[currentPath.concat(`?.${prop.name}`)] = 'array';
                    }
                }
            } else {
                recursivelyFindRecordReps(
                    prop.range,
                    modelInfo,
                    currentPath.concat(`?.${prop.name}`),
                    recordLocations
                );
            }
        }
    }
}

/**
 * @param {CompilerConfig} compilerConfig
 * @param {ModelInfo} modelInfo
 * @returns {void}
 */
function generateRecordRevivalHandlers(compilerConfig, modelInfo) {
    const resources = modelInfo.resources.filter(resource => resource.adapter !== undefined);

    const exports = [];
    const handlers = [];
    for (const resource of resources) {
        const { returnShape, name, path, method } = resource;

        if (returnShape !== undefined) {
            /** @type {RecordPathMap} */
            const recordPaths = {};
            recursivelyFindRecordReps(
                returnShape,
                modelInfo,
                `(${RESPONSE_FIELD}.body as any)`,
                recordPaths
            );
            const recordPathIds = Object.keys(recordPaths);
            const length = recordPathIds.length;
            if (length === 0) {
                continue;
            }
            if (length !== 1) {
                // today we only have response types that contain record reps in one part of the response
                // if we ever support responses that contain records in other parts of the response, we would have
                // to update this logic
                throw Error(
                    'Only RecordRepresentations in one part of a response are currently supported'
                );
            }

            const resolvedPath = replacePath(path);
            const handlerName = `${name}RevivalHandler`;

            exports.push(handlerName);

            const recordPath = recordPathIds[0];
            const type = recordPaths[recordPath];
            let revivalCode = '';

            if (type === 'object') {
                revivalCode = `const record = ${recordPath};
                        const ids = extractRecordIds(record);
                        return ${REVIVE_RECORDS_FROM_DURABLE_STORE}(ids, ${STORE_FIELD}, ${DURABLE_STORE_FIELD});`;
            } else if (type === 'array') {
                revivalCode = `const records = ${recordPath};
                        if(records === undefined) {
                            return Promise.resolve();
                        }
                        const reviveIds = ObjectCreate(null);
                        for (let i = 0, len = records.length; i < len; i++) {
                            const record = records[i];
                            Object.assign(reviveIds, extractRecordIds(record));
                        }
                        return ${REVIVE_RECORDS_FROM_DURABLE_STORE}(reviveIds, ${STORE_FIELD}, ${DURABLE_STORE_FIELD});`;
            } else if (type === 'map') {
                revivalCode = `const records = ${recordPath};
                        const ids = ObjectKeys(records);
                        const reviveIds = ObjectCreate(null);
                        for (let i = 0, len = ids.length; i < len; i++) {
                            const id = ids[i];
                            const record = records[id];
                            Object.assign(reviveIds, extractRecordIds(record));
                        }
                        return ${REVIVE_RECORDS_FROM_DURABLE_STORE}(reviveIds, ${STORE_FIELD}, ${DURABLE_STORE_FIELD});`;
            }
            handlers.push(dedent`
                    const ${handlerName} : RecordRevivalHandler = {
                    ${CAN_REVIVE}(${REQUEST_FIELD}: ResourceRequest) {
                        const {basePath, method} = ${REQUEST_FIELD};
                        return method === '${method}' && basePath === ${resolvedPath};
                    },
                    ${REVIVE}<T>(${RESPONSE_FIELD}: FetchResponse<T>, ${STORE_FIELD}: Store, ${DURABLE_STORE_FIELD}: DurableStore) {
                        ${revivalCode}
                    },
                };
                `);
        }
    }

    const imports = [
        'import { ResourceRequest, FetchResponse, Store, ResourceResponse } from "@ldsjs/engine"',
        'import { DurableStore } from "@ldsjs/environments"',
        'import { extractRecordIds } from "../../util/records"',
        `import { ${REVIVE_RECORDS_FROM_DURABLE_STORE} } from "../../environments/util/revive"`,
        'import { ObjectCreate, ObjectKeys } from "../../util/language"',
    ].join('\n');

    const interfaceDef = dedent`
    export interface RecordRevivalHandler {
        ${CAN_REVIVE}(${REQUEST_FIELD}: ResourceRequest): boolean;
        ${REVIVE}<T>(
            ${RESPONSE_FIELD}: ResourceResponse<T>,
            ${STORE_FIELD}: Store,
            ${DURABLE_STORE_FIELD}: DurableStore
        ): Promise<void>;
    }
    `;

    const handlerExport = dedent`export const handlers =  [${exports.join(',')}]`;
    const dir = path.join(compilerConfig.outputDir, 'records');
    mkdirp.sync(dir);

    const code = [imports, interfaceDef, handlers.join('\n\n'), handlerExport].join('\n\n');

    fs.writeFileSync(path.join(dir, 'revival.ts'), code);
}

module.exports = generateRecordRevivalHandlers;
