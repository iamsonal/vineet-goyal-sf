import { parseAndVisit } from '@luvio/graphql-parser';
import { transform } from '../ast-parser';
import { sql } from '../ast-to-sql';
import infoJson from './mockData/objectInfos.json';
import { unwrappedValue } from '../Result';
import { ObjectInfoMap } from '../info-types';

const objectInfoMap = infoJson as ObjectInfoMap;
const sqlMappingInput = {
    jsonColumn: 'TABLE_1_1',
    keyColumn: 'TABLE_1_0',
    jsonTable: 'TABLE_1',
};

const parserInput = {
    userId: 'MyId',
    objectInfoMap,
};

const picklistQuery = (predicate) => {
    return /* GraphQL */ `
        query picklistPredicate {
            uiapi {
                query {
                    # ResourceType is a input type of Picklist
                    ServiceResource(where: { ResourceType: { ${predicate} }}) @connection {
                        edges {
                            node @resource(type: "Record") {
                                ResourceType {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
    `;
};

describe('filter sql', () => {
    it('should return the correct sql with Picklist filter predicates for eq operator', () => {
        const predicate = `eq: "T"`;
        const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
        expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
    });

    it('should return the correct sql with Picklist filter predicates for ne operator', () => {
        const predicate = `ne: "T"`;
        const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
        expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
    });

    it('should return the correct sql with Picklist filter predicates for IN operator', () => {
        const predicate = `in: ["T"]`;
        const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
        expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
    });

    it('should return the correct sql with Picklist filter predicates for NIN operator', () => {
        const predicate = `nin: ["T"]`;
        const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
        expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
    });
});
