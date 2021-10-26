import { transform } from '../ast-parser';
import * as parser from '@salesforce/lds-graphql-parser';
import infoJson from './mockData/objectInfos.json';
import { unwrappedValue } from '../Result';
import { ObjectInfoMap } from '../info-types';
import { sql } from '../ast-to-sql';
import { makeGraphQL } from './util';

const objectInfoMap = infoJson as ObjectInfoMap;
const sqlMappingInput = {
    jsonColumn: 'TABLE_1_1',
    keyColumn: 'TABLE_1_0',
    jsonTable: 'TABLE_1',
};

describe('ast-parser', () => {
    describe('MINE scope', () => {
        it('results in correct predicate', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheet(scope: MINE) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        TimeSheetNumber {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
                `'$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( ` +
                `json_extract("TimeSheet.JSON", '$.data.fields.OwnerId.value') = 'MyId' AND ` +
                `json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) ` +
                `)) ) as json`;
            const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
            expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
        });
    });

    it('uses id field for edge values', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ` +
            `)) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('includes first arg in output', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet(first: 49) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' LIMIT 49` +
            `)) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('includes assignedtome predicate', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        ServiceAppointment(scope: ASSIGNEDTOME) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.ServiceAppointment.edges', ` +
            `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("ServiceAppointment.JSON", '$.data.id')), '$.node._drafts', (json_extract("ServiceAppointment.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'ServiceAppointment'.TABLE_1_1 as 'ServiceAppointment.JSON' FROM recordsCTE as 'ServiceAppointment' ` +
            ` WHERE ( ` +
            `EXISTS (` +
            `SELECT 'ServiceResource'.TABLE_1_1 as 'ServiceResource.JSON', ` +
            `'AssignedResource'.TABLE_1_1 as 'AssignedResource.JSON' FROM recordsCTE as 'AssignedResource' ` +
            `join recordsCTE as 'ServiceResource' WHERE ` +
            `( json_extract("AssignedResource.JSON", '$.data.fields.ServiceResourceId.value') = json_extract("ServiceResource.JSON", '$.data.id') AND ` +
            `json_extract("AssignedResource.JSON", '$.data.fields.ServiceAppointmentId.value') = json_extract("ServiceAppointment.JSON", '$.data.id') AND ` +
            `json_extract("ServiceResource.JSON", '$.data.fields.RelatedRecordId.value') = 'MyId' AND ` +
            `json_extract("AssignedResource.JSON", '$.data.apiName') = 'AssignedResource' AND ` +
            `json_extract("ServiceResource.JSON", '$.data.apiName') = 'ServiceResource' ) ) AND ` +
            `json_extract("ServiceAppointment.JSON", '$.data.apiName') = 'ServiceAppointment' ) )) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('transforms GraphQL operation into a custom AST', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetNumber {
                                        value
                                        displayValue
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')), ` +
            `'$.node.TimeSheetNumber.displayValue', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.displayValue')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' )) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('transforms GraphQL query with multiple fields', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetNumber {
                                        value
                                        displayValue
                                    }

                                    OwnerId {
                                        value
                                        displayValue
                                    }

                                    IsDeleted {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')), ` +
            `'$.node.TimeSheetNumber.displayValue', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.displayValue')), ` +
            `'$.node.OwnerId.value', (json_extract("TimeSheet.JSON", '$.data.fields.OwnerId.value')), ` +
            `'$.node.OwnerId.displayValue', (json_extract("TimeSheet.JSON", '$.data.fields.OwnerId.displayValue')), ` +
            `'$.node.IsDeleted.value', (json_extract("TimeSheet.JSON", '$.data.fields.IsDeleted.value')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' )) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('transforms spanning record GraphQL operation', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    CreatedBy {
                                        Email {
                                            value
                                            displayValue
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.CreatedBy.Email.value', (json_extract("TimeSheet.CreatedBy.JSON", '$.data.fields.Email.value')), ` +
            `'$.node.CreatedBy.Email.displayValue', (json_extract("TimeSheet.CreatedBy.JSON", '$.data.fields.Email.displayValue')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT ` +
            `'TimeSheet.CreatedBy'.TABLE_1_1 as 'TimeSheet.CreatedBy.JSON', ` +
            `'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet' ` +
            `join recordsCTE as 'TimeSheet.CreatedBy' ` +
            `WHERE ( ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("TimeSheet.JSON", '$.data.fields.CreatedById.value') = json_extract("TimeSheet.CreatedBy.JSON", '$.data.id') AND ` +
            `json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) ` +
            `as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('transforms GraphQL query with multiple root record types each having spanning fields', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    CreatedBy {
                                        Email {
                                            value
                                            displayValue
                                        }
                                    }
                                }
                            }
                        }

                        User @connection {
                            edges {
                                node @resource(type: "Record") {
                                    CreatedBy {
                                        Email {
                                            value
                                            displayValue
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', ` +
            //timesheet records
            `'$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.CreatedBy.Email.value', (json_extract("TimeSheet.CreatedBy.JSON", '$.data.fields.Email.value')), ` +
            `'$.node.CreatedBy.Email.displayValue', (json_extract("TimeSheet.CreatedBy.JSON", '$.data.fields.Email.displayValue')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT ` +
            `'TimeSheet.CreatedBy'.TABLE_1_1 as 'TimeSheet.CreatedBy.JSON', ` +
            `'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet' join recordsCTE as 'TimeSheet.CreatedBy' WHERE ( ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("TimeSheet.JSON", '$.data.fields.CreatedById.value') = json_extract("TimeSheet.CreatedBy.JSON", '$.data.id') AND ` +
            `json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )), ` +
            //user records
            `'$.data.uiapi.query.User.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.CreatedBy.Email.value', (json_extract("User.CreatedBy.JSON", '$.data.fields.Email.value')), ` +
            `'$.node.CreatedBy.Email.displayValue', (json_extract("User.CreatedBy.JSON", '$.data.fields.Email.displayValue')), '$.node._drafts', (json_extract("User.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT ` +
            `'User.CreatedBy'.TABLE_1_1 as 'User.CreatedBy.JSON', ` +
            `'User'.TABLE_1_1 as 'User.JSON' ` +
            `FROM recordsCTE as 'User' join recordsCTE as 'User.CreatedBy' WHERE ( ` +
            `json_extract("User.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("User.JSON", '$.data.fields.CreatedById.value') = json_extract("User.CreatedBy.JSON", '$.data.id') AND json_extract("User.JSON", '$.data.apiName') = 'User' ) )) ` +
            `) as json`;
        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('transforms child record GraphQL operation', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetEntries @connection {
                                        edges {
                                            node @resource(type: "Record") {
                                                Id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.TimeSheetEntries.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.Id', (json_extract("TimeSheet.TimeSheetEntries.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.TimeSheetEntries.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'TimeSheet.TimeSheetEntries'.TABLE_1_1 as 'TimeSheet.TimeSheetEntries.JSON' ` +
            `FROM recordsCTE as 'TimeSheet.TimeSheetEntries'  ` +
            `WHERE ( json_extract("TimeSheet.TimeSheetEntries.JSON", '$.data.apiName') = 'TimeSheetEntry' AND ` +
            `json_extract("TimeSheet.TimeSheetEntries.JSON", '$.data.fields.TimeSheetId.value') = json_extract("TimeSheet.JSON", '$.data.id') ) )), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' )) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    it('where argument join information is reflected in connection', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet(where: { CreatedBy: { CreatedBy: { Email: { eq: "xyz" } } } })
                            @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetNumber {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT ` +
            `'TimeSheet.CreatedBy.CreatedBy'.TABLE_1_1 as 'TimeSheet.CreatedBy.CreatedBy.JSON', ` +
            `'TimeSheet.CreatedBy'.TABLE_1_1 as 'TimeSheet.CreatedBy.JSON', ` +
            `'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet' ` +
            `join recordsCTE as 'TimeSheet.CreatedBy.CreatedBy' ` +
            `join recordsCTE as 'TimeSheet.CreatedBy' ` +
            `WHERE ( ` +
            `json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.fields.Email.value') = 'xyz' AND ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.fields.CreatedById.value') = json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.id') AND ` +
            `json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("TimeSheet.JSON", '$.data.fields.CreatedById.value') = ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.id') AND ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) ` +
            `)) ) as json`;

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });

    const grandParentNot = /* GraphQL */ ` { 
        CreatedBy: { 
            CreatedBy: {
                not: { 
                    Email: { eq: "xyz" } 
                }
                Email: { eq: "abc" }
            } 
        }
    }`;

    const parentNot = /* GraphQL */ ` { 
        CreatedBy: { 
            not: { 
                CreatedBy: {
                        Email: { eq: "xyz" } 
                }
            }
            CreatedBy: {
                Email: { eq: "abc" } 
            } 
        }
    }`;

    const rootNot = /* GraphQL */ ` { 
        not: { 
            CreatedBy: { 
                CreatedBy: {
                        Email: { eq: "xyz" } 
                }
            }
        }
        CreatedBy: { 
            CreatedBy: {
                    Email: { eq: "abc" } 
            }
        }
    }`;

    it.each([
        ['grand parent', grandParentNot],
        ['parent', parentNot],
        ['root', rootNot],
    ])('not at %s level produces correct NOT sql', (_, source) => {
        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', (SELECT json_group_array(json_set('{}', ` +
            `'$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')) )) ` +
            `FROM (SELECT ` +
            `'TimeSheet.CreatedBy.CreatedBy'.TABLE_1_1 as 'TimeSheet.CreatedBy.CreatedBy.JSON', ` +
            `'TimeSheet.CreatedBy'.TABLE_1_1 as 'TimeSheet.CreatedBy.JSON', ` +
            `'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet' ` +
            `join recordsCTE as 'TimeSheet.CreatedBy.CreatedBy' ` +
            `join recordsCTE as 'TimeSheet.CreatedBy' ` +
            `WHERE ( ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.fields.CreatedById.value') = json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.id') AND ` +
            `json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("TimeSheet.JSON", '$.data.fields.CreatedById.value') = json_extract("TimeSheet.CreatedBy.JSON", '$.data.id') AND ` +
            `json_extract("TimeSheet.CreatedBy.JSON", '$.data.apiName') = 'User' AND ` +
            `json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' AND ` +
            `NOT (json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.fields.Email.value') = 'xyz') AND ` +
            `json_extract("TimeSheet.CreatedBy.CreatedBy.JSON", '$.data.fields.Email.value') = 'abc' ) ` +
            `)) ) as json`;

        const graphqlSource = makeGraphQL(source, 'TimeSheetNumber {value}');
        const result = transform(parser.default(graphqlSource), {
            userId: 'MyId',
            objectInfoMap,
        });

        expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expected);
    });
});
