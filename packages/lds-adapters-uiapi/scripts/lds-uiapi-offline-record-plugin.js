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

const RETRIEVER_INTERFACE_NAME = 'ResponsePropertyRetriever';
const RETRIEVED_TYPE_NAME = 'RetrievedProperty';
const RECORD_REPRESENTATION = 'RecordRepresentation';
const CAN_RETRIEVE = 'canRetrieve';
const RETRIEVE = 'retrieve';
const RESPONSE_FIELD = 'response';
const REQUEST_FIELD = 'request';

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
function generateRecordRetrievers(compilerConfig, modelInfo) {
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
            const retrieverName = `${name}${RETRIEVER_INTERFACE_NAME}`;

            exports.push(retrieverName);

            const recordPath = recordPathIds[0];
            const type = recordPaths[recordPath];
            let retrieveCode = '';

            if (type === 'object') {
                retrieveCode = `const record = ${recordPath};
                        if(record === undefined) {
                            return [];
                        }

                        const retrieved: ${RETRIEVED_TYPE_NAME}<${RECORD_REPRESENTATION}>[] = [];
                        retrieveNestedRecords(record, retrieved);
                        return retrieved;`;
            } else if (type === 'array') {
                retrieveCode = `const records = ${recordPath};
                        if(records === undefined) {
                            return [];
                        }

                        const retrieved: ${RETRIEVED_TYPE_NAME}<${RECORD_REPRESENTATION}>[] = [];
                        for(let i=0, len=records.length; i < len; i++){
                            const record = records[i];
                            retrieveNestedRecords(record, retrieved);
                        }
                        return retrieved;`;
            } else if (type === 'map') {
                retrieveCode = `const records = ${recordPath};
                        if(records === undefined) {
                            return [];
                        }
                        const ids = ObjectKeys(records);
                        const recordsArray = [];
                        for (let i = 0, len = ids.length; i < len; i++) {
                            const id = ids[i];
                            const record = records[id];
                            recordsArray.push(record);
                        }

                        const retrieved: ${RETRIEVED_TYPE_NAME}<${RECORD_REPRESENTATION}>[] = [];
                        for(let i=0, len=recordsArray.length; i < len; i++){
                            const record = recordsArray[i];
                            retrieveNestedRecords(record, retrieved);
                        }
                        return retrieved;`;
            }
            handlers.push(dedent`
                    const ${retrieverName} : ${RETRIEVER_INTERFACE_NAME}<unknown, ${RECORD_REPRESENTATION}> = {
                    ${CAN_RETRIEVE}(${REQUEST_FIELD}: ResourceRequest) {
                        const {basePath, method} = ${REQUEST_FIELD};
                        return method === '${method}' && basePath === ${resolvedPath};
                    },
                    ${RETRIEVE}(${RESPONSE_FIELD}: ResourceResponse<unknown>) {
                        ${retrieveCode}
                    },
                };
                `);
        }
    }

    const imports = [
        'import { ResourceRequest, FetchResponse, ResourceResponse } from "@ldsjs/engine"',
        `import { ${RETRIEVER_INTERFACE_NAME}, ${RETRIEVED_TYPE_NAME} } from "@ldsjs/environments"`,
        `import { isSpanningRecord } from "../../selectors/record";`,
        'import { ObjectKeys } from "../../util/language"',
        `import { ${RECORD_REPRESENTATION} } from "../types/${RECORD_REPRESENTATION}"`,
        `import { keyBuilderFromType } from "../../raml-artifacts/types/${RECORD_REPRESENTATION}/keyBuilderFromType"`,
    ].join('\n');

    const helperDef = dedent`
    function retrieveNestedRecords(record: ${RECORD_REPRESENTATION}, retrievedRecords: ${RETRIEVED_TYPE_NAME}<${RECORD_REPRESENTATION}>[]) {
        // put the passed in record in
        retrievedRecords.push({data: record, cacheKey: keyBuilderFromType(record)});

        // loop through fields for nested records
        const fieldNames = ObjectKeys(record.fields);
        for (let i = 0, len = fieldNames.length; i < len; i++) {
            const fieldName = fieldNames[i];
            const { value: fieldValue } = record.fields[fieldName];

            if (isSpanningRecord(fieldValue)) {
                retrieveNestedRecords(fieldValue, retrievedRecords);
            }
        }
    }
    `;

    const handlerExport = dedent`export const response${RECORD_REPRESENTATION}Retrievers =  [${exports.join(
        ','
    )}]`;
    const dir = path.join(compilerConfig.outputDir, 'records');
    mkdirp.sync(dir);

    const code = [imports, helperDef, handlers.join('\n\n'), handlerExport].join('\n\n');

    fs.writeFileSync(path.join(dir, 'retrievers.ts'), code);
}

module.exports = generateRecordRetrievers;
